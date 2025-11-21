def test_chat_endpoint(client, mocker):
    # Mock RAGService.astream
    mock_rag_service = mocker.patch("app.api.endpoints.chat.RAGService")
    mock_instance = mock_rag_service.return_value
    
    async def mock_stream(message):
        yield "Hello"
        yield " World"
        
    mock_instance.astream = mock_stream

    response = client.post("/api/v1/chat/chat", json={"message": "Hello"})
    
    # StreamingResponse is hard to test with TestClient fully, but we check status
    assert response.status_code == 200
