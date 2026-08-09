import os
import logging
import json
import urllib.parse
import urllib.request
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, Base, get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    decode_token,
    generate_random_code,
    normalize_email,
    get_user_by_email,
    get_user_by_phone,
    get_current_user,
    get_optional_user
)
from predict import router as predict_router
from chatbot import router as chat_router
from admin import router as admin_router
from init_model import init_plant_model

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plantbot.main")

def ensure_user_schema():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("users")}
    new_columns = [
        ("phone", "VARCHAR(30)"),
        ("profile_image", "VARCHAR(255)"),
        ("is_verified", "BOOLEAN DEFAULT 0"),
        ("is_blocked", "BOOLEAN DEFAULT 0"),
        ("phone_verified", "BOOLEAN DEFAULT 0"),
        ("phone_verification_code", "VARCHAR(6)"),
        ("phone_verification_expiry", "DATETIME"),
        ("google_id", "VARCHAR(100)"),
        ("verification_code", "VARCHAR(6)"),
        ("verification_expiry", "DATETIME"),
        ("password_reset_token", "VARCHAR(255)"),
        ("password_reset_expiry", "DATETIME"),
    ]
    with engine.connect() as conn:
        for name, ddl_type in new_columns:
            if name not in existing_columns:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl_type}"))

# Initialize SQLite tables and ensure latest auth schema
Base.metadata.create_all(bind=engine)
ensure_user_schema()

# Initialize Keras plant disease model & labels if missing
init_plant_model()

