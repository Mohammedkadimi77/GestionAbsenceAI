from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import json

from beanie.operators import In

from app.core.deps import require_role
from app.models.absence import Absence
from app.models.justification import Justification
from app.models.seance import Seance
from app.models.module import Module
from app.ai.feature_engineering import compute_student_features
from app.ai.rules_engine import compute_anomaly_score

import google.generativeai as genai
from app.core.config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

router = APIRouter(prefix="/chatbot", tags=["Chatbot"], dependencies=[Depends(require_role("student"))])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []

@router.post("", response_model=ChatResponse)
async def chat_with_bot(payload: ChatRequest, current=Depends(require_role("student"))):
    student = current["user"]
    msg = payload.message
    
    # 1. Fetch data for context
    features = await compute_student_features(student.id, days=60)
    absences = await Absence.find(Absence.studentId == student.id).to_list()
    
    absence_ids = [a.id for a in absences]
    justifs = await Justification.find(In(Justification.absenceId, absence_ids)).to_list()
    
    total_absent = sum(1 for a in absences if a.statut == "absent")
    total_retard = sum(1 for a in absences if a.statut == "retard")
    
    statuts_justif = {"en_attente": 0, "validee": 0, "refusee": 0}
    for j in justifs:
        statuts_justif[j.statut] = statuts_justif.get(j.statut, 0) + 1
        
    score, reasons = compute_anomaly_score(features)
    
    context = f"""
    Données de l'étudiant {student.nom}:
    - Absences totales: {total_absent}
    - Retards totaux: {total_retard}
    - Justifications: Validées ({statuts_justif['validee']}), En attente ({statuts_justif['en_attente']}), Refusées ({statuts_justif['refusee']})
    - Score de risque d'absentéisme: {round(score * 100, 1)}%
    - Facteurs de risque: {', '.join(reasons) if reasons else 'Aucun'}
    """
    
    system_prompt = f"""
    Tu es un assistant IA polyvalent et bienveillant. 
    Tu peux répondre à n'importe quelle question de l'étudiant, qu'elle soit liée à ses études, à la vie quotidienne, ou à l'application.
    
    Pour les questions concernant ses absences ou sa situation scolaire, utilise les données réelles suivantes :
    {context}
    
    RÈGLES :
    1. Réponds en JSON : {{ "reply": "ton message", "suggestions": ["suggestion 1", "suggestion 2"] }}
    2. Les suggestions doivent être pertinentes par rapport au sujet (qu'il soit général ou lié aux absences).
    3. Sois toujours poli, clair et utile.
    """
    
    # Convert history to Gemini format
    history = []
    if payload.history:
        for m in payload.history:
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

    try:
        chat = model.start_chat(history=history)
        response = chat.send_message(f"{system_prompt}\n\nQuestion : {msg}")
        
        # Clean response text if it contains markdown code blocks
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
            
        data = json.loads(clean_text)
        reply = data.get("reply", "Désolé, je ne peux pas répondre pour le moment.")
        suggestions = data.get("suggestions", ["Mes absences ?", "Mon risque ?", "Aide"])
    except Exception as e:
        reply = "Désolé, je rencontre une difficulté technique. Pourrais-tu reformuler ?"
        suggestions = ["Mes absences ?", "Mon score ?", "Aide"]
        print(f"Gemini Error: {e}")

    return ChatResponse(reply=reply, suggestions=suggestions)
