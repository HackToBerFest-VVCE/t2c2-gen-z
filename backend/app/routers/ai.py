import os
import json
import logging
from typing import Optional, Any
from fastapi import APIRouter, HTTPException, Depends
from ..config import settings
from ..schemas import (
    AIChatRequest, AIChatResponse,
    AIReportAnalysisRequest, AIReportAnalysisResponse
)

logger = logging.getLogger("fieldpilot.ai")
router = APIRouter(prefix="/ai", tags=["ai"])

# Verified Local Agricultural & Civic Knowledge Core
# Sources: UAS Bangalore, ICAR-CRIDA, Karnataka State Agriculture Dept Handbooks
VERIFIED_KNOWLEDGE_BASE = [
    {
        "keywords": ["koleroga", "fruit rot", "areca", "arecanut", "ಅಡಿಕೆ", "ಕೊಳೆರೋಗ"],
        "crop": "Arecanut (ಅಡಿಕೆ)",
        "guidance": "Koleroga (Fruit rot) caused by Phytophthora meadii is severe during southwest monsoon. Apply prophylactic 1% Bordeaux mixture spray to bunches before monsoon showers and repeat after 40 days. Ensure clear drainage to prevent root waterlogging.",
        "source": "University of Agricultural Sciences, Bangalore & ICAR-CPCRI",
        "provenance": "Verified Agricultural Advisory Code: AGRI-KA-ARECA-01"
    },
    {
        "keywords": ["blast", "paddy", "rice", "ಭತ್ತ", "ಬೆಂಕಿ ರೋಗ"],
        "crop": "Paddy / Rice (ಭತ್ತ)",
        "guidance": "Paddy blast (Pyricularia oryzae) causes diamond-shaped leaf lesions. Avoid excessive chemical nitrogen fertilizer top-dressing during cloudy weather. Maintain 2-3 cm shallow water layer. Remove infected weed hosts along bunds.",
        "source": "ICAR-Indian Institute of Rice Research & UAS Dharwad",
        "provenance": "Verified Agricultural Advisory Code: AGRI-KA-PADDY-04"
    },
    {
        "keywords": ["ragi", "finger millet", "ರಾಗಿ", "blast", "ಕೊಳೆ"],
        "crop": "Finger Millet / Ragi (ರಾಗಿ)",
        "guidance": "Ragi blast attacks nursery seedlings, leaves, and earheads. Treat seeds before sowing. Use recommended crop spacing (22.5 x 10 cm) to ensure aeration. Apply balanced farmyard manure with recommended bio-fertilizers.",
        "source": "All India Coordinated Research Project on Small Millets, GKVK",
        "provenance": "Verified Agricultural Advisory Code: AGRI-KA-RAGI-02"
    },
    {
        "keywords": ["tomato", "blight", "curling", "ಟೊಮೆಟೊ", "ಎಲೆ ಸುರುಟು"],
        "crop": "Tomato (ಟೊಮೆಟೊ)",
        "guidance": "Leaf curl in tomato is vector-borne via whiteflies. Install yellow sticky traps (15-20 traps per acre). For early/late blight, avoid overhead sprinkler wetting and space plants to dry foliage rapidly.",
        "source": "ICAR-Indian Institute of Horticultural Research (IIHR, Hessaraghatta)",
        "provenance": "Verified Agricultural Advisory Code: AGRI-KA-TOMATO-03"
    },
    {
        "keywords": ["water", "pump", "handpump", "borewell", "ಕುಡಿಯುವ ನೀರು", "ಕೊಳವೆಬಾವಿ"],
        "crop": "Civic Water Utility (ನೀರು ಸರಬರಾಜು)",
        "guidance": "Inspect handle chain link, foot valve leather packing, and cylinder seal leakage. If borewell depth has receded below suction limit, install riser pipe extension or arrange emergency Panchayat tanker relief.",
        "source": "Rural Water Supply & Sanitation Department, Govt of Karnataka",
        "provenance": "Verified Civic Infrastructure Code: CIVIC-RWSS-01"
    }
]

