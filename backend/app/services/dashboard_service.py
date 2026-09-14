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
                COALESCE(SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END), 0) AS online_cameras,
                COALESCE(SUM(CASE WHEN status != 'online' THEN 1 ELSE 0 END), 0) AS offline_cameras
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
                COALESCE(SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END), 0) AS processed_videos,
                COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0) AS processing_videos,
                COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed_videos
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
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'person' THEN 1 ELSE 0 END), 0) AS person_detections,
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'vehicle' THEN 1 ELSE 0 END), 0) AS vehicle_detections,
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'intrusion' THEN 1 ELSE 0 END), 0) AS intrusion_detections
            FROM detections
            """
        )

        detection_stats = cursor.fetchone()
        total_det = int(detection_stats["total_detections"])
        person_det = int(detection_stats["person_detections"])
        vehicle_det = int(detection_stats["vehicle_detections"])
        intrusion_det = int(detection_stats["intrusion_detections"])
        other_det = max(0, total_det - (person_det + vehicle_det + intrusion_det))

        # =====================================================
        # ALERT STATISTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_alerts,
                COALESCE(SUM(CASE WHEN status = 'unacknowledged' THEN 1 ELSE 0 END), 0) AS unacknowledged_alerts,
                COALESCE(SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END), 0) AS acknowledged_alerts,
                COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) AS resolved_alerts,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'critical' THEN 1 ELSE 0 END), 0) AS critical_alerts,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'high' THEN 1 ELSE 0 END), 0) AS high_alerts,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'medium' THEN 1 ELSE 0 END), 0) AS medium_alerts,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'low' THEN 1 ELSE 0 END), 0) AS low_alerts
            FROM alerts
            """
        )

        alert_stats = cursor.fetchone()

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return {
            "total_cameras": int(camera_stats["total_cameras"]),
            "online_cameras": int(camera_stats["online_cameras"]),
            "offline_cameras": int(camera_stats["offline_cameras"]),

            "total_videos": int(video_stats["total_videos"]),
            "processed_videos": int(video_stats["processed_videos"]),
            "processing_videos": int(video_stats["processing_videos"]),
            "failed_videos": int(video_stats["failed_videos"]),

            "total_detections": total_det,
            "person_detections": person_det,
            "vehicle_detections": vehicle_det,
            "intrusion_detections": intrusion_det,
            "other_detections": other_det,

            "total_alerts": int(alert_stats["total_alerts"]),
            "unacknowledged_alerts": int(alert_stats["unacknowledged_alerts"]),
            "acknowledged_alerts": int(alert_stats["acknowledged_alerts"]),
            "resolved_alerts": int(alert_stats["resolved_alerts"]),
            "critical_alerts": int(alert_stats["critical_alerts"]),
            "high_alerts": int(alert_stats["high_alerts"]),
            "medium_alerts": int(alert_stats["medium_alerts"]),
            "low_alerts": int(alert_stats["low_alerts"]),
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()