from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.database import db
from app.core.config import get_settings
import json

settings = get_settings()

class DriveService:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.creds = self._get_credentials()

    def _get_credentials(self):
        session = db.get_session()
        try:
            result = session.run("""
            MATCH (u:User {id: $user_id})
            RETURN u.google_access_token as access_token,
                   u.google_refresh_token as refresh_token,
                   u.token_expiry as expiry
            """, {"user_id": self.user_id})
            record = result.single()
            
            if not record:
                raise Exception("User not connected to Google")

            return Credentials(
                token=record["access_token"],
                refresh_token=record["refresh_token"],
                token_uri="https://oauth2.googleapis.com/token",
                client_id="YOUR_GOOGLE_CLIENT_ID", # Should be from settings
                client_secret="YOUR_GOOGLE_CLIENT_SECRET", # Should be from settings
                scopes=["https://www.googleapis.com/auth/drive.readonly"]
            )
        finally:
            session.close()

    def list_files(self, page_size=10):
        service = build('drive', 'v3', credentials=self.creds)
        results = service.files().list(
            pageSize=page_size, 
            fields="nextPageToken, files(id, name, mimeType, createdTime)"
        ).execute()
        return results.get('files', [])

    def get_file_content(self, file_id):
        service = build('drive', 'v3', credentials=self.creds)
        # For simplicity, just returning metadata for now. 
        # Real implementation would use service.files().export_media or get_media
        return service.files().get(fileId=file_id).execute()
