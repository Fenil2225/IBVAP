from app.database.connection import get_db_connection


# =========================================================
# DETECTION ANALYTICS
# =========================================================

def get_detection_analytics():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_detections,

                COALESCE(
                    SUM(detection_type = 'person'),
                    0
                ) AS person_detections,

                COALESCE(
                    SUM(detection_type = 'vehicle'),
                    0
                ) AS vehicle_detections,

                COALESCE(
                    SUM(detection_type = 'face'),
                    0
                ) AS face_detections,

                COALESCE(
                    SUM(detection_type = 'number_plate'),
                    0
                ) AS number_plate_detections,

                COALESCE(
                    SUM(detection_type = 'intrusion'),
                    0
                ) AS intrusion_detections,

                COALESCE(
                    SUM(detection_type = 'loitering'),
                    0
                ) AS loitering_detections,

                COALESCE(
                    SUM(detection_type = 'night_movement'),
                    0
                ) AS night_movement_detections,

                COALESCE(
                    SUM(detection_type = 'suspicious_activity'),
                    0
                ) AS suspicious_activity_detections

            FROM detections
            """
        )

        result = cursor.fetchone()

        return {
            "total_detections": int(
                result["total_detections"]
            ),
            "person_detections": int(
                result["person_detections"]
            ),
            "vehicle_detections": int(
                result["vehicle_detections"]
            ),
            "face_detections": int(
                result["face_detections"]
            ),
            "number_plate_detections": int(
                result["number_plate_detections"]
            ),
            "intrusion_detections": int(
                result["intrusion_detections"]
            ),
            "loitering_detections": int(
                result["loitering_detections"]
            ),
            "night_movement_detections": int(
                result["night_movement_detections"]
            ),
            "suspicious_activity_detections": int(
                result["suspicious_activity_detections"]
            )
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# CAMERA ANALYTICS
# =========================================================

def get_camera_analytics():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                c.id AS camera_id,
                c.name AS camera_name,

                COUNT(d.id) AS total_detections,

                COALESCE(
                    SUM(d.detection_type = 'person'),
                    0
                ) AS person_detections,

                COALESCE(
                    SUM(d.detection_type = 'vehicle'),
                    0
                ) AS vehicle_detections,

                COALESCE(
                    SUM(d.detection_type = 'intrusion'),
                    0
                ) AS intrusion_detections

            FROM cameras c

            LEFT JOIN detections d
                ON c.id = d.camera_id

            GROUP BY
                c.id,
                c.name

            ORDER BY
                total_detections DESC
            """
        )

        results = cursor.fetchall()

        return [
            {
                "camera_id": int(row["camera_id"]),
                "camera_name": row["camera_name"],
                "total_detections": int(
                    row["total_detections"]
                ),
                "person_detections": int(
                    row["person_detections"]
                ),
                "vehicle_detections": int(
                    row["vehicle_detections"]
                ),
                "intrusion_detections": int(
                    row["intrusion_detections"]
                )
            }
            for row in results
        ]

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# ALERT ANALYTICS
# =========================================================

def get_alert_analytics():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_alerts,

                COALESCE(
                    SUM(status = 'unacknowledged'),
                    0
                ) AS unacknowledged_alerts,

                COALESCE(
                    SUM(status = 'acknowledged'),
                    0
                ) AS acknowledged_alerts,

                COALESCE(
                    SUM(status = 'resolved'),
                    0
                ) AS resolved_alerts,

                COALESCE(
                    SUM(severity = 'low'),
                    0
                ) AS low_alerts,

                COALESCE(
                    SUM(severity = 'medium'),
                    0
                ) AS medium_alerts,

                COALESCE(
                    SUM(severity = 'high'),
                    0
                ) AS high_alerts,

                COALESCE(
                    SUM(severity = 'critical'),
                    0
                ) AS critical_alerts

            FROM alerts
            """
        )

        result = cursor.fetchone()

        return {
            "total_alerts": int(
                result["total_alerts"]
            ),
            "unacknowledged_alerts": int(
                result["unacknowledged_alerts"]
            ),
            "acknowledged_alerts": int(
                result["acknowledged_alerts"]
            ),
            "resolved_alerts": int(
                result["resolved_alerts"]
            ),
            "low_alerts": int(
                result["low_alerts"]
            ),
            "medium_alerts": int(
                result["medium_alerts"]
            ),
            "high_alerts": int(
                result["high_alerts"]
            ),
            "critical_alerts": int(
                result["critical_alerts"]
            )
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# TIMELINE ANALYTICS
# =========================================================

def get_timeline_analytics(days: int = 7):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                DATE(d.detected_at) AS date,
                COUNT(d.id) AS detections,

                (
                    SELECT COUNT(a.id)
                    FROM alerts a
                    WHERE DATE(a.created_at) = DATE(d.detected_at)
                ) AS alerts

            FROM detections d

            WHERE d.detected_at >= DATE_SUB(
                CURDATE(),
                INTERVAL %s DAY
            )

            GROUP BY DATE(d.detected_at)

            ORDER BY date ASC
            """,
            (days,)
        )

        results = cursor.fetchall()

        return [
            {
                "date": str(row["date"]),
                "detections": int(
                    row["detections"]
                ),
                "alerts": int(
                    row["alerts"]
                )
            }
            for row in results
        ]

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()