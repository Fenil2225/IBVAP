import os
import time
import cv2

from app.services.ai_service import detect_objects
from app.services.detection_service import save_detection
from app.services.zone_service import get_active_zones
from app.services.intrusion_service import check_intrusion
from app.services.alert_service import create_alert
from app.services.anpr_service import process_video as process_anpr_video
from app.database.connection import get_db_connection


# =========================================================
# CREATE VIDEO DATABASE RECORD
# =========================================================

def create_video_record(
    camera_id: int,
    file_name: str,
    file_path: str,
    file_size: int
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id
            FROM cameras
            WHERE id = %s
            """,
            (camera_id,)
        )

        camera = cursor.fetchone()

        if not camera:
            raise Exception("Camera not found")

        cursor.execute(
            """
            INSERT INTO videos
            (
                camera_id,
                file_name,
                file_path,
                file_size,
                status
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                camera_id,
                file_name,
                file_path,
                file_size,
                "uploaded"
            )
        )

        connection.commit()

        video_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT
                id,
                camera_id,
                file_name,
                file_path,
                file_size,
                status,
                uploaded_at
            FROM videos
            WHERE id = %s
            """,
            (video_id,)
        )

        return cursor.fetchone()

    except Exception:
        if connection:
            connection.rollback()
        raise

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET VIDEO BY ID
# =========================================================

def get_video_by_id(video_id: int):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                camera_id,
                file_name,
                file_path,
                file_size,
                status,
                uploaded_at
            FROM videos
            WHERE id = %s
            """,
            (video_id,)
        )

        return cursor.fetchone()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# UPDATE VIDEO STATUS
# =========================================================

def update_video_status(
    video_id: int,
    video_status: str
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE videos
            SET status = %s
            WHERE id = %s
            """,
            (
                video_status,
                video_id
            )
        )

        connection.commit()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# PROCESS VIDEO
# =========================================================

def process_video(video_id: int):
    cap = None
    try:
        video = get_video_by_id(video_id)
        if video is None:
            return None

        video_path = video["file_path"]
        camera_id = video["camera_id"]
        if not os.path.exists(video_path):
            update_video_status(video_id, "failed")
            return None

        update_video_status(video_id, "processing")
        deadline = time.monotonic() + float(
            os.getenv("VIDEO_PROCESS_TIMEOUT_SECONDS", "1800")
        )
        zones = get_active_zones(camera_id)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError("Unable to open video")

        source_fps = cap.get(cv2.CAP_PROP_FPS) or 25
        # Sample ~3-5 frames per second for high-speed yet accurate detection
        sample_interval = max(1, round(source_fps / 4.0))

        frame_count = 0
        processed_frames = 0
        total_detections = 0
        person_count = 0
        vehicle_count = 0
        intrusion_count = 0
        alert_count = 0
        anpr_detections_count = 0

        # Run unified ANPR engine in the same loop
        from app.services.anpr_service import get_engine, save_detection as save_anpr_detection, delete_video_detections
        from collections import Counter
        from difflib import SequenceMatcher

        delete_video_detections(video_id)
        anpr_engine = get_engine()
        anpr_observations = []

        while True:
            if time.monotonic() > deadline:
                raise TimeoutError("Video processing exceeded its time limit")

            success, frame = cap.read()
            if not success:
                break
            frame_count += 1
            if frame_count % sample_interval != 0:
                continue

            processed_frames += 1

            # 1. Object & Intrusion Detection
            detections = detect_objects(frame)
            has_vehicle = False

            for detection in detections:
                detection_type = detection.get("detection_type")
                detection_id = save_detection(
                    camera_id=camera_id,
                    detection_type=detection_type,
                    confidence=detection.get("confidence"),
                    tracking_id=detection.get("tracking_id"),
                )
                total_detections += 1
                if detection_type == "person":
                    person_count += 1
                elif detection_type == "vehicle":
                    vehicle_count += 1
                    has_vehicle = True

            if zones and detections:
                for intrusion in check_intrusion(detections, zones):
                    intrusion_id = save_detection(
                        camera_id=camera_id,
                        detection_type="intrusion",
                        confidence=intrusion.get("confidence", 0),
                        tracking_id=intrusion.get("tracking_id"),
                    )
                    intrusion_count += 1
                    total_detections += 1
                    create_alert(
                        camera_id=camera_id,
                        detection_id=intrusion_id,
                        alert_type="intrusion",
                        severity="high",
                        description="Intrusion detected in restricted zone",
                    )
                    alert_count += 1

            # 2. ANPR Plate Detection (run on frames with vehicles or every sampled frame)
            anpr_results = anpr_engine.process_frame(frame)
            for det in anpr_results:
                anpr_observations.append({
                    "plate_number": det["plate_number"],
                    "vehicle_type": det.get("vehicle_type", "vehicle"),
                    "confidence": det.get("confidence", 0.8),
                    "ocr_confidence": det.get("ocr_confidence", 0.8),
                    "plate_crop": det.get("plate_crop", frame),
                })

        cap.release()
        cap = None

        # 3. Cluster and deduplicate observed plates
        clusters = []
        for obs in anpr_observations:
            for cluster in clusters:
                cluster_plate = cluster[0]["plate_number"]
                if SequenceMatcher(None, obs["plate_number"], cluster_plate).ratio() >= 0.75:
                    cluster.append(obs)
                    break
            else:
                clusters.append([obs])

        for plate_obs in clusters:
            voted_plate = Counter(
                o["plate_number"] for o in plate_obs
            ).most_common(1)[0][0]

            matching = [
                o for o in plate_obs
                if SequenceMatcher(None, o["plate_number"], voted_plate).ratio() >= 0.75
            ]
            best_obs = max(
                matching or plate_obs,
                key=lambda o: (o["confidence"] * 0.5 + o["ocr_confidence"] * 0.5)
            )
            confidence = min(
                1.0,
                best_obs["confidence"] * 0.5 + best_obs["ocr_confidence"] * 0.5
            )
            save_anpr_detection(
                camera_id=camera_id,
                video_id=video_id,
                plate_number=voted_plate,
                vehicle_type=best_obs["vehicle_type"],
                confidence=confidence,
                frame=best_obs["plate_crop"],
            )
            anpr_detections_count += 1

        update_video_status(video_id, "processed")
        return {
            "video_id": video_id,
            "camera_id": camera_id,
            "total_frames": frame_count,
            "processed_frames": processed_frames,
            "total_detections": total_detections,
            "person_count": person_count,
            "vehicle_count": vehicle_count,
            "intrusion_count": intrusion_count,
            "alert_count": alert_count,
            "anpr_detections": anpr_detections_count,
        }
    except Exception:
        if cap is not None:
            cap.release()
        try:
            update_video_status(video_id, "failed")
        except Exception:
            pass
        raise