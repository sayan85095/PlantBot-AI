from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

import models
import schemas
from database import get_db
from auth import get_optional_user
from ollama_service import generate_chat_response

router = APIRouter(prefix="", tags=["AI Chatbot"])

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_gemma(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")

    user_id = current_user.id if current_user else None

    # Fetch last 6 messages from database history for user session context
    history_records = []
    if user_id:
        history_records = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == user_id
        ).order_by(models.ChatMessage.created_at.desc()).limit(6).all()
        history_records.reverse()

    history_formatted = []
    for h in history_records:
        history_formatted.append({"role": h.role, "content": h.message})
    
    # Append current user prompt
    history_formatted.append({"role": "user", "content": payload.message})

    # Save user message to database
    if user_id:
        user_msg = models.ChatMessage(user_id=user_id, role="user", message=payload.message)
        db.add(user_msg)
        db.commit()

    # Generate response from Ollama Gemma 3
    ai_reply = await generate_chat_response(history_formatted)

    # Save assistant message to database
    if user_id:
        assistant_msg = models.ChatMessage(user_id=user_id, role="assistant", message=ai_reply)
        db.add(assistant_msg)
        db.commit()

    return schemas.ChatResponse(response=ai_reply)


@router.get("/chat/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not current_user:
        return []
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.asc()).all()
    
    return [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "created_at": m.created_at
        }
        for m in messages
    ]
