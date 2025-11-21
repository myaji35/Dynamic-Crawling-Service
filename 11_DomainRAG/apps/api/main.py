from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import db

settings = get_settings()

from app.api.endpoints import auth, ingest, chat, graph

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingest"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])

@app.on_event("startup")
async def startup_event():
    db.connect()

@app.on_event("shutdown")
async def shutdown_event():
    db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to GraphMind API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
