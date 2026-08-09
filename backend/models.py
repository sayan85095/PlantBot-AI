from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    profile_image = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="farmer")  # farmer, student, researcher, admin
    is_verified = Column(Boolean, default=False, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    phone_verified = Column(Boolean, default=False, nullable=False)
    phone_verification_code = Column(String(6), nullable=True)
    phone_verification_expiry = Column(DateTime, nullable=True)
    google_id = Column(String(100), nullable=True)
    verification_code = Column(String(6), nullable=True)
    verification_expiry = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    plant = Column(String(100), nullable=False)
    disease = Column(String(150), nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)  # Healthy, Diseased
    image_path = Column(String(255), nullable=False)
    ai_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")

class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    plant = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    symptoms = Column(JSON, nullable=False)  # List of strings
    causes = Column(JSON, nullable=False)    # List of strings
    treatment = Column(JSON, nullable=False) # List of strings
    prevention = Column(JSON, nullable=False)# List of strings
    image_url = Column(String(255), nullable=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")

class AdminRequest(Base):
    __tablename__ = "admin_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), index=True, nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    reviewed_by = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
