import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    salt = bcrypt.gensalt()

    hashed = bcrypt.hashpw(
        password_bytes,
        salt
    )

    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(user_id: int, role: str):

    secret_key = os.getenv("JWT_SECRET")

    if not secret_key:
        raise ValueError("JWT_SECRET is not configured")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=ALGORITHM
    )

def decode_access_token(token: str):

    secret_key = os.getenv("JWT_SECRET")

    return jwt.decode(
        token,
        secret_key,
        algorithms=[ALGORITHM]
    )