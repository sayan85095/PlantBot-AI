import os
import json
import logging
import asyncio
import base64
import httpx
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
PREFERRED_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:1b")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

logger = logging.getLogger("plantbot.ollama")

DISEASE_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "disease_info.json")
_disease_db: Optional[dict] = None
_gemini_client = None

SYSTEM_PROMPT = """You are PlantBot AI, a conversational agricultural and botanical AI assistant.
Answer questions about plant health, crop disease, watering schedules, organic fertilizers, soil pH, and pest prevention.
Use clear, friendly language with markdown formatting when helpful. Keep responses concise."""

DISEASE_KEYWORD_MAP = [
    (["tomato"], ["late blight"], "Tomato", "Tomato Late Blight"),
    (["tomato"], ["early blight"], "Tomato", "Tomato Early Blight"),
    (["potato"], ["early blight"], "Potato", "Potato Early Blight"),
    (["potato"], ["late blight"], "Potato", "Potato Late Blight"),
    (["apple"], ["scab"], "Apple", "Apple Scab"),
    (["apple"], ["black rot"], "Apple", "Apple Black Rot"),
    (["corn", "maize"], ["rust"], "Corn", "Corn Common Rust"),
    (["grape"], ["black rot"], "Grape", "Grape Black Rot"),
    (["pepper", "chili", "chilli"], ["bacterial spot"], "Pepper", "Pepper Bacterial Spot"),
    (["citrus", "orange", "lemon", "lime"], ["canker"], "Citrus", "Citrus Canker"),
    (["citrus", "orange", "lemon", "lime"], ["greening", "hlb", "huanglongbing"], "Citrus", "Citrus Greening (HLB)"),
    (["citrus", "orange", "lemon", "lime"], ["black spot"], "Citrus", "Citrus Black Spot"),
    (["rice", "paddy"], ["blast"], "Rice", "Rice Blast"),
]


def load_disease_db() -> dict:
    global _disease_db
    if _disease_db is not None:
        return _disease_db
    try:
        with open(DISEASE_DB_PATH, "r") as f:
            _disease_db = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load disease_info.json: {e}")
        _disease_db = {}
    return _disease_db


def lookup_disease_info(plant: str, disease: str) -> Optional[dict]:
    db = load_disease_db()
    return db.get(plant, {}).get(disease)


def find_disease_in_query(query: str) -> Optional[tuple]:
    q = query.lower()
    for plant_kws, disease_kws, plant_key, disease_key in DISEASE_KEYWORD_MAP:
        if any(pk in q for pk in plant_kws) and any(dk in q for dk in disease_kws):
            return (plant_key, disease_key)
    return None


def format_disease_reply(plant: str, disease: str, entry: dict) -> str:
    lines = [f"PLANT {plant} - {disease}\n", entry.get("description", ""), ""]
    lines.append("Symptoms:")
    lines += [f"- {s}" for s in entry.get("symptoms", [])]
    lines.append("\nCauses:")
    lines += [f"- {c}" for c in entry.get("causes", [])]
    lines.append("\nTreatment:")
    lines += [f"- {t}" for t in entry.get("treatment", [])]
    lines.append("\nPrevention:")
    lines += [f"- {p}" for p in entry.get("prevention", [])]
    return "\n".join(lines)


def get_gemini_client():
    global _gemini_client
    if not GEMINI_API_KEY:
        return None
    if _gemini_client is not None:
        return _gemini_client
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        return _gemini_client
    except Exception as e:
        logger.warning(f"Could not initialize Gemini client: {e}")
        return None


async def try_gemini_chat(messages_history: List[Dict[str, str]]) -> Optional[str]:
    client = get_gemini_client()
    if not client:
        return None
    try:
        history_text = ""
        for msg in messages_history[-6:]:
            role = msg.get("role", "user")
            content = msg.get("content", msg.get("message", ""))
            prefix = "User" if role == "user" else "Assistant"
            history_text += f"{prefix}: {content}\n"
        prompt = f"{SYSTEM_PROMPT}\n\n{history_text}Assistant:"

        response = await asyncio.wait_for(
            client.aio.models.generate_content(model=GEMINI_MODEL, contents=prompt),
            timeout=20.0
        )
        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()
    except Exception as e:
        logger.warning(f"Gemini chat request failed ({e}) - falling back to local model.")
    return None


