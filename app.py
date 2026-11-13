import base64
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import time
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from mysql.connector import Error as MySQLError
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PRODUCTS = [
    {
        "id": 1,
        "name": "Seer Fish",
        "price": 850,
        "image": "https://upload.wikimedia.org/wikipedia/commons/e/ed/Scomberomorus_guttatus.jpg",
    },
    {
        "id": 2,
        "name": "Red Snapper",
        "price": 650,
        "image": "https://upload.wikimedia.org/wikipedia/commons/3/34/Lutjanus_campechanus_SI.jpg",
    },
    {
        "id": 3,
        "name": "Pomfret",
        "price": 750,
        "image": "https://upload.wikimedia.org/wikipedia/commons/4/43/Silver_Pomfret_%28_Pampus_argenteus%29.jpg",
    },
    {
        "id": 4,
        "name": "Sardines",
        "price": 200,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Sardines_-_%E9%B0%AF%28%E3%81%84%E3%82%8F%E3%81%97%29.jpg/960px-Sardines_-_%E9%B0%AF%28%E3%81%84%E3%82%8F%E3%81%97%29.jpg",
    },
    {
        "id": 5,
        "name": "Mackerel",
        "price": 300,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Homemade_fish_smoking_-_Raw_mackerel_prepared_for_smoking.jpg/960px-Homemade_fish_smoking_-_Raw_mackerel_prepared_for_smoking.jpg",
    },
    {
        "id": 6,
        "name": "Tilapia",
        "price": 250,
        "image": "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?auto=format&fit=crop&w=700&q=85",
    },
    {
        "id": 7,
        "name": "Prawns",
        "price": 550,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Raw_shrimp.jpg/960px-Raw_shrimp.jpg",
    },
    {
        "id": 8,
        "name": "Crab",
        "price": 450,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Cancer_pagurus.jpg/960px-Cancer_pagurus.jpg",
    },
    {
        "id": 9,
        "name": "Lobster",
        "price": 1200,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Lobster_--_Auckland_Fish_Market_and_Seafood_School_in_New_Zealand_%2850871669937%29.jpg/960px-Lobster_--_Auckland_Fish_Market_and_Seafood_School_in_New_Zealand_%2850871669937%29.jpg",
    },
    {
        "id": 10,
        "name": "Squid",
        "price": 400,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Sepioteuthis_sepioidea_%28Caribbean_Reef_Squid%29.jpg/960px-Sepioteuthis_sepioidea_%28Caribbean_Reef_Squid%29.jpg",
    },
    {
        "id": 11,
        "name": "Tuna",
        "price": 600,
        "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Tuna_assortment.png/500px-Tuna_assortment.png",
    },
    {
        "id": 12,
        "name": "Fish Fillet",
        "price": 500,
        "image": "https://upload.wikimedia.org/wikipedia/commons/1/15/Raw_frozen_barramundi_fillet_cropped.jpg",
    },
]

app = FastAPI(title="KADALARASAN API")
SESSION_MAX_AGE = 12 * 60 * 60
PASSWORD_HASH_ITERATIONS = 310_000


def is_placeholder_setting(value):
    return value.strip().lower().startswith(
        ("your_", "replace_with_", "change_me", "changeme")
    )


class OrderItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)


class OrderRequest(BaseModel):
    items: list[OrderItem] = Field(min_length=1)


class EnquiryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=10, max_length=15)
    message: str = Field(min_length=1, max_length=2000)


class UserCredentials(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)


def get_session_secret():
    secret = os.getenv("AUTH_SECRET_KEY", "")
    if len(secret) < 32 or is_placeholder_setting(secret):
        raise HTTPException(
            status_code=503,
            detail=(
                "Set AUTH_SECRET_KEY in .env to a random value of at least "
                "32 characters; do not use the example placeholder."
            ),
        )
    return secret.encode("utf-8")


def hash_password(password):
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS
    )
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_HASH_ITERATIONS,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(password_hash).decode("ascii"),
    )


def verify_password(password, stored_hash):
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.b64decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(
            actual_hash, base64.b64decode(expected_hash)
        )
    except (ValueError, TypeError):
        return False