def find_verified_knowledge(query: str) -> list[dict]:
    query_lower = query.lower()
    matches = []
    for item in VERIFIED_KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw.lower() in query_lower:
                matches.append(item)
                break
    return matches

def call_gemini_api(prompt: str, system_instruction: str, history: list = None) -> tuple[str, Optional[str]]:
    """
    Calls the Gemini API using the official google-genai SDK.
    Validates credentials and catches quota, timeout, or configuration errors safely.
    NEVER logs or exposes the API key.
    """
    if not settings.GEMINI_API_KEY:
        return "", "GEMINI_API_KEY is not configured on the server."

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Prepare contents
        contents = []
        if history:
            for msg in history:
                role = "user" if msg.role == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)]
                ))
        
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)]
        ))

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=1024,
        )

        model_name = settings.GEMINI_MODEL
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config
        )

        if response and response.text:
            return response.text, None
        return "I could not generate a response. Please try again.", None

    except Exception as exc:
        err_msg = str(exc)
        # Sanitize error message to ensure no secret is leaked
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY in err_msg:
            err_msg = err_msg.replace(settings.GEMINI_API_KEY, "[REDACTED_API_KEY]")
        
        logger.error(f"Gemini API invocation error: {err_msg}")
        return "", f"AI service error: {err_msg}"

@router.get("/status")
def get_ai_status():
    """
    Checks AI service availability without exposing secrets.
    """
    has_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    return {
        "provider": settings.AI_PROVIDER,
        "configured_mode": settings.AI_MODE,
        "gemini_configured": has_key,
        "gemini_model": settings.GEMINI_MODEL,
        "supported_languages": [
            {"code": "kn-IN", "name": "Kannada (ಕನ್ನಡ)", "priority": 1},
            {"code": "hi-IN", "name": "Hindi (हिन्दी)", "priority": 2},
            {"code": "te-IN", "name": "Telugu (తెలుగు)", "priority": 3},
            {"code": "ta-IN", "name": "Tamil (தமிழ்)", "priority": 4},
            {"code": "en-US", "name": "English", "priority": 5}
        ],
        "local_knowledge_entries": len(VERIFIED_KNOWLEDGE_BASE)
    }

