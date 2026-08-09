import os
import csv
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db, DB_PATH
from auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard Engine"])

# 1. ANALYTICS & OVERVIEW ENDPOINT
@router.get("/analytics", response_model=schemas.AdminAnalyticsResponse)
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    total_users = db.query(models.User).count()
    verified_users = db.query(models.User).filter(models.User.is_verified == True).count()
    blocked_users = db.query(models.User).filter(models.User.is_blocked == True).count()

    total_scans = db.query(models.Prediction).count()
    healthy_count = db.query(models.Prediction).filter(models.Prediction.status == "Healthy").count()
    diseased_count = db.query(models.Prediction).filter(models.Prediction.status == "Diseased").count()

    all_scans = db.query(models.Prediction).all()
    avg_conf = (sum(s.confidence for s in all_scans) / total_scans) if total_scans > 0 else 0.0

    disease_counts = {}
    for s in all_scans:
        disease_counts[s.disease] = disease_counts.get(s.disease, 0) + 1

    most_detected = None
    if disease_counts:
        most_detected = max(disease_counts, key=disease_counts.get)

    recent_users = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()
    recent_scans = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).limit(5).all()

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "blocked_users": blocked_users,
        "total_scans": total_scans,
        "healthy_count": healthy_count,
        "diseased_count": diseased_count,
        "avg_confidence": round(avg_conf, 2),
        "most_detected_disease": most_detected,
        "disease_distribution": disease_counts,
        "recent_users": recent_users,
        "recent_scans": recent_scans
    }


# 2. USER MANAGEMENT ENDPOINTS
@router.get("/users", response_model=List[schemas.UserResponse])
def get_admin_users(
    q: Optional[str] = Query(None, description="Search query by name or email"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    query = db.query(models.User)
    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.User.name).like(search_term),
                func.lower(models.User.email).like(search_term)
            )
        )
    return query.order_by(models.User.created_at.desc()).all()


@router.put("/users/{user_id}/block", response_model=schemas.UserResponse)
def toggle_block_user(
    user_id: int,
    payload: schemas.UserBlockUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot block their own account.")

    user.is_blocked = payload.is_blocked
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    payload: schemas.UserUpdateRole,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="Administrators cannot demote their own account.")

    allowed_roles = ["admin", "farmer", "student", "researcher", "enthusiast"]
    if payload.role.lower() not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed roles: {', '.join(allowed_roles)}")

    user.role = payload.role.lower()
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")

    # Remove user predictions and messages
    db.query(models.Prediction).filter(models.Prediction.user_id == user_id).delete()
    db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"detail": f"User ID #{user_id} ({user.email}) deleted successfully."}


# 3. PLANT DIAGNOSIS & SCANS ENDPOINTS
@router.get("/scans", response_model=List[schemas.PredictionResponse])
def get_all_scans(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).all()


@router.delete("/scans/{scan_id}")
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    scan = db.query(models.Prediction).filter(models.Prediction.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    db.delete(scan)
    db.commit()
    return {"detail": f"Scan ID #{scan_id} deleted successfully."}


# 4. EXPORT USERS CSV & DATABASE BACKUP ENDPOINTS
@router.get("/export/users")
def export_users_csv(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    users = db.query(models.User).order_by(models.User.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Name", "Email", "Phone", "Role", "Is Verified", "Is Blocked", "Created At"
    ])

    for u in users:
        writer.writerow([
            u.id, u.name, u.email, u.phone or "", u.role, u.is_verified, u.is_blocked,
            u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/backup")
def download_database_backup(
    admin: models.User = Depends(get_admin_user)
):
    if os.path.exists(DB_PATH):
        return FileResponse(
            path=DB_PATH,
            filename=f"plantbot_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db",
            media_type="application/x-sqlite3"
        )
    raise HTTPException(status_code=404, detail="Database file not found.")


# 5. ADMIN ACCESS REQUEST SYSTEM (Approval Workflow for Sayan Mukherjee & Rohit Sardar)
@router.post("/request-access")
def submit_admin_access_request(
    payload: schemas.AdminRequestCreate,
    db: Session = Depends(get_db)
):
    email = payload.email.strip().lower() if payload.email else ""
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid Gmail / email address.")

    applicant_name = payload.name.strip() if payload.name and payload.name.strip() else email.split("@")[0].title()
    
    # Check if super admin email
    super_admins = ["sayanmukherjee7464@gmail.com", "sardrarohit@gmail.com", "rohitsardar@gmail.com", "admin@plantbot.ai"]
    if email in super_admins:
        return {"detail": "Super Admin email recognized! You already have full Admin access. Please sign in directly."}

    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.role == "admin":
        return {"detail": "Your account is already an approved Administrator. Please sign in."}

    # Check if pending request exists
    existing_req = db.query(models.AdminRequest).filter(
        models.AdminRequest.email == email,
        models.AdminRequest.status == "pending"
    ).first()
    
    if existing_req:
        return {
            "detail": "Your Admin Access Request is already pending review. Sayan Mukherjee & Rohit Sardar will review your request shortly."
        }

    # Create new Admin Request
    new_req = models.AdminRequest(
        user_id=user.id if user else None,
        name=applicant_name,
        email=email,
        note=payload.note.strip() if payload.note and payload.note.strip() else "Requesting Admin Access",
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return {
        "detail": f"Admin Access Request submitted for '{email}'! Your request has been forwarded to Sayan Mukherjee & Rohit Sardar for Accept/Deny approval."
    }


@router.get("/requests", response_model=List[schemas.AdminRequestResponse])
def get_admin_access_requests(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return db.query(models.AdminRequest).order_by(models.AdminRequest.created_at.desc()).all()


@router.post("/requests/{request_id}/approve")
def approve_admin_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    req = db.query(models.AdminRequest).filter(models.AdminRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Admin request not found.")

    req.status = "approved"
    req.reviewed_by = admin.email
    req.reviewed_at = datetime.utcnow()

    # Find or create user and set role="admin"
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if user:
        user.role = "admin"
        user.is_verified = True
        user.is_blocked = False
    else:
        # Create new admin user
        from auth import get_password_hash
        user = models.User(
            name=req.name,
            email=req.email,
            password_hash=get_password_hash("Admin@123456"),
            role="admin",
            is_verified=True,
            is_blocked=False
        )
        db.add(user)
    
    db.commit()
    return {"detail": f"Admin request for '{req.email}' APPROVED by {admin.name}! Role updated to Administrator."}


@router.post("/requests/{request_id}/reject")
def reject_admin_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    req = db.query(models.AdminRequest).filter(models.AdminRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Admin request not found.")

    req.status = "rejected"
    req.reviewed_by = admin.email
    req.reviewed_at = datetime.utcnow()
    db.commit()
    return {"detail": f"Admin request for '{req.email}' REJECTED by {admin.name}."}
