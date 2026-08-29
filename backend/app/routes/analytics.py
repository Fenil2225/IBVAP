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
            SELECT COUNT(*) AS total_videos
            FROM videos
            """
        )
        total_videos = cursor.fetchone()["total_videos"]

        cursor.execute(
            """
            SELECT COUNT(*) AS total_detections
            FROM detections
            """
        )
        total_detections = cursor.fetchone()["total_detections"]

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
            SELECT COUNT(*) AS resolved_alerts
            FROM alerts
            WHERE status = 'resolved'
            """
        )
        resolved_alerts = cursor.fetchone()["resolved_alerts"]

        return {
            "success": True,
            "data": {
                "cameras": {
                    "total": total_cameras,
                    "online": online_cameras,
                    "offline": offline_cameras
                },
                "videos": {
                    "total": total_videos
                },
                "detections": {
                    "total": total_detections
                },
                "alerts": {
                    "total": total_alerts,
                    "unacknowledged": unacknowledged_alerts,
                    "resolved": resolved_alerts
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