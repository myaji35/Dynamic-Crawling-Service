from fastapi import APIRouter, Depends, HTTPException
from app.services.drive_service import DriveService
# from app.api.endpoints.auth import get_current_user_id # Circular import risk, duplicate for now or move to deps

router = APIRouter()

async def get_current_user_id():
    return "user_test_123" # Mock

@router.post("/drive/sync")
async def sync_drive(user_id: str = Depends(get_current_user_id)):
    try:
        service = DriveService(user_id)
        files = service.list_files()
        
        # In a real app, we would send these files to Celery for processing
        return {"message": "Sync started", "files_found": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
