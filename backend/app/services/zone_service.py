from app.database.connection import get_db_connection


def _zone_query():
    return """
        SELECT
            restricted_zones.id,
            restricted_zones.camera_id,
            cameras.name AS camera_name,
            restricted_zones.zone_name,
            restricted_zones.x1,
            restricted_zones.y1,
            restricted_zones.x2,
            restricted_zones.y2,
            restricted_zones.is_active
        FROM restricted_zones
        INNER JOIN cameras ON cameras.id = restricted_zones.camera_id
    """


def get_active_zones(camera_id: int):

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
                zone_name,
                x1,
                y1,
                x2,
                y2
            FROM restricted_zones
            WHERE camera_id = %s
            AND is_active = TRUE
            """,
            (camera_id,)
        )

        return cursor.fetchall()

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


def get_all_zones():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(_zone_query() + " ORDER BY restricted_zones.id DESC")
        return cursor.fetchall()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def get_zone_by_id(zone_id: int):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(_zone_query() + " WHERE restricted_zones.id = %s", (zone_id,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def _camera_exists(cursor, camera_id: int):
    cursor.execute("SELECT id FROM cameras WHERE id = %s", (camera_id,))
    return cursor.fetchone() is not None


def create_zone(zone):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        if not _camera_exists(cursor, zone.camera_id):
            raise ValueError("Camera not found")
        cursor.execute(
            """
            INSERT INTO restricted_zones
                (camera_id, zone_name, x1, y1, x2, y2, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (zone.camera_id, zone.zone_name.strip(), zone.x1, zone.y1, zone.x2, zone.y2, zone.is_active),
        )
        connection.commit()
        return get_zone_by_id(cursor.lastrowid)
    except Exception:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def update_zone(zone_id: int, zone):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        if not _camera_exists(cursor, zone.camera_id):
            raise ValueError("Camera not found")
        cursor.execute(
            """
            UPDATE restricted_zones
            SET camera_id = %s, zone_name = %s, x1 = %s, y1 = %s,
                x2 = %s, y2 = %s, is_active = %s
            WHERE id = %s
            """,
            (zone.camera_id, zone.zone_name.strip(), zone.x1, zone.y1, zone.x2, zone.y2, zone.is_active, zone_id),
        )
        if cursor.rowcount == 0:
            return None
        connection.commit()
        return get_zone_by_id(zone_id)
    except Exception:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def delete_zone(zone_id: int):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM restricted_zones WHERE id = %s", (zone_id,))
        if cursor.rowcount == 0:
            return False
        connection.commit()
        return True
    except Exception:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()