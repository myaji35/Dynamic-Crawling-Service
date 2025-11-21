from unittest.mock import MagicMock

def test_sync_drive(client, mock_neo4j_session, mocker):
    # Mock DriveService
    mock_drive_service = mocker.patch("app.api.endpoints.ingest.DriveService")
    mock_instance = mock_drive_service.return_value
    mock_instance.list_files.return_value = [{"id": "1", "name": "Test Doc"}]

    response = client.post("/api/v1/ingest/drive/sync")
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Sync started"
    assert data["files_found"] == 1
