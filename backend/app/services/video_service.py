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
        frames_dir = os.path.join("uploads", "frames", str(video_id))
        os.makedirs(frames_dir, exist_ok=True)
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError("Unable to open video")

        frame_count = 0
        saved_frames = 0
        total_detections = 0
        person_count = 0
        vehicle_count = 0
        intrusion_count = 0
        alert_count = 0

        while True:
            if time.monotonic() > deadline:
                raise TimeoutError("Video processing exceeded its time limit")

            success, frame = cap.read()
            if not success:
                break
            frame_count += 1
            if frame_count % 30 != 0:
                continue

            frame_path = os.path.join(frames_dir, f"frame_{frame_count}.jpg")
            cv2.imwrite(frame_path, frame)
            saved_frames += 1
            detections = detect_objects(frame)

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

        cap.release()
        cap = None
        anpr_result = process_anpr_video(
            video_path,
            video_id=video_id,
            camera_id=camera_id,
            timeout_seconds=max(1, deadline - time.monotonic()),
        )
        update_video_status(video_id, "processed")
        return {
            "video_id": video_id,
            "camera_id": camera_id,
            "total_frames": frame_count,
            "processed_frames": saved_frames,
            "total_detections": total_detections,
            "person_count": person_count,
            "vehicle_count": vehicle_count,
            "intrusion_count": intrusion_count,
            "alert_count": alert_count,
            "anpr_detections": anpr_result["detections"],
            "frames_directory": frames_dir,
        }
    except Exception:
        if cap is not None:
            cap.release()
        try:
            update_video_status(video_id, "failed")
        except Exception:
            pass
        raise