from app.database.connection import get_db_connection


# =========================================================
# CREATE ALERT
# =========================================================

def create_alert(
    camera_id: int,
    detection_id: int | None,
    alert_type: str,
    severity: str = "medium",
    description: str | None = None
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # Check camera exists
        # -------------------------------------------------
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

        # -------------------------------------------------
        # Validate severity
        # -------------------------------------------------
        allowed_severities = [
            "low",
            "medium",
            "high",
            "critical"
        ]

        if severity not in allowed_severities:
            raise Exception(
                "Invalid severity. Use low, medium, high or critical"
            )

        # -------------------------------------------------
        # Create alert
        # -------------------------------------------------
        cursor.execute(
            """
            INSERT INTO alerts
            (
                camera_id,
                detection_id,
                alert_type,
                severity,
                description,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                camera_id,
                detection_id,
                alert_type,
                severity,
                description,
                "unacknowledged"
            )
        )

        connection.commit()

        alert_id = cursor.lastrowid

        # -------------------------------------------------
        # Get created alert
        # -------------------------------------------------
        cursor.execute(
            """
            SELECT
                id,
                camera_id,
                detection_id,
                alert_type,
                severity,
                description,
                status,
                created_at,
                acknowledged_at,
                resolved_at
            FROM alerts
            WHERE id = %s
            """,
            (alert_id,)
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
# GET ALL ALERTS
# =========================================================

def get_all_alerts():
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
                detection_id,
                alert_type,
                severity,
                description,
                status,
                created_at,
                acknowledged_at,
                resolved_at
            FROM alerts
            ORDER BY created_at DESC
            """
        )

        return cursor.fetchall()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET ALERT BY ID
# =========================================================

def get_alert_by_id(alert_id: int):
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
                detection_id,
                alert_type,
                severity,
                description,
                status,
                created_at,
                acknowledged_at,
                resolved_at
            FROM alerts
            WHERE id = %s
            """,
            (alert_id,)
        )

        return cursor.fetchone()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# ACKNOWLEDGE ALERT
# =========================================================

def acknowledge_alert(alert_id: int):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE alerts
            SET
                status = 'acknowledged',
                acknowledged_at = NOW()
            WHERE id = %s
              AND status = 'unacknowledged'
            """,
            (alert_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return None

        return get_alert_by_id(alert_id)

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
# RESOLVE ALERT
# =========================================================

def resolve_alert(alert_id: int):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE alerts
            SET
                status = 'resolved',
                resolved_at = NOW()
            WHERE id = %s
              AND status != 'resolved'
            """,
            (alert_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return None

        return get_alert_by_id(alert_id)

    except Exception:
        if connection:
            connection.rollback()

        raise

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()
