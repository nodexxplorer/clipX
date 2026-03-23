"""
Gemini AI Chat endpoint — streaming movie recommendation assistant.
Uses Google's Gemini model to provide intelligent movie recommendations.
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json

router = APIRouter()

# Lazy-load the Gemini model
_model = None

def get_model():
    global _model
    if _model is None:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set")
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction="""You are ClipX AI — a friendly, knowledgeable movie and TV show recommendation assistant.

Your personality:
- Enthusiastic about cinema and TV
- Give concise but helpful responses
- Use movie/TV emoji sparingly (🎬 🍿 🎥)
- When recommending movies, always mention: title, year, and a brief reason why
- Format recommendations as numbered lists when giving multiple suggestions
- You can discuss plot summaries, cast info, ratings, genres, and similar titles
- If asked about non-movie topics, gently redirect back to movies/shows
- Keep responses under 300 words unless the user asks for detail

You have access to information about movies and TV shows. Help users discover great content!"""
        )
    return _model


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None  # [{role: "user"/"model", parts: ["text"]}]


@router.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    """Non-streaming Gemini chat endpoint."""
    try:
        model = get_model()
        
        # Build chat history
        chat_history = []
        if req.history:
            for msg in req.history:
                chat_history.append({
                    "role": msg.get("role", "user"),
                    "parts": msg.get("parts", [msg.get("content", "")])
                })
        
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(req.message)
        
        return {
            "response": response.text,
            "role": "model"
        }
    except RuntimeError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(status_code=503, detail="AI service not configured. Please add GEMINI_API_KEY to .env")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"[AI Chat] Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")


@router.post("/ai/chat/stream")
async def ai_chat_stream(req: ChatRequest):
    """Streaming Gemini chat endpoint — sends chunks as SSE."""
    try:
        model = get_model()
        
        chat_history = []
        if req.history:
            for msg in req.history:
                chat_history.append({
                    "role": msg.get("role", "user"),
                    "parts": msg.get("parts", [msg.get("content", "")])
                })
        
        chat = model.start_chat(history=chat_history)
        
        async def generate():
            try:
                response = chat.send_message(req.message, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except RuntimeError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(status_code=503, detail="AI service not configured")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