app = FastAPI(
    title="PlantBot AI Backend API",
    description="Professional Agricultural Plant Disease Detection API powered by TensorFlow & Ollama Gemma 3",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "https://glorious-succotash-4j7pq4x9g975fx4r-5174.app.github.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded leaf images statically
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include Routers
app.include_router(predict_router)
app.include_router(chat_router)
app.include_router(admin_router)


def seed_admin_user(db: Session):
    admin_accounts = [
        {"name": "Sayan Mukherjee", "email": "sayanmukherjee7464@gmail.com"},
        {"name": "Rohit Sardar", "email": "sardrarohit@gmail.com"},
        {"name": "Rohit Sardar", "email": "rohitsardar@gmail.com"},
        {"name": "System Administrator", "email": "admin@plantbot.ai"}
    ]
    
    hashed_pwd = get_password_hash("Admin@123456")

    for account in admin_accounts:
        email = account["email"].strip().lower()
        user_record = db.query(models.User).filter(models.User.email == email).first()
        if not user_record:
            new_admin = models.User(
                name=account["name"],
                email=email,
                password_hash=hashed_pwd,
                role="admin",
                is_verified=True,
                is_blocked=False
            )
            db.add(new_admin)
            db.commit()
            logger.info(f"[PlantBot AI] Seeded new Admin account '{email}'")
        else:
            updated = False
            if user_record.role != "admin":
                user_record.role = "admin"
                updated = True
            if not user_record.is_verified:
                user_record.is_verified = True
                updated = True
            if user_record.is_blocked:
                user_record.is_blocked = False
                updated = True
            if updated:
                db.commit()
                logger.info(f"[PlantBot AI] Promoted existing account '{email}' to Admin role.")


# Seed initial plant disease database items
def seed_diseases(db: Session):
    if db.query(models.Disease).count() > 0:
        return

    sample_diseases = [
        {
            "name": "Tomato Late Blight",
            "plant": "Tomato",
            "description": "Late blight is a devastating fungal-like disease caused by Phytophthora infestans that rapidly destroys tomato leaves, stems, and fruit.",
            "symptoms": ["Large, dark green to purplish-brown water-soaked spots on leaves", "White fungal growth on lower leaf surface during humid conditions", "Brown firm rot on fruit surface"],
            "causes": ["High humidity (>90%) and moderate temperatures (15-22°C)", "Wind-blown spores from adjacent infected crops", "Free moisture on leaf surface for >8 hours"],
            "treatment": ["Prune and destroy all infected foliage immediately", "Apply preventative copper hydroxide or chlorothalonil fungicides", "Ensure drip irrigation is used instead of overhead sprinklers"],
            "prevention": ["Plant resistant tomato varieties (e.g., Defiant PhR)", "Space plants 30-36 inches apart for optimal airflow", "Practice 3-year crop rotation"],
            "image_url": "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a07?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Potato Early Blight",
            "plant": "Potato",
            "description": "Early blight is caused by the fungus Alternaria solani. It primarily attacks older foliage, creating distinct target-like concentric rings.",
            "symptoms": ["Small brown spots on lower leaves with yellow halos", "Concentric ring patterns resembling target boards", "Premature defoliation resulting in reduced tuber yield"],
            "causes": ["Alternaria solani spores surviving in crop debris", "Warm temperatures (24-29°C) with alternating dry and wet periods", "Nutrient stress (low nitrogen or potassium)"],
            "treatment": ["Remove infected lower leaves early in the season", "Apply azoxystrobin or mancozeb protective sprays", "Maintain adequate soil fertility with balanced fertilization"],
            "prevention": ["Remove and burn all crop residue post-harvest", "Utilize drip irrigation to keep leaves dry", "Rotate with non-solanaceous crops such as corn or beans"],
            "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Apple Scab",
            "plant": "Apple",
            "description": "Apple scab is caused by Venturia inaequalis. It produces velvety olive-green to black lesions on apple leaves and scab-like spots on fruit.",
            "symptoms": ["Olive-green velvety spots on leaves turning brown-black", "Deformed, cracked scabbed lesions on developing fruit", "Early leaf drop in severe summer conditions"],
            "causes": ["Fungal spores overwintering on fallen leaves", "Cool, wet spring weather during bud break", "Poor tree pruning leading to trapped leaf moisture"],
            "treatment": ["Prune tree canopy to maximize sunlight penetration", "Rake and destroy fallen leaves in autumn", "Apply organic sulfur or potassium bicarbonate sprays"],
            "prevention": ["Plant scab-resistant cultivars (e.g., Liberty, Enterprise)", "Apply protective bio-fungicides at green tip stage", "Maintain wide tree spacing"],
            "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Corn Common Rust",
            "plant": "Corn",
            "description": "Common rust caused by Puccinia sorghi produces brownish-red pustules on both upper and lower corn leaf surfaces.",
            "symptoms": ["Oval to elongate cinnamon-brown pustules on leaves", "Pustules rupture exposing powdery rust spores", "Chlorosis and leaf death in susceptible hybrids"],
            "causes": ["Windborne urediniospores carried from southern regions", "Cool temperatures (16-23°C) with high relative humidity", "Heavy night dew formulation"],
            "treatment": ["Apply foliar fungicides (triazoles or strobilurins) if rust appears before silking", "Maintain optimal soil moisture and balanced nitrogen"],
            "prevention": ["Plant rust-resistant corn hybrids", "Plant early to bypass high spore pressure periods", "Destroy volunteer corn plants"],
            "image_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Grape Black Rot",
            "plant": "Grape",
            "description": "Black rot caused by Guignardia bidwellii is one of the most serious fruit diseases affecting grapes in humid climates.",
            "symptoms": ["Small reddish-brown circular leaf spots with dark margins", "Fruit infection turning grapes into black shriveled mummies", "Tiny black fruiting bodies (pycnidia) inside spots"],
            "causes": ["Overwintered mummified berries left on vines or ground", "Warm wet weather during bloom and fruit set", "Shaded dense canopy foliage"],
            "treatment": ["Prune out and destroy mummified clusters and infected canes", "Apply myclobutanil or copper sprays starting at pre-bloom"],
            "prevention": ["Maintain strict sanitation by removing all mummies", "Train vines to promote rapid leaf drying", "Apply protective sprays during vulnerable growth stages"],
            "image_url": "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Peach Bacterial Spot",
            "plant": "Peach",
            "description": "Caused by Xanthomonas arboricola pv. pruni, bacterial spot affects stone fruit leaves, twigs, and fruit.",
            "symptoms": ["Angular dark purple spots that fall out creating 'shot-hole' leaves", "Deep pitted cracks and dark sunken spots on fruit", "Cankers on young twigs"],
            "causes": ["Bacterial splashing by wind-driven rain", "Warm, humid spring temperatures during bloom", "Sandy soils causing wind abrasion"],
            "treatment": ["Apply preventative oxytetracycline or copper sprays at bud break", "Avoid excessive nitrogen fertilization which forces tender susceptible growth"],
            "prevention": ["Select bacterial spot resistant peach varieties", "Establish windbreaks to reduce blowing sand damage", "Maintain tree vigor with balanced nutrients"],
            "image_url": "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Pepper Bacterial Spot",
            "plant": "Pepper",
            "description": "Bacterial leaf spot caused by Xanthomonas species leads to severe defoliation and sunscalded pepper fruits.",
            "symptoms": ["Small water-soaked dark spots on lower leaf surface", "Leaf yellowing and extensive premature dropping", "Raised scab-like spots on green peppers"],
            "causes": ["Contaminated seed or infected seedlings", "Rain splashing and overhead irrigation", "High temperatures (24-30°C) with high humidity"],
            "treatment": ["Spray copper fungicides combined with mancozeb", "Remove infected foliage promptly", "Switch to drip lines"],
            "prevention": ["Use certified disease-free pepper seeds", "Treat seeds with hot water prior to planting", "Rotate fields out of Solanaceous crops for 2 years"],
            "image_url": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Strawberry Leaf Spot",
            "plant": "Strawberry",
            "description": "Mycosphaerella fragariae causes common leaf spot on strawberries, reducing plant vigor and fruit size.",
            "symptoms": ["Small purple-red spots with white to gray centers", "Lesions coalescing into large necrotic leaf areas", "Reduced runner production"],
            "causes": ["High humidity and splashing rain", "Dense plant rows with poor leaf drying", "Infected planting stock"],
            "treatment": ["Mow and destroy old foliage after harvest", "Apply captan or thiram protective fungicides", "Avoid excess nitrogen"],
            "prevention": ["Plant certified disease-free strawberry crowns", "Maintain narrow plant rows for better air circulation", "Apply straw mulch to prevent soil splashing"],
            "image_url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Cherry Powdery Mildew",
            "plant": "Cherry",
            "description": "Podosphaera clandestina produces a white powdery coating on young cherry leaves and fruit stems.",
            "symptoms": ["White powdery fungal patches on upper leaf surfaces", "Curling and puckering of young expanding foliage", "Stunted terminal shoot growth"],
            "causes": ["High humidity with warm dry days", "Dense tree shading", "Over-application of high-nitrogen fertilizer"],
            "treatment": ["Prune thick foliage to increase sun exposure", "Apply potassium bicarbonate or sulfur sprays", "Use neem oil or horticultural oil treatments"],
            "prevention": ["Avoid overhead irrigation", "Apply protective fungicides at bud burst", "Maintain adequate tree spacing"],
            "image_url": "https://images.unsplash.com/photo-1528821128474-27f963b062bf?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Citrus Canker",
            "plant": "Citrus",
            "description": "Bacterial disease caused by Xanthomonas citri resulting in raised corky lesions on citrus leaves, twigs, and fruit.",
            "symptoms": ["Raised brown corky lesions surrounded by yellow halos on leaves", "Lesions on twigs and fruit causing premature fruit drop", "Defoliation in severe infections"],
            "causes": ["Wind-driven rain splashing bacterial inoculum", "Warm humid weather (>20°C)", "Leafminer insect damage providing bacterial entry points"],
            "treatment": ["Prune and burn infected foliage during dry spells", "Apply liquid copper bactericide during new leaf flushes", "Control citrus leafminers with neem oil"],
            "prevention": ["Plant resistant citrus cultivars", "Establish windbreaks around citrus orchards", "Disinfect pruning tools with 70% alcohol"],
            "image_url": "https://images.unsplash.com/photo-1534531141161-e41d1341d1de?auto=format&fit=crop&w=600&q=80"
        }
    ]

    for d in sample_diseases:
        db.add(models.Disease(**d))
    db.commit()
    logger.info("[PlantBot AI] Seeded initial plant disease library data.")


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_diseases(db)
    seed_admin_user(db)


# Health check endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "PlantBot AI Platform",
        "vision_engine": "TensorFlow MobileNetV2 / EfficientNetB0",
        "generative_ai": "Ollama Gemma 3",
        "docs": "/docs"
    }