@router.post("/chat", response_model=AIChatResponse)
def voice_copilot_chat(payload: AIChatRequest):
    """
    Multilingual Voice Copilot assistant endpoint.
    Handles Kannada, Hindi, Telugu, Tamil, and English.
    Respects operating modes: Online, Hybrid, Strict Offline.
    """
    mode = payload.mode.lower()
    user_lang = payload.language or "kn-IN"

    # Enforce Strict Offline rule
    if mode == "strict_offline":
        verified = find_verified_knowledge(payload.prompt)
        if verified:
            item = verified[0]
            reply_text = f"[Offline Knowledge Mode]\n{item['guidance']}"
            return AIChatResponse(
                reply=reply_text,
                language=user_lang,
                provider_used="local_knowledge",
                execution_mode="strict_offline",
                suggested_follow_ups=["Is there water stagnation?", "When did symptoms begin?"],
                verified_sources=[item["provenance"] + " — " + item["source"]]
            )
        return AIChatResponse(
            reply="Strict Offline mode is active. Cloud AI is disabled. For agricultural advice, specify crop (Arecanut, Paddy, Ragi, Tomato) or water infrastructure issue.",
            language=user_lang,
            provider_used="offline_rule",
            execution_mode="strict_offline",
            suggested_follow_ups=["Arecanut fruit rot", "Paddy blast symptoms", "Borewell repair"],
            verified_sources=[]
        )

    # Hybrid & Online Mode
    # Step 1: Check verified local knowledge to ground the prompt
    verified_items = find_verified_knowledge(payload.prompt)
    grounding_context = ""
    verified_sources = []
    if verified_items:
        grounding_context = "\n".join([f"- Crop/Topic: {v['crop']}\n  Guidance: {v['guidance']}\n  Source: {v['source']}" for v in verified_items])
        verified_sources = [f"{v['provenance']} ({v['source']})" for v in verified_items]

    system_prompt = f"""You are the OfflineFirst Voice Copilot for rural farmers and field workers.
Your primary audience speaks {user_lang}.
Rules:
1. Always respond in the requested language ({user_lang}). If Kannada (kn-IN), respond in clear, simple spoken Kannada. If Hindi, in Hindi. If Telugu, in Telugu. If Tamil, in Tamil. If English, in English.
2. Keep explanations concise, practical, and respectful.
3. For agricultural queries, NEVER invent unverified chemical pesticides or dosages. If uncertain, ask clarifying questions (crop type, growth stage, soil condition).
4. Use this verified agricultural knowledge if applicable:
{grounding_context}
5. Provide 2 short suggested follow-up questions at the end if relevant."""

    # Call Gemini if key is available
    if settings.GEMINI_API_KEY:
        gemini_reply, err = call_gemini_api(
            prompt=payload.prompt,
            system_instruction=system_prompt,
            history=payload.history
        )
        if gemini_reply and not err:
            return AIChatResponse(
                reply=gemini_reply,
                language=user_lang,
                provider_used="gemini",
                execution_mode=mode,
                suggested_follow_ups=["How to prepare organic spray?", "What is the recommended irrigation schedule?"],
                verified_sources=verified_sources
            )
        # If Gemini returned an error, fallback gracefully in hybrid mode
        if mode == "online":
            return AIChatResponse(
                reply=f"Could not connect to online AI: {err}. Please check your connection or switch to Hybrid mode.",
                language=user_lang,
                provider_used="gemini",
                execution_mode="online",
                error=err
            )

    # Hybrid Fallback when Gemini is unavailable or not configured
    if verified_items:
        item = verified_items[0]
        reply_text = f"Notice: Cloud AI offline. Verified Knowledge Guidance ({item['crop']}):\n{item['guidance']}"
        return AIChatResponse(
            reply=reply_text,
            language=user_lang,
            provider_used="local_knowledge",
            execution_mode=mode,
            suggested_follow_ups=["When did symptoms appear?", "Describe leaf spots"],
            verified_sources=verified_sources
        )

    # General Fallback response in appropriate language
    fallback_replies = {
        "kn-IN": "ನಮಸ್ಕಾರ. ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಸಹಾಯವಾಣಿ ಸಿದ್ಧವಾಗಿದೆ. ದಯವಿಟ್ಟು ಬೆಳೆಯ ಹೆಸರು (ಅಡಿಕೆ, ಭತ್ತ, ರಾಗಿ, ಟೊಮೆಟೊ) ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
        "hi-IN": "नमस्ते। ऑफलाइन कृषि और फील्ड सहायक तैयार है। कृपया फसल का नाम या समस्या बताएं।",
        "te-IN": "నమస్కారం. ఆఫ్‌లైన్ వ్యవసాయ సహాయకుడు సిద్ధంగా ఉన్నాడు. దయచేసి పంట లేదా సమస్యను పేర్కొనండి.",
        "ta-IN": "வணக்கம். ஆஃப்லைன் விவசாய உதவியாளர் தயார். பயிர் அல்லது சிக்கலை குறிப்பிடவும்.",
        "en-US": "Hello. Offline agricultural and field assistant is ready. Please mention crop name (Arecanut, Paddy, Ragi, Tomato) or infrastructure issue."
    }
    msg = fallback_replies.get(user_lang, fallback_replies["kn-IN"])

    return AIChatResponse(
        reply=msg,
        language=user_lang,
        provider_used="offline_rule",
        execution_mode=mode,
        suggested_follow_ups=["Arecanut fruit rot guidance", "Paddy blast symptoms", "Hand pump repair"],
        verified_sources=[]
    )

