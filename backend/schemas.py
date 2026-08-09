from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    name: constr(min_length=2, max_length=100)
    email: EmailStr
    password: constr(min_length=8)
    phone: Optional[str] = None
    role: Optional[str] = "farmer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None

class SendPhoneOTPRequest(BaseModel):
    phone: str

class VerifyPhoneOTPRequest(BaseModel):
    phone: str
    code: constr(min_length=6, max_length=6)

class PhoneLoginRequest(BaseModel):
    phone: str
    code: constr(min_length=6, max_length=6)

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class UserVerifyOTP(BaseModel):
    email: EmailStr
    code: constr(min_length=6, max_length=6)

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: constr(min_length=8)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    role: str
    is_verified: bool
    is_blocked: bool = False
    phone_verified: bool = False
    google_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRole(BaseModel):
    role: str

class UserBlockUpdate(BaseModel):
    is_blocked: bool

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    verified_users: int
    blocked_users: int
    total_scans: int
    healthy_count: int
    diseased_count: int
    avg_confidence: float
    most_detected_disease: str
    disease_distribution: Dict[str, int]
    recent_users: List[UserResponse]
    recent_scans: List["PredictionResponse"]

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class OTPStatusResponse(BaseModel):
    email: str
    is_verified: bool
    verification_code: Optional[str] = None

class MessageResponse(BaseModel):
    detail: str

# Prediction Schemas
class AIAnalysisSchema(BaseModel):
    description: str
    symptoms: List[str]
    causes: List[str]
    treatment: List[str]
    prevention: List[str]
    care_tips: List[str]

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    plant: str
    disease: str
    status: str
    confidence: float
    image_path: Optional[str] = None
    ai_analysis: Optional[AIAnalysisSchema] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    created_at: Optional[datetime] = None

# Disease Schemas
class DiseaseResponse(BaseModel):
    id: int
    name: str
    plant: str
    description: str
    symptoms: List[str]
    causes: List[str]
    treatment: List[str]
    prevention: List[str]
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStatsResponse(BaseModel):
    total_scans: int
    healthy_count: int
    diseased_count: int
    avg_confidence: float
    most_detected_disease: str
    disease_distribution: Dict[str, int]
    recent_scans: List[PredictionResponse]

class AdminRequestCreate(BaseModel):
    name: Optional[str] = "Applicant"
    email: str
    note: Optional[str] = None
    password: Optional[str] = "Admin@123456"

class AdminRequestResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: str
    note: Optional[str] = None
    status: str
    reviewed_by: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
