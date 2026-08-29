import cv2
from fastapi import HTTPException

from app.database.connection import get_db_connection


# =========================================================
# GET CAMERA RTSP URL
# =========================================================

def get_camera_rtsp_url(camera_id: int):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                id,
                camera_id,
                name,
                rtsp_url,
                status
            FROM cameras
            WHERE id = %s
            """,
            (camera_id,)
        )

        camera = cursor.fetchone()

        if camera is None:
            raise HTTPException(
                status_code=404,
                detail="Camera not found"
            )

        if not camera["rtsp_url"]:
            raise HTTPException(
                status_code=400,
                detail="RTSP URL is not configured"
            )

        return camera

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GENERATE CAMERA FRAMES
# =========================================================

def generate_camera_frames(
    camera_id: int
):

    camera = get_camera_rtsp_url(
        camera_id
    )

    rtsp_url = camera["rtsp_url"]

    cap = cv2.VideoCapture(
        rtsp_url
    )

    if not cap.isOpened():

        raise HTTPException(
            status_code=503,
            detail="Unable to connect to camera"
        )

    try:

        while True:

            success, frame = cap.read()

            if not success:
                break

            success, buffer = cv2.imencode(
                ".jpg",
                frame
            )

            if not success:
                continue

            frame_bytes = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n"
            )

    finally:

        cap.release()
