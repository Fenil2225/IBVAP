import os
import time
import threading
from datetime import datetime

import cv2

from app.ai.anpr_engine import ANPREngine
from app.database.connection import get_db_connection

engine = None
last_seen = {}
camera_threads = {}


def get_engine():
    global engine
    if engine is None:
        engine = ANPREngine()
    return engine


def should_save(camera_id, video_id, plate_number, cooldown=10):
    key = f"{camera_id}:{video_id}:{plate_number}"
    current_time = time.time()
    previous_time = last_seen.get(key)

    if previous_time is not None and (current_time - previous_time) < cooldown:
        return False

    last_seen[key] = current_time
    return True


def save_detection(
    camera_id,
    video_id,
    plate_number,
    vehicle_type,
    confidence,
    frame,
    output_dir="uploads/anpr"
):
    os.makedirs(output_dir, exist_ok=True)

    filename = f"plate_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
    image_path = os.path.join(output_dir, filename)
    cv2.imwrite(image_path, frame)

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO anpr_detections
        (
            camera_id,
            video_id,
            plate_number,
            vehicle_type,
            confidence,
            detected_at,
            image_path
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            camera_id,
            video_id,
            plate_number,
            vehicle_type,
            confidence,
            datetime.now(),
            image_path,
        )
    )

    connection.commit()
    detection_id = cursor.lastrowid
    cursor.close()
    connection.close()
    return detection_id


def get_all_anpr_detections():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            camera_id,
            video_id,
            plate_number,
            vehicle_type,
            confidence,
            detected_at,
            image_path
        FROM anpr_detections
        ORDER BY detected_at DESC
        """
    )

    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results


def get_anpr_detection_by_id(detection_id: int):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            camera_id,
            video_id,
            plate_number,
            vehicle_type,
            confidence,
            detected_at,
            image_path
        FROM anpr_detections
        WHERE id = %s
        """,
        (detection_id,),
    )

    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return result


def search_anpr_detections(plate_number: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            camera_id,
            video_id,
            plate_number,
            vehicle_type,
            confidence,
            detected_at,
            image_path
        FROM anpr_detections
        WHERE plate_number LIKE %s
        ORDER BY detected_at DESC
        """,
        (f"%{plate_number.upper()}%",),
    )

    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results


def process_video(video_path, video_id=None, camera_id=None):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception("Unable to open video")

    frame_count = 0
    results_count = 0
    anpr_engine = get_engine()

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame_count += 1
        if frame_count % 5 != 0:
            continue

        detections = anpr_engine.process_frame(frame)

        for detection in detections:
            plate_number = detection["plate_number"]
            if not should_save(camera_id, video_id, plate_number):
                continue

            save_detection(
                camera_id=camera_id,
                video_id=video_id,
                plate_number=plate_number,
                vehicle_type=detection["vehicle_type"],
                confidence=detection["confidence"],
                frame=frame,
            )
            results_count += 1

    cap.release()
    return {"frames_processed": frame_count, "detections": results_count}


def process_live_camera(camera_id, rtsp_url):
    cap = cv2.VideoCapture(rtsp_url)

    if not cap.isOpened():
        print(f"Camera {camera_id} connection failed")
        return

    anpr_engine = get_engine()
    frame_count = 0

    while camera_threads.get(camera_id) is True:
        success, frame = cap.read()
        if not success:
            print(f"Camera {camera_id} stream ended")
            break

        frame_count += 1
        if frame_count % 5 != 0:
            continue

        detections = anpr_engine.process_frame(frame)

        for detection in detections:
            plate_number = detection["plate_number"]
            if not should_save(camera_id, None, plate_number):
                continue

            save_detection(
                camera_id=camera_id,
                video_id=None,
                plate_number=plate_number,
                vehicle_type=detection["vehicle_type"],
                confidence=detection["confidence"],
                frame=frame,
            )

    cap.release()
    camera_threads.pop(camera_id, None)


def start_camera_anpr(camera_id, rtsp_url):
    if camera_id in camera_threads:
        return False

    camera_threads[camera_id] = True
    thread = threading.Thread(
        target=process_live_camera,
        args=(camera_id, rtsp_url),
        daemon=True,
    )
    thread.start()
    return True


def stop_camera_anpr(camera_id):
    if camera_id not in camera_threads:
        return False

    camera_threads[camera_id] = False
    return True
