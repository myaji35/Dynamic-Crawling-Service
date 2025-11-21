from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.rag_service import RAGService

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):
    service = RAGService()
    
    async def generate():
        async for chunk in service.astream(request.message):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
