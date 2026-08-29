from app.database.connection import get_db_connection


def get_dashboard_summary():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # =====================================================
        # CAMERA STATISTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_cameras,
                COALESCE(SUM(status = 'online'), 0) AS online_cameras,
                COALESCE(SUM(status = 'offline'), 0) AS offline_cameras
            FROM cameras
            """
        )

        camera_stats = cursor.fetchone()

        # =====================================================
        # VIDEO STATISTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_videos,
                COALESCE(SUM(status = 'processed'), 0) AS processed_videos,
                COALESCE(SUM(status = 'processing'), 0) AS processing_videos,
                COALESCE(SUM(status = 'failed'), 0) AS failed_videos
            FROM videos
            """
        )

        video_stats = cursor.fetchone()

        # =====================================================
        # DETECTION STATISTICS
        # =====================================================

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
                    SUM(detection_type = 'intrusion'),
                    0
                ) AS intrusion_detections
            FROM detections
            """
        )

        detection_stats = cursor.fetchone()

        # =====================================================
        # ALERT STATISTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_alerts,
                COALESCE(
                    SUM(status = 'unacknowledged'),
                    0
                ) AS unacknowledged_alerts,
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

        alert_stats = cursor.fetchone()

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return {
            "total_cameras": int(
                camera_stats["total_cameras"]
            ),
            "online_cameras": int(
                camera_stats["online_cameras"]
            ),
            "offline_cameras": int(
                camera_stats["offline_cameras"]
            ),

            "total_videos": int(
                video_stats["total_videos"]
            ),
            "processed_videos": int(
                video_stats["processed_videos"]
            ),
            "processing_videos": int(
                video_stats["processing_videos"]
            ),
            "failed_videos": int(
                video_stats["failed_videos"]
            ),

            "total_detections": int(
                detection_stats["total_detections"]
            ),
            "person_detections": int(
                detection_stats["person_detections"]
            ),
            "vehicle_detections": int(
                detection_stats["vehicle_detections"]
            ),
            "intrusion_detections": int(
                detection_stats["intrusion_detections"]
            ),

            "total_alerts": int(
                alert_stats["total_alerts"]
            ),
            "unacknowledged_alerts": int(
                alert_stats["unacknowledged_alerts"]
            ),
            "high_alerts": int(
                alert_stats["high_alerts"]
            ),
            "critical_alerts": int(
                alert_stats["critical_alerts"]
            )
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()