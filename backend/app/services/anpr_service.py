import os
import time
import threading
from collections import Counter
from datetime import datetime
from difflib import SequenceMatcher

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


def delete_video_detections(video_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "DELETE FROM anpr_detections WHERE video_id = %s",
            (video_id,)
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()


def get_all_anpr_detections(video_id=None):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
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
    """
    params = ()
    if video_id is not None:
        query += " WHERE video_id = %s"
        params = (video_id,)
    query += " ORDER BY detected_at DESC"
    cursor.execute(query, params)

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


def process_video(video_path, video_id=None, camera_id=None, timeout_seconds=None):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception("Unable to open video")

    frame_count = 0
    anpr_engine = get_engine()
    observations = []
    deadline = time.monotonic() + timeout_seconds if timeout_seconds is not None else None
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 25
    sample_fps = min(max(float(os.getenv("ANPR_SAMPLE_FPS", "3")), 1.0), 8.0)
    sample_interval = max(1, round(source_fps / sample_fps))

    if video_id is not None:
        delete_video_detections(video_id)

    while True:
        if deadline is not None and time.monotonic() > deadline:
            cap.release()
            raise TimeoutError("ANPR processing exceeded its time limit")
        success, frame = cap.read()
        if not success:
            break

        frame_count += 1
        if frame_count % sample_interval != 0:
            continue

        detections = anpr_engine.process_frame(frame)

        for detection in detections:
            plate_number = detection["plate_number"]
            observations.append({
                "plate_number": plate_number,
                "vehicle_type": detection["vehicle_type"],
                "confidence": detection["confidence"],
                "ocr_confidence": detection.get("ocr_confidence", 0),
                "plate_crop": detection.get("plate_crop"),
            })

    clusters = []
    for observation in observations:
        for cluster in clusters:
            cluster_plate = cluster[0]["plate_number"]
            if SequenceMatcher(None, observation["plate_number"], cluster_plate).ratio() >= 0.8:
                cluster.append(observation)
                break
        else:
            clusters.append([observation])

    results_count = 0
    for plate_observations in clusters:
        # Repeated OCR votes make a plate much less likely to be a one-frame typo.
        voted_plate = Counter(
            observation["plate_number"] for observation in plate_observations
        ).most_common(1)[0][0]
        matching = [
            observation for observation in plate_observations
            if SequenceMatcher(None, observation["plate_number"], voted_plate).ratio() >= 0.8
        ]
        best_observation = max(
            matching or plate_observations,
            key=lambda observation: (
                observation["confidence"] * 0.6
                + observation["ocr_confidence"] * 0.4
            )
        )
        confidence = min(
            1.0,
            best_observation["confidence"] * 0.6
            + best_observation["ocr_confidence"] * 0.4
        )
        save_detection(
            camera_id=camera_id,
            video_id=video_id,
            plate_number=voted_plate,
            vehicle_type=best_observation["vehicle_type"],
            confidence=confidence,
            frame=best_observation["plate_crop"],
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

            plate_crop = detection.get("plate_crop")
            capture = plate_crop if plate_crop is not None else frame

            save_detection(
                camera_id=camera_id,
                video_id=None,
                plate_number=plate_number,
                vehicle_type=detection["vehicle_type"],
                confidence=(
                    detection["confidence"] * 0.6
                    + detection.get("ocr_confidence", 0) * 0.4
                ),
                frame=capture,
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
