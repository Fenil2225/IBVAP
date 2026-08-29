from fastapi import APIRouter, HTTPException, status

from app.database.connection import get_db_connection
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED
)
def register(user: RegisterRequest):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if email already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (user.email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Hash password
        password_hash = hash_password(user.password)

        # Insert user
        cursor.execute(
            """
            INSERT INTO users
            (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            """,
            (
                user.name,
                user.email,
                password_hash,
                user.role
            )
        )

        connection.commit()

        user_id = cursor.lastrowid

        access_token = create_access_token(
            user_id=user_id,
            role=user.role
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": True
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(error)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(user: LoginRequest):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                role,
                is_active
            FROM users
            WHERE email = %s
            """,
            (user.email,)
        )

        db_user = cursor.fetchone()

        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not db_user["is_active"]:
            raise HTTPException(
                status_code=403,
                detail="User account is disabled"
            )

        password_valid = verify_password(
            user.password,
            db_user["password_hash"]
        )

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        access_token = create_access_token(
            user_id=db_user["id"],
            role=db_user["role"]
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user["id"],
                "name": db_user["name"],
                "email": db_user["email"],
                "role": db_user["role"],
                "is_active": bool(db_user["is_active"])
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(error)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()