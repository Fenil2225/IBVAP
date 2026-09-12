import os
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

    video = get_video_by_id(video_id)

    if video is None:
        return None

    video_path = video["file_path"]
    camera_id = video["camera_id"]

    # -----------------------------------------------------
    # CHECK VIDEO FILE
    # -----------------------------------------------------

    if not os.path.exists(video_path):

        update_video_status(
            video_id,
            "failed"
        )

        return None

    # -----------------------------------------------------
    # PROCESSING STATUS
    # -----------------------------------------------------

    update_video_status(
        video_id,
        "processing"
    )

    # -----------------------------------------------------
    # GET ACTIVE ZONES
    # -----------------------------------------------------

    zones = get_active_zones(camera_id)

    # -----------------------------------------------------
    # FRAME DIRECTORY
    # -----------------------------------------------------

    frames_dir = os.path.join(
        "uploads",
        "frames",
        str(video_id)
    )

    os.makedirs(
        frames_dir,
        exist_ok=True
    )

    # -----------------------------------------------------
    # OPEN VIDEO
    # -----------------------------------------------------

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():

        update_video_status(
            video_id,
            "failed"
        )

        return None

    # -----------------------------------------------------
    # COUNTERS
    # -----------------------------------------------------

    frame_count = 0
    saved_frames = 0

    total_detections = 0
    person_count = 0
    vehicle_count = 0
    intrusion_count = 0

    alert_count = 0

    # -----------------------------------------------------
    # PROCESS FRAMES
    # -----------------------------------------------------

    try:

        while True:

            success, frame = cap.read()

            if not success:
                break

            frame_count += 1

            # Process every 30th frame
            if frame_count % 30 != 0:
                continue

            # =================================================
            # SAVE FRAME
            # =================================================

            frame_name = f"frame_{frame_count}.jpg"

            frame_path = os.path.join(
                frames_dir,
                frame_name
            )

            cv2.imwrite(
                frame_path,
                frame
            )

            saved_frames += 1

            # =================================================
            # YOLO DETECTION
            # =================================================

            detections = detect_objects(
                frame_path
            )

            # =================================================
            # NORMAL DETECTIONS
            # =================================================

            for detection in detections:

                detection_type = detection.get(
                    "detection_type"
                )

                confidence = detection.get(
                    "confidence"
                )

                tracking_id = detection.get(
                    "tracking_id"
                )

                # -------------------------------------------------
                # SAVE DETECTION
                # -------------------------------------------------

                detection_id = save_detection(

                    camera_id=camera_id,

                    detection_type=detection_type,

                    confidence=confidence,

                    tracking_id=tracking_id
                )

                total_detections += 1

                # -------------------------------------------------
                # COUNTS
                # -------------------------------------------------

                if detection_type == "person":

                    person_count += 1

                elif detection_type == "vehicle":

                    vehicle_count += 1

            # =================================================
            # INTRUSION CHECK
            # =================================================

            if zones and detections:

                intrusion_detections = check_intrusion(
                    detections,
                    zones
                )

                for intrusion in intrusion_detections:

                    intrusion_confidence = intrusion.get(
                        "confidence",
                        0
                    )

                    intrusion_tracking_id = intrusion.get(
                        "tracking_id"
                    )

                    # -------------------------------------------------
                    # SAVE INTRUSION DETECTION
                    # -------------------------------------------------

                    intrusion_detection_id = save_detection(

                        camera_id=camera_id,

                        detection_type="intrusion",

                        confidence=intrusion_confidence,

                        tracking_id=intrusion_tracking_id
                    )

                    intrusion_count += 1
                    total_detections += 1

                    # =================================================
                    # CREATE ALERT
                    # =================================================

                    create_alert(

                        camera_id=camera_id,

                        detection_id=intrusion_detection_id,

                        alert_type="intrusion",

                        severity="high",

                        description=(
                            "Intrusion detected in restricted zone"
                        )
                    )

                    alert_count += 1

    except Exception:

        update_video_status(
            video_id,
            "failed"
        )

        raise

    finally:

        cap.release()

    try:
        anpr_result = process_anpr_video(
            video_path,
            video_id=video_id,
            camera_id=camera_id,
        )
    except Exception:
        update_video_status(
            video_id,
            "failed"
        )
        raise

    # =========================================================
    # PROCESSING COMPLETED
    # =========================================================

    update_video_status(
        video_id,
        "processed"
    )

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

        "frames_directory": frames_dir
    }