async def try_gemini_vision(image_base64: str) -> Optional[Dict[str, Any]]:
    client = get_gemini_client()
    if not client:
        return None

    models_to_try = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", GEMINI_MODEL, "gemini-2.0-flash-lite", "gemini-2.0-flash"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    from google.genai import types as genai_types
    try:
        image_bytes = base64.b64decode(image_base64)
        image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
    except Exception as e:
        logger.warning(f"Could not prepare image bytes for Gemini Vision: {e}")
        return None

    prompt = (
        "You are an agricultural computer vision AI. Examine this leaf image closely.\n"
        "Identify the exact plant species and diagnose any disease, or confirm if healthy.\n"
        "Return strictly valid JSON only with keys: plant, disease, status, confidence, "
        "description, symptoms, causes, treatment, prevention, care_tips."
    )

    for model_name in models_to_try:
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt],
                    config=genai_types.GenerateContentConfig(response_mime_type="application/json")
                ),
                timeout=30.0
            )
            text = getattr(response, "text", None)
            if text:
                parsed = json.loads(text)
                if parsed.get("plant") and parsed.get("disease"):
                    logger.info(f"[PlantBot AI] Gemini Vision ({model_name}) identified '{parsed.get('plant')}' - '{parsed.get('disease')}'")
                    return parsed
        except Exception as e:
            logger.info(f"Gemini vision inference with model '{model_name}' skipped ({e}).")

    return None


async def try_gemini_plant_advice(plant_name: str, disease_name: str, confidence: float, status: str) -> Optional[Dict[str, Any]]:
    client = get_gemini_client()
    if not client:
        return None
    try:
        from google.genai import types as genai_types
        prompt = (
            f"Plant: {plant_name}\nDisease: {disease_name}\nStatus: {status}\nConfidence: {confidence:.2f}%\n\n"
            "Provide accurate agricultural guidance as strictly valid JSON with exactly these keys: "
            "description, symptoms (array), causes (array), treatment (array), prevention (array), care_tips (array)."
        )
        models_to_try = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", GEMINI_MODEL, "gemini-2.0-flash-lite"]
        models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))
        for model_name in models_to_try:
            try:
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(response_mime_type="application/json")
                    ),
                    timeout=20.0
                )
                text = getattr(response, "text", None)
                if text:
                    parsed = json.loads(text)
                    return {
                        "description": parsed.get("description", f"AI analysis for {disease_name}"),
                        "symptoms": parsed.get("symptoms", []),
                        "causes": parsed.get("causes", []),
                        "treatment": parsed.get("treatment", []),
                        "prevention": parsed.get("prevention", []),
                        "care_tips": parsed.get("care_tips", [])
                    }
            except Exception as model_err:
                logger.info(f"Gemini advice model {model_name} skipped ({model_err}).")
    except Exception as e:
        logger.info(f"Gemini plant advice skipped ({e}).")
    return None


def generate_fallback_chat_reply(user_query: str) -> str:
    query_lower = user_query.lower().strip()
    matched = find_disease_in_query(user_query)
    if matched:
        plant_key, disease_key = matched
        entry = lookup_disease_info(plant_key, disease_key)
        if entry:
            return format_disease_reply(plant_key, disease_key, entry)

    if any(k in query_lower for k in ["hlo", "hlw", "hi", "hello", "hey", "greetings", "namaste", "hola"]):
        return "Hello! I am PlantBot AI. Ask me about any plant, disease, or care question."
    return (
        f"PlantBot AI Reply (offline mode):\n\n"
        f"I couldn't reach the AI model for \"{user_query}\" right now. Please try again in a moment."
    )


async def get_active_model_name() -> str:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                models_data = res.json().get("models", [])
                if models_data:
                    model_names = [m.get("name", "") for m in models_data]
                    for m in model_names:
                        if PREFERRED_MODEL == m:
                            return m
                    for m in model_names:
                        if "gemma" in m:
                            return m
                    return model_names[0]
    except Exception as e:
        logger.warning(f"Could not query Ollama model tags: {e}")
    return PREFERRED_MODEL


