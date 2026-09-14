from fastapi import APIRouter, Depends

from app.routes.users import get_current_user
from app.database.connection import get_db_connection


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get("/summary")
def get_dashboard_summary(
    current_user=Depends(get_current_user)
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT COUNT(*) AS total_cameras
            FROM cameras
            """
        )
        total_cameras = cursor.fetchone()["total_cameras"]

        cursor.execute(
            """
            SELECT COUNT(*) AS online_cameras
            FROM cameras
            WHERE status = 'online'
            """
        )
        online_cameras = cursor.fetchone()["online_cameras"]

        cursor.execute(
            """
            SELECT COUNT(*) AS offline_cameras
            FROM cameras
            WHERE status = 'offline'
            """
        )
        offline_cameras = cursor.fetchone()["offline_cameras"]

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_videos,
                COALESCE(SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END), 0) AS processed,
                COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0) AS processing,
                COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
            FROM videos
            """
        )
        video_counts = cursor.fetchone()

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_detections,
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'person' THEN 1 ELSE 0 END), 0) AS person,
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'vehicle' THEN 1 ELSE 0 END), 0) AS vehicle,
                COALESCE(SUM(CASE WHEN LOWER(detection_type) = 'intrusion' THEN 1 ELSE 0 END), 0) AS intrusion
            FROM detections
            """
        )
        det_counts = cursor.fetchone()
        tot_det = int(det_counts["total_detections"])
        p_det = int(det_counts["person"])
        v_det = int(det_counts["vehicle"])
        i_det = int(det_counts["intrusion"])
        o_det = max(0, tot_det - (p_det + v_det + i_det))

        cursor.execute(
            """
            SELECT COUNT(*) AS total_alerts
            FROM alerts
            """
        )
        total_alerts = cursor.fetchone()["total_alerts"]

        cursor.execute(
            """
            SELECT COUNT(*) AS unacknowledged_alerts
            FROM alerts
            WHERE status = 'unacknowledged'
            """
        )
        unacknowledged_alerts = cursor.fetchone()["unacknowledged_alerts"]

        cursor.execute(
            """
            SELECT COUNT(*) AS acknowledged_alerts
            FROM alerts
            WHERE status = 'acknowledged'
            """
        )
        acknowledged_alerts = cursor.fetchone()["acknowledged_alerts"]

        cursor.execute(
            """
            SELECT COUNT(*) AS resolved_alerts
            FROM alerts
            WHERE status = 'resolved'
            """
        )
        resolved_alerts = cursor.fetchone()["resolved_alerts"]

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'critical' THEN 1 ELSE 0 END), 0) AS critical,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'high' THEN 1 ELSE 0 END), 0) AS high,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'medium' THEN 1 ELSE 0 END), 0) AS medium,
                COALESCE(SUM(CASE WHEN LOWER(severity) = 'low' THEN 1 ELSE 0 END), 0) AS low
            FROM alerts
            """
        )
        sev_counts = cursor.fetchone()

        return {
            "success": True,
            "data": {
                "cameras": {
                    "total": total_cameras,
                    "online": online_cameras,
                    "offline": max(0, total_cameras - online_cameras)
                },
                "videos": {
                    "total": int(video_counts["total_videos"]),
                    "processed": int(video_counts["processed"]),
                    "processing": int(video_counts["processing"]),
                    "failed": int(video_counts["failed"]),
                },
                "detections": {
                    "total": tot_det,
                    "person": p_det,
                    "vehicle": v_det,
                    "intrusion": i_det,
                    "other": o_det,
                },
                "alerts": {
                    "total": total_alerts,
                    "unacknowledged": unacknowledged_alerts,
                    "acknowledged": acknowledged_alerts,
                    "resolved": resolved_alerts,
                    "critical": int(sev_counts["critical"]),
                    "high": int(sev_counts["high"]),
                    "medium": int(sev_counts["medium"]),
                    "low": int(sev_counts["low"]),
                }
            }
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# DETECTION STATISTICS
# =========================================================

@router.get("/detections")
def get_detection_statistics(
    current_user=Depends(get_current_user)
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                detection_type,
                COUNT(*) AS total
            FROM detections
            GROUP BY detection_type
            ORDER BY total DESC
            """
        )

        results = cursor.fetchall()

        return {
            "success": True,
            "data": results
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# ALERT STATISTICS
# =========================================================

@router.get("/alerts")
def get_alert_statistics(
    current_user=Depends(get_current_user)
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                severity,
                COUNT(*) AS total
            FROM alerts
            GROUP BY severity
            ORDER BY total DESC
            """
        )

        results = cursor.fetchall()

        return {
            "success": True,
            "data": results
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# RECENT DETECTIONS
# =========================================================

@router.get("/recent-detections")
def get_recent_detections(
    current_user=Depends(get_current_user)
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                d.id,
                d.camera_id,
                c.camera_id AS camera_code,
                c.name AS camera_name,
                d.detection_type,
                d.confidence,
                d.tracking_id,
                d.detected_at
            FROM detections d
            LEFT JOIN cameras c
                ON d.camera_id = c.id
            ORDER BY d.detected_at DESC
            LIMIT 20
            """
        )

        results = cursor.fetchall()

        return {
            "success": True,
            "data": results
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# RECENT ALERTS
# =========================================================

@router.get("/recent-alerts")
def get_recent_alerts(
    current_user=Depends(get_current_user)
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                a.id,
                a.camera_id,
                c.camera_id AS camera_code,
                c.name AS camera_name,
                a.detection_id,
                a.alert_type,
                a.severity,
                a.description,
                a.status,
                a.created_at,
                a.acknowledged_at,
                a.resolved_at
            FROM alerts a
            LEFT JOIN cameras c
                ON a.camera_id = c.id
            ORDER BY a.created_at DESC
            LIMIT 20
            """
        )

        results = cursor.fetchall()

        return {
            "success": True,
            "data": results
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()