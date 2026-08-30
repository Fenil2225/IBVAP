from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import get_db_connection

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes import cameras
from app.routes import videos
from app.routes import alerts
from app.routes import dashboard
from app.routes import live_camera
from app.routes import analytics
from app.routes import anpr

app = FastAPI(
    title="IBVAP API",
    description="Intelligent Border Video Analytics Platform",
    version="1.0.0"
)


import os
from fastapi.staticfiles import StaticFiles

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/anpr", exist_ok=True)
os.makedirs("uploads/videos", exist_ok=True)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Routes
# =========================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(cameras.router)
app.include_router(videos.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(live_camera.router)
app.include_router(analytics.router)
app.include_router(anpr.router)

# =========================
# Root
# =========================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "IBVAP Backend is running 🚀"
    }


# =========================
# Health Check
# =========================

@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "status": "healthy"
    }


# =========================
# Database Test
# =========================

@app.get("/api/test-db")
def test_database():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        result = cursor.fetchone()

        return {
            "success": True,
            "message": "MySQL connected successfully",
            "database": result[0]
        }

    except Exception as error:
        return {
            "success": False,
            "message": "Database connection failed",
            "error": str(error)
        }

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()