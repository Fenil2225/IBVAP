from app.database.connection import get_db_connection


def save_detection(
    camera_id: int,
    detection_type: str,
    confidence: float,
    tracking_id: str = None
):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            INSERT INTO detections
            (
                camera_id,
                detection_type,
                confidence,
                tracking_id
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                camera_id,
                detection_type,
                confidence,
                tracking_id
            )
        )

        connection.commit()

        detection_id = cursor.lastrowid

        return detection_id

    except Exception:

        if connection:
            connection.rollback()

        raise

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


def get_camera_detections(camera_id: int):

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
                detection_type,
                confidence,
                tracking_id,
                detected_at
            FROM detections
            WHERE camera_id = %s
            ORDER BY detected_at DESC
            """,
            (camera_id,)
        )

        return cursor.fetchall()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()