async def generate_chat_response(messages_history: List[Dict[str, str]]) -> str:
    last_query = messages_history[-1].get("content", "") if messages_history else ""

    matched = find_disease_in_query(last_query)
    if matched:
        plant_key, disease_key = matched
        entry = lookup_disease_info(plant_key, disease_key)
        if entry:
            return format_disease_reply(plant_key, disease_key, entry)

    gemini_reply = await try_gemini_chat(messages_history)
    if gemini_reply:
        return gemini_reply

    model_name = await get_active_model_name()
    trimmed_history = messages_history[-4:] if len(messages_history) > 4 else messages_history
    formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in trimmed_history:
        role = msg.get("role", "user")
        if role not in ["user", "assistant"]:
            role = "user"
        formatted_messages.append({"role": role, "content": msg.get("content", msg.get("message", ""))})

    try:
        async with httpx.AsyncClient(timeout=100.0) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json={"model": model_name, "messages": formatted_messages, "stream": False})
            if response.status_code == 200:
                content = response.json().get("message", {}).get("content", "")
                if content and len(content.strip()) > 5:
                    return content.strip()
    except Exception as e:
        logger.warning(f"Ollama request failed ({e}) - using canned reply.")

    return generate_fallback_chat_reply(last_query)


def get_fallback_plant_advice(plant_name: str, disease_name: str, confidence: float, status: str) -> Dict[str, Any]:
    is_healthy = status.lower() == "healthy" or "healthy" in disease_name.lower()
    if is_healthy:
        return {
            "description": f"The {plant_name} leaf appears healthy.",
            "symptoms": ["Vibrant green coloration", "Unblemished leaf surface"],
            "causes": ["Optimal watering", "Adequate sunlight", "Balanced soil nutrients"],
            "treatment": ["No treatment needed"],
            "prevention": ["Regular crop monitoring"],
            "care_tips": [f"Keep monitoring {plant_name} weekly."]
        }
    return {
        "description": f"{plant_name} affected by {disease_name} (Confidence: {confidence:.1f}%).",
        "symptoms": ["Discoloration or lesions on leaves", "Possible wilting or leaf drop"],
        "causes": ["Likely fungal or bacterial pathogen", "Often favored by excess moisture or poor airflow"],
        "treatment": ["Remove and destroy affected leaves", "Apply a broad-spectrum copper fungicide as a precaution", "Consult a local agricultural extension office for exact product/dosage guidance"],
        "prevention": ["Improve airflow and spacing", "Avoid overhead watering", "Practice crop rotation"],
        "care_tips": [f"Isolate affected {plant_name} plants to limit spread."]
    }


async def analyze_leaf_with_ollama_vision(image_base64: str) -> Optional[Dict[str, Any]]:
    gemini_result = await try_gemini_vision(image_base64)
    if gemini_result:
        return gemini_result

    model_name = await get_active_model_name()
    prompt = (
        "You are an agricultural computer vision AI. Examine this leaf image closely.\n"
        "Identify the exact plant species and diagnose any disease, or confirm if healthy.\n"
        "Return strictly valid JSON with keys: plant, disease, status, confidence, description, symptoms, causes, treatment, prevention, care_tips."
    )
    payload = {"model": model_name, "messages": [{"role": "user", "content": prompt, "images": [image_base64]}], "stream": False, "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            if response.status_code == 200:
                content = response.json().get("message", {}).get("content", "")
                parsed = json.loads(content)
                if parsed.get("plant") and parsed.get("disease"):
                    return parsed
    except Exception as e:
        logger.info(f"Ollama vision inference skipped ({e}).")
    return None


async def generate_plant_advice(plant_name: str, disease_name: str, confidence: float, status: str) -> Dict[str, Any]:
    entry = lookup_disease_info(plant_name, disease_name)
    if entry:
        return {
            "description": entry.get("description", f"AI analysis for {disease_name}"),
            "symptoms": entry.get("symptoms", []),
            "causes": entry.get("causes", []),
            "treatment": entry.get("treatment", []),
            "prevention": entry.get("prevention", []),
            "care_tips": entry.get("care_tips", [])
        }

    gemini_advice = await try_gemini_plant_advice(plant_name, disease_name, confidence, status)
    if gemini_advice:
        return gemini_advice

    return get_fallback_plant_advice(plant_name, disease_name, confidence, status)
