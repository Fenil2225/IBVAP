from app.database.connection import get_db_connection


# =========================================================
# ADD CAMERA
# =========================================================

def create_camera(
    camera_id: str,
    name: str,
    location: str,
    rtsp_url: str | None,
    ai_enabled: bool,
    fps: int
):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        # Check duplicate camera_id
        cursor.execute(
            """
            SELECT id
            FROM cameras
            WHERE camera_id = %s
            """,
            (camera_id,)
        )

        existing = cursor.fetchone()

        if existing:
            raise Exception(
                "Camera ID already exists"
            )

        # Insert camera
        cursor.execute(
            """
            INSERT INTO cameras
            (
                camera_id,
                name,
                location,
                rtsp_url,
                status,
                ai_enabled,
                fps
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                camera_id,
                name,
                location,
                rtsp_url,
                "offline",
                ai_enabled,
                fps
            )
        )

        connection.commit()

        new_id = cursor.lastrowid

        return get_camera_by_id(new_id)

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
# GET CAMERA BY ID
# =========================================================

def get_camera_by_id(
    camera_id: int
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
            SELECT
                id,
                camera_id,
                name,
                location,
                rtsp_url,
                status,
                ai_enabled,
                fps,
                last_seen,
                created_at
            FROM cameras
            WHERE id = %s
            """,
            (camera_id,)
        )

        return cursor.fetchone()

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET ALL CAMERAS
# =========================================================

def get_all_cameras():

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
                location,
                rtsp_url,
                status,
                ai_enabled,
                fps,
                last_seen,
                created_at
            FROM cameras
            ORDER BY id DESC
            """
        )

        return cursor.fetchall()

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# UPDATE CAMERA STATUS
# =========================================================

def update_camera_status(
    camera_id: int,
    camera_status: str
):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE cameras
            SET
                status = %s,
                last_seen = NOW()
            WHERE id = %s
            """,
            (
                camera_status,
                camera_id
            )
        )

        connection.commit()

        if cursor.rowcount == 0:
            return None

        return get_camera_by_id(
            camera_id
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET CAMERA STATUS
# =========================================================

def get_camera_status(
    camera_id: int
):

    camera = get_camera_by_id(
        camera_id
    )

    if camera is None:
        return None

    return {
        "id": camera["id"],
        "camera_id": camera["camera_id"],
        "name": camera["name"],
        "status": camera["status"],
        "last_seen": camera["last_seen"]
    }

