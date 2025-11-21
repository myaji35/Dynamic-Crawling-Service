import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import db
from unittest.mock import MagicMock

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_neo4j_session(mocker):
    mock_session = MagicMock()
    mocker.patch.object(db, "get_session", return_value=mock_session)
    return mock_session

@pytest.fixture
def mock_openai(mocker):
    return mocker.patch("app.services.extraction_service.ChatOpenAI")