@router.post("/analyze-report", response_model=AIReportAnalysisResponse)
def analyze_field_report(payload: AIReportAnalysisRequest):
    """
    Analyzes field worker inspection reports for:
    - Concise summaries
    - Missing fields check
    - Category & Severity recommendations
    - Supervisor brief
    """
    mode = payload.mode.lower()
    
    # 1. Deterministic Heuristic Analysis (always calculated for consistency)
    text = f"{payload.title} {payload.description} {payload.notes or ''}".lower()
    
    suggested_cat = payload.category or "infrastructure"
    if any(k in text for k in ["pump", "water", "pipe", "borewell", "tank", "leak"]):
        suggested_cat = "water_supply"
    elif any(k in text for k in ["crop", "paddy", "areca", "pest", "soil", "harvest", "canal"]):
        suggested_cat = "agriculture"
    elif any(k in text for k in ["clinic", "hospital", "doctor", "medicine", "fever", "health"]):
        suggested_cat = "healthcare"
    elif any(k in text for k in ["road", "bridge", "wire", "pole", "electric", "drainage", "culvert"]):
        suggested_cat = "infrastructure"
    elif any(k in text for k in ["school", "teacher", "classroom", "student", "desk"]):
        suggested_cat = "education"

    suggested_sev = payload.severity or "medium"
    if any(k in text for k in ["critical", "emergency", "danger", "contamination", "collapse", "outbreak", "hazard"]):
        suggested_sev = "critical"
    elif any(k in text for k in ["high", "broken", "severe", "major", "failed", "school", "hospital"]):
        suggested_sev = "high"
    elif any(k in text for k in ["routine", "minor", "inspection", "survey", "cosmetic"]):
        suggested_sev = "low"

    # Identify missing fields
    missing = []
    if len(payload.description.strip()) < 30:
        missing.append("Detailed description of impact or physical defect")
    if not any(k in text for k in ["village", "sector", "gate", "road", "near", "survey", "block"]):
        missing.append("Specific landmark or physical landmark reference")
    if not any(k in text for k in ["people", "families", "household", "farmers", "children", "villagers"]):
        missing.append("Estimated number of affected residents or households")

    summary = f"Field inspection regarding {payload.title}. Categorized as {suggested_cat.replace('_', ' ')} with {suggested_sev.upper()} priority."
    supervisor_notes = f"Action required: Dispatch {suggested_cat.replace('_', ' ')} assessment crew. Address missing observations: {', '.join(missing) if missing else 'None, report is thorough'}."

    # If online/hybrid and Gemini is configured, enhance with LLM reasoning
    if mode != "strict_offline" and settings.GEMINI_API_KEY:
        prompt = f"""Analyze this field inspection report:
Title: {payload.title}
Description: {payload.description}
Current Category: {payload.category}
Current Severity: {payload.severity}
Notes: {payload.notes}

Return a valid JSON object matching this schema:
{{
  "summary": "1-2 sentence executive summary",
  "suggested_category": "water_supply|agriculture|healthcare|infrastructure|education|other",
  "suggested_severity": "low|medium|high|critical",
  "missing_information": ["list of missing details"],
  "supervisor_notes": "operational directive for block officer"
}}"""
        system = "You are a senior field civil and public works inspection auditor. Always return clean JSON without markdown code fences."
        gemini_text, err = call_gemini_api(prompt, system)
        if gemini_text and not err:
            try:
                clean = gemini_text.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.startswith("```"):
                    clean = clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                parsed = json.loads(clean.strip())
                return AIReportAnalysisResponse(
                    summary=parsed.get("summary", summary),
                    suggested_category=parsed.get("suggested_category", suggested_cat),
                    suggested_severity=parsed.get("suggested_severity", suggested_sev),
                    missing_information=parsed.get("missing_information", missing),
                    supervisor_notes=parsed.get("supervisor_notes", supervisor_notes),
                    confidence_score=0.92,
                    provider_used="gemini"
                )
            except Exception:
                pass

    return AIReportAnalysisResponse(
        summary=summary,
        suggested_category=suggested_cat,
        suggested_severity=suggested_sev,
        missing_information=missing,
        supervisor_notes=supervisor_notes,
        confidence_score=0.85,
        provider_used="offline_heuristic"
    )
