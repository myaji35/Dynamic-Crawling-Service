from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from app.core.config import get_settings
from app.core.database import db
import urllib.parse
import httpx

router = APIRouter()
settings = get_settings()

# These should be in .env
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID" 
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
REDIRECT_URI = "http://localhost:8000/api/v1/auth/google/callback"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly"
]

# Mock dependency for getting current user from Clerk
# In a real app, verify the Bearer token from Clerk
async def get_current_user_id(request: Request):
    # For now, we'll just assume a test user if no auth header is present for testing
    # In production, this MUST validate the Clerk JWT
    auth_header = request.headers.get("Authorization")
    if auth_header:
        # Extract user_id from token (mock logic)
        return "user_test_123" 
    return "user_test_123" # Fallback for testing

@router.get("/google/authorize")
async def authorize_google(user_id: str = Depends(get_current_user_id)):
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return {"url": auth_url}

@router.get("/google/callback")
async def google_callback(code: str, state: str, request: Request):
    user_id = state
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve token from Google")
        
        tokens = response.json()
        
        # Store tokens in Neo4j
        query = """
        MERGE (u:User {id: $user_id})
        SET u.google_access_token = $access_token,
            u.google_refresh_token = $refresh_token,
            u.token_expiry = $expiry,
            u.updated_at = datetime()
        """
        
        session = db.get_session()
        try:
            session.run(query, {
                "user_id": user_id,
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"), # Only present if access_type=offline
                "expiry": tokens.get("expires_in")
            })
        finally:
            session.close()

    return RedirectResponse(url="http://localhost:3000?connected=true")
