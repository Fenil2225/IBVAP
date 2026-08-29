from app.database.connection import get_db_connection


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