def create_session_token(username, role):
    payload = json.dumps(
        {"username": username, "role": role, "exp": int(time.time()) + SESSION_MAX_AGE},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")
    signature = hmac.new(
        get_session_secret(), encoded_payload.encode("ascii"), hashlib.sha256
    ).hexdigest()
    return "{}.{}".format(encoded_payload, signature)


def get_session(request):
    token = request.cookies.get("kadal_session")
    if not token:
        return None

    try:
        encoded_payload, signature = token.split(".", 1)
        expected_signature = hmac.new(
            get_session_secret(), encoded_payload.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return None

        payload = base64.urlsafe_b64decode(
            encoded_payload + "=" * (-len(encoded_payload) % 4)
        )
        session = json.loads(payload)
        if session["exp"] <= time.time() or session["role"] not in ("user", "admin"):
            return None
        return session
    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        return None


def set_session_cookie(response, username, role):
    response.set_cookie(
        "kadal_session",
        create_session_token(username, role),
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


def get_database_connection():
    required_settings = ("MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE")
    missing_settings = [
        setting
        for setting in required_settings
        if not os.getenv(setting) or is_placeholder_setting(os.getenv(setting, ""))
    ]
    if missing_settings:
        raise HTTPException(
            status_code=503,
            detail=(
                "MySQL is not configured. Set real MYSQL_HOST, MYSQL_USER, "
                "MYSQL_PASSWORD, and MYSQL_DATABASE values in .env; do not "
                "leave example placeholders."
            ),
        )

    try:
        return mysql.connector.connect(
            host=os.environ["MYSQL_HOST"],
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.environ["MYSQL_USER"],
            password=os.environ["MYSQL_PASSWORD"],
            database=os.environ["MYSQL_DATABASE"],
        )
    except (MySQLError, ValueError) as error:
        logger.exception("Could not connect to the configured MySQL database.")
        raise HTTPException(
            status_code=503,
            detail="Could not connect to MySQL. Check the local .env settings and database availability.",
        ) from error


def create_tables(connection):
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                items_json JSON NOT NULL,
                total BIGINT UNSIGNED NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS enquiries (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(15) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            INSERT IGNORE INTO customers (username, password_hash, created_at)
            SELECT username, password_hash, created_at FROM users
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS admins (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        admin_username = os.getenv("ADMIN_USERNAME", "").strip()
        admin_password = os.getenv("ADMIN_PASSWORD", "")
        if (
            admin_username
            and not is_placeholder_setting(admin_username)
            and len(admin_password) >= 12
            and not is_placeholder_setting(admin_password)
        ):
            cursor.execute("SELECT id, username, password_hash FROM admins")
            admins = cursor.fetchall()
            configured_admin = next(
                (admin for admin in admins if admin[1] == admin_username),
                None,
            )
            if configured_admin is not None:
                if not verify_password(admin_password, configured_admin[2]):
                    cursor.execute(
                        "UPDATE admins SET password_hash = %s WHERE id = %s",
                        (hash_password(admin_password), configured_admin[0]),
                    )
            elif len(admins) == 1:
                cursor.execute(
                    "UPDATE admins SET username = %s, password_hash = %s WHERE id = %s",
                    (
                        admin_username,
                        hash_password(admin_password),
                        admins[0][0],
                    ),
                )
            else:
                cursor.execute(
                    "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
                    (admin_username, hash_password(admin_password)),
                )
        connection.commit()
    finally:
        cursor.close()


@app.get("/api/products")
def get_products():
    return PRODUCTS


@app.post("/api/auth/register", status_code=201)
def register_user(credentials: UserCredentials, response: Response):
    get_session_secret()
    username = credentials.username.strip()
    if not re.fullmatch(r"[A-Za-z0-9_]{3,50}", username):
        raise HTTPException(
            status_code=422,
            detail="Username must be 3-50 characters and contain only letters, numbers, or underscores.",
        )

    connection = get_database_connection()
    try:
        create_tables(connection)
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO customers (username, password_hash) VALUES (%s, %s)",
                (username, hash_password(credentials.password)),
            )
            connection.commit()
        finally:
            cursor.close()
    except MySQLError as error:
        connection.rollback()
        if error.errno == 1062:
            raise HTTPException(
                status_code=409, detail="That username is already registered."
            ) from error
        logger.exception("Could not register a user in MySQL.")
        raise HTTPException(
            status_code=503,
            detail="Could not register the account. Check the MySQL database and table permissions.",
        ) from error
    finally:
        connection.close()

    set_session_cookie(response, username, "user")
    return {"username": username, "role": "user"}


@app.post("/api/auth/login")
def login_user(credentials: UserCredentials, response: Response):
    get_session_secret()
    username = credentials.username.strip()
    connection = get_database_connection()
    try:
        create_tables(connection)
        cursor = connection.cursor()
        try:
            cursor.execute(
                "SELECT password_hash FROM customers WHERE username = %s", (username,)
            )
            row = cursor.fetchone()
        finally:
            cursor.close()
    except MySQLError as error:
        logger.exception("Could not look up a user in MySQL.")
        raise HTTPException(
            status_code=503,
            detail="Could not sign in. Check the MySQL database and table permissions.",
        ) from error
    finally:
        connection.close()

    if not row or not verify_password(credentials.password, row[0]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    set_session_cookie(response, username, "user")
    return {"username": username, "role": "user"}


@app.post("/api/auth/admin/login")
def login_admin(credentials: UserCredentials, response: Response):
    get_session_secret()
    admin_username = os.getenv("ADMIN_USERNAME", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if (
        not admin_username
        or is_placeholder_setting(admin_username)
        or len(admin_password) < 12
        or is_placeholder_setting(admin_password)
    ):
        raise HTTPException(
            status_code=503,
            detail=(
                "Set ADMIN_USERNAME and a real ADMIN_PASSWORD of at least "
                "12 characters in .env; do not use example placeholders."
            ),
        )

    username = credentials.username.strip()
    connection = get_database_connection()
    try:
        create_tables(connection)
        cursor = connection.cursor()
        try:
            cursor.execute(
                "SELECT password_hash FROM admins WHERE username = %s", (username,)
            )
            row = cursor.fetchone()
        finally:
            cursor.close()
    except MySQLError as error:
        logger.exception("Could not look up an admin in MySQL.")
        raise HTTPException(
            status_code=503,
            detail="Could not sign in. Check the MySQL database and table permissions.",
        ) from error
    finally:
        connection.close()

    if not row or not verify_password(credentials.password, row[0]):
        raise HTTPException(status_code=401, detail="Invalid admin username or password.")

    set_session_cookie(response, username, "admin")
    return {"username": username, "role": "admin"}


@app.get("/api/auth/me")
def get_current_user(request: Request):
    session = get_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return {"username": session["username"], "role": session["role"]}


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        "kadal_session",
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )
    return {"ok": True}


@app.post("/api/orders", status_code=201)
def create_order(order: OrderRequest):
    products_by_id = {product["id"]: product for product in PRODUCTS}
    order_items = []
    total = 0

    for item in order.items:
        product = products_by_id.get(item.product_id)
        if product is None:
            raise HTTPException(status_code=400, detail="Unknown product in order.")

        line_total = product["price"] * item.quantity
        total += line_total
        order_items.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": item.quantity,
                "line_total": line_total,
            }
        )

    connection = get_database_connection()
    try:
        create_tables(connection)
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO orders (items_json, total) VALUES (%s, %s)",
                (json.dumps(order_items), total),
            )
            order_id = cursor.lastrowid
            connection.commit()
        finally:
            cursor.close()
    except MySQLError as error:
        connection.rollback()
        logger.exception("Could not save an order to MySQL.")
        raise HTTPException(
            status_code=503,
            detail="Could not save the order to MySQL. Check the database and table permissions.",
        ) from error
    finally:
        connection.close()

    return {"order_id": order_id, "total": total, "items": order_items}


@app.post("/api/enquiries", status_code=201)
def create_enquiry(enquiry: EnquiryRequest):
    connection = get_database_connection()
    try:
        create_tables(connection)
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO enquiries (name, phone, message) VALUES (%s, %s, %s)",
                (enquiry.name.strip(), enquiry.phone.strip(), enquiry.message.strip()),
            )
            enquiry_id = cursor.lastrowid
            connection.commit()
        finally:
            cursor.close()
    except MySQLError as error:
        connection.rollback()
        logger.exception("Could not save an enquiry to MySQL.")
        raise HTTPException(
            status_code=503,
            detail="Could not save the enquiry to MySQL. Check the database and table permissions.",
        ) from error
    finally:
        connection.close()

    return {"enquiry_id": enquiry_id}


@app.get("/")
def serve_homepage():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/login")
def serve_user_login():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/admin/login")
def serve_admin_login():
    return FileResponse(
        BASE_DIR / "admin-login.html",
        headers={"Cache-Control": "no-store"},
    )


@app.get("/script.js")
def serve_script():
    return FileResponse(BASE_DIR / "script.js", media_type="text/javascript")


@app.get("/auth.js")
def serve_auth_script():
    return FileResponse(
        BASE_DIR / "auth.js",
        media_type="text/javascript",
        headers={"Cache-Control": "no-store"},
    )


@app.get("/style.css")
def serve_styles():
    return FileResponse(BASE_DIR / "style.css", media_type="text/css")