# AUTH ROUTES
@app.post("/auth/register", response_model=schemas.OTPStatusResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    normalized_email = normalize_email(user_data.email)
    existing = get_user_by_email(db, normalized_email)
    if existing:
        if not existing.is_verified:
            existing.password_hash = get_password_hash(user_data.password)
            existing.name = user_data.name.strip()
            existing.role = user_data.role or "farmer"
            existing.verification_code = generate_random_code()
            existing.verification_expiry = datetime.utcnow() + timedelta(minutes=10)
            db.commit()
            send_email(
                existing.email,
                "PlantBot AI - Email Verification OTP",
                f"""Hello {existing.name},

Your PlantBot AI email verification OTP is:

{existing.verification_code}

This OTP is valid for 10 minutes.

Regards,
PlantBot AI Team
"""
            )
            return {
                "email": existing.email,
                "is_verified": False,
                "verification_code": None
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    verification_code = generate_random_code()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name.strip(),
        email=normalized_email,
        phone=user_data.phone.strip() if user_data.phone else None,
        password_hash=hashed_pwd,
        role=user_data.role or "farmer",
        is_verified=False,
        verification_code=verification_code,
        verification_expiry=expiry
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"[PlantBot AI] Registered new unverified user '{new_user.email}'")

    send_email(
        new_user.email,
        "PlantBot AI - Email Verification OTP",
        f"""Hello {new_user.name},

    Your PlantBot AI email verification OTP is:

    {verification_code}

    This OTP is valid for 10 minutes.

    Regards,
    PlantBot AI Team
    """
    )

    return {
        "email": new_user.email,
        "is_verified": False,
        "verification_code": None
    }

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, user_credentials.email)
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email with the OTP before logging in."
        )

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/auth/refresh", response_model=schemas.RefreshTokenResponse)
def refresh_token(payload: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    token_data = payload.token
    decoded = decode_token(token_data, expected_type="refresh")
    email = decoded.get("sub")
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/auth/verify-otp", response_model=schemas.MessageResponse)
def verify_otp(payload: schemas.UserVerifyOTP, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_verified:
        return {"detail": "Account is already verified."}
    if not user.verification_code or user.verification_code != payload.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
    if not user.verification_expiry or datetime.utcnow() > user.verification_expiry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired.")

    user.is_verified = True
    user.verification_code = None
    user.verification_expiry = None
    db.commit()
    return {"detail": "Email verified successfully."}


@app.post("/auth/resend-otp", response_model=schemas.MessageResponse)
def resend_otp(payload: schemas.ResendOTPRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_verified:
        return {"detail": "Account already verified."}

    user.verification_code = generate_random_code()
    user.verification_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    return {"detail": "A new OTP has been generated and sent to your email."}


def send_email(to_email: str, subject: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_user or not smtp_password:
        logger.error("[PlantBot AI] SMTP configuration is missing.")
        return False

    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = smtp_user
        message["To"] = to_email
        message.set_content(body)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)

        logger.info(f"[PlantBot AI] Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"[PlantBot AI] Failed to send email to {to_email}: {e}")
        return False


@app.post("/auth/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        return {"detail": "If the email is registered, a password reset link has been sent."}

    reset_token = create_password_reset_token(user.email)
    user.password_reset_token = reset_token
    user.password_reset_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    send_email(
        user.email,
        "PlantBot AI - Password Reset",
        f"""Hello {user.name},

We received a request to reset your PlantBot AI password.

Click the link below to reset your password:

{reset_link}

This link is valid for 10 minutes.

If you did not request this password reset, you can ignore this email.

Regards,
PlantBot AI Team
"""
    )

    return {"detail": "If the email is registered, a password reset link has been sent."}


@app.post("/auth/reset-password", response_model=schemas.MessageResponse)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    decoded = decode_token(payload.token, expected_type="reset_password")
    email = decoded.get("sub")
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired password reset token.")
    if not user.password_reset_token or user.password_reset_token != payload.token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token.")
    if not user.password_reset_expiry or datetime.utcnow() > user.password_reset_expiry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset token expired.")

    user.password_hash = get_password_hash(payload.password)
    user.password_reset_token = None
    user.password_reset_expiry = None
    db.commit()
    return {"detail": "Your password has been reset successfully."}


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/auth/google", response_model=schemas.TokenResponse)
def google_login(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    email = payload.email
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google profile email is required."
        )

    user = get_user_by_email(db, email)
    if user:
        if getattr(user, "is_blocked", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been blocked by an administrator."
            )
        if payload.google_id and not getattr(user, "google_id", None):
            user.google_id = payload.google_id
        if payload.picture and not user.profile_image:
            user.profile_image = payload.picture
        if payload.name and (not user.name or user.name == "User"):
            user.name = payload.name
        user.is_verified = True
        db.commit()
        db.refresh(user)
        logger.info(f"[PlantBot AI] Google sign in for existing user '{user.email}'")
    else:
        random_password = get_password_hash(f"GoogleSecret_{generate_random_code()}_{email}")
        user = models.User(
            name=payload.name or "Google User",
            email=normalize_email(email),
            password_hash=random_password,
            profile_image=payload.picture,
            google_id=payload.google_id,
            role="farmer",
            is_verified=True,
            is_blocked=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"[PlantBot AI] Auto-created new user via Google Sign-In '{user.email}'")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


def send_real_sms(phone: str, code: str) -> dict:
    """
    Helper function to send real SMS messages to cellular mobile phones.
    Supports Twilio and free Textbelt API gateway out-of-the-box.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER")

    # 1. Try Twilio if credentials configured in .env
    if account_sid and auth_token and from_phone:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=f"[PlantBot AI] Your login verification OTP code is: {code}. Valid for 10 minutes.",
                from_=from_phone,
                to=phone
            )
            logger.info(f"[PlantBot AI] Real SMS sent to {phone} via Twilio SID: {message.sid}")
            return {"sent": True, "provider": "Twilio", "sid": message.sid}
        except Exception as e:
            logger.error(f"[PlantBot AI] Failed to send SMS via Twilio: {e}")

    # 2. Try Free Textbelt SMS Gateway
    try:
        data = urllib.parse.urlencode({
            'phone': phone,
            'message': f'[PlantBot AI] Your login OTP code is: {code}. Valid for 10 min.',
            'key': 'textbelt',
        }).encode('utf-8')
        req = urllib.request.Request('https://textbelt.com/text', data=data, headers={'User-Agent': 'PlantBotAI/1.0'})
        with urllib.request.urlopen(req, timeout=6) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if res_data.get('success'):
                logger.info(f"[PlantBot AI] Live SMS dispatched to {phone} via Textbelt! Quota remaining: {res_data.get('quotaRemaining')}")
                return {"sent": True, "provider": "Textbelt", "quota": res_data.get('quotaRemaining')}
            else:
                logger.warning(f"[PlantBot AI] Textbelt status for {phone}: {res_data.get('error')}")
    except Exception as err:
        logger.error(f"[PlantBot AI] Textbelt live SMS request failed: {err}")

    logger.info(f"[PlantBot AI] Local Dev mode fallback for {phone}. Generated OTP is '{code}'.")
    return {"sent": False, "provider": "Local On-Screen Display"}


@app.post("/auth/phone/send-otp")
def send_phone_otp(payload: schemas.SendPhoneOTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")

    code = generate_random_code()
    expiry = datetime.utcnow() + timedelta(minutes=10)

    user = get_user_by_phone(db, phone)
    if not user:
        random_password = get_password_hash(f"PhoneSecret_{generate_random_code()}_{phone}")
        clean_email = f"farmer_{phone.replace('+', '').replace(' ', '').replace('-', '')[-8:]}@plantbot.ai"
        user = models.User(
            name=f"Farmer {phone[-4:] if len(phone) >= 4 else phone}",
            email=clean_email,
            phone=phone,
            password_hash=random_password,
            role="farmer",
            is_verified=True,
            phone_verified=False,
            phone_verification_code=code,
            phone_verification_expiry=expiry,
            is_blocked=False
        )
        db.add(user)
    else:
        user.phone_verification_code = code
        user.phone_verification_expiry = expiry

    db.commit()

    # Trigger real SMS sending helper (Twilio / Textbelt)
    sms_result = send_real_sms(phone, code)

    return {
        "detail": f"OTP generated successfully for {phone}.",
        "phone": phone,
        "code": code,
        "sms_sent": sms_result.get("sent", False),
        "sms_provider": sms_result.get("provider", "Local")
    }


@app.post("/auth/phone/login", response_model=schemas.TokenResponse)
def phone_login(payload: schemas.PhoneLoginRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    user = get_user_by_phone(db, phone)

    if not user:
        random_password = get_password_hash(f"PhoneSecret_{generate_random_code()}_{phone}")
        clean_email = f"farmer_{phone.replace('+', '').replace(' ', '').replace('-', '')[-8:]}@plantbot.ai"
        user = models.User(
            name=f"Farmer {phone[-4:] if len(phone) >= 4 else phone}",
            email=clean_email,
            phone=phone,
            password_hash=random_password,
            role="farmer",
            is_verified=True,
            phone_verified=True,
            is_blocked=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if getattr(user, "is_blocked", False):
            raise HTTPException(status_code=403, detail="Your account has been blocked by an administrator.")

        # Check OTP code (either matching generated OTP or fallback 123456)
        if payload.code != "123456" and user.phone_verification_code and user.phone_verification_code != payload.code:
            raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and try again.")

        user.phone_verified = True
        user.phone_verification_code = None
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/auth/phone/link", response_model=schemas.UserResponse)
def link_phone(
    payload: schemas.VerifyPhoneOTPRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    phone = payload.phone.strip()
    existing_phone_user = get_user_by_phone(db, phone)
    if existing_phone_user and existing_phone_user.id != current_user.id:
        raise HTTPException(
            status_code=400,
            detail="This phone number is already linked to another account."
        )

    current_user.phone = phone
    current_user.phone_verified = True
    current_user.phone_verification_code = None
    db.commit()
    db.refresh(current_user)
    return current_user


@app.put("/auth/profile", response_model=schemas.UserResponse)
def update_profile(
    payload: schemas.ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.name:
        current_user.name = payload.name.strip()
    if payload.phone:
        current_user.phone = payload.phone.strip()
    if payload.profile_image:
        current_user.profile_image = payload.profile_image.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


# DISEASE LIBRARY ROUTES
@app.get("/diseases", response_model=List[schemas.DiseaseResponse])
def get_diseases(db: Session = Depends(get_db)):
    return db.query(models.Disease).all()


@app.get("/diseases/{disease_id}", response_model=schemas.DiseaseResponse)
def get_disease_by_id(disease_id: int, db: Session = Depends(get_db)):
    disease = db.query(models.Disease).filter(models.Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease record not found.")
    return disease


# DASHBOARD STATS ROUTE
@app.get("/dashboard/stats", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    # Global dashboard: show combined stats across all users
    query = db.query(models.Prediction)

    total_scans = query.count()
    healthy_count = query.filter(models.Prediction.status.ilike("healthy")).count()
    diseased_count = query.filter(models.Prediction.status.ilike("diseased")).count()

    all_preds = query.all()
    avg_conf = (sum((p.confidence * 100 if p.confidence <= 1 else p.confidence) for p in all_preds) / total_scans) if total_scans > 0 else 0.0

    disease_counts = {}
    for p in all_preds:
        disease_counts[p.disease] = disease_counts.get(p.disease, 0) + 1

    most_detected = None
    if disease_counts:
        most_detected = max(disease_counts, key=disease_counts.get)

    recent_scans = query.order_by(models.Prediction.created_at.desc()).limit(8).all()

    return {
        "total_scans": total_scans,
        "healthy_count": healthy_count,
        "diseased_count": diseased_count,
        "avg_confidence": round(avg_conf, 2),
        "most_detected_disease": most_detected,
        "disease_distribution": disease_counts,
        "recent_scans": recent_scans
    }


# SERVE FRONTEND SPA & STATIC ASSETS
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Allow API endpoints to take priority
        if full_path.startswith("api") or full_path.startswith("admin") or full_path.startswith("auth") or full_path.startswith("uploads") or full_path.startswith("diseases") or full_path.startswith("dashboard") or full_path.startswith("predict") or full_path.startswith("chat"):
            raise HTTPException(status_code=404, detail="API route not found.")
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html missing.")
