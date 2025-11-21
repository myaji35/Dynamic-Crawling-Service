def test_authorize_google(client):
    response = client.get("/api/v1/auth/google/authorize")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "https://accounts.google.com/o/oauth2/v2/auth" in data["url"]

def test_google_callback(client, mock_neo4j_session, mocker):
    # Mock httpx.AsyncClient.post
    mock_post = mocker.patch("httpx.AsyncClient.post")
    mock_post.return_value = mocker.Mock(status_code=200, json=lambda: {
        "access_token": "fake_access_token",
        "refresh_token": "fake_refresh_token",
        "expires_in": 3600
    })

    response = client.get("/api/v1/auth/google/callback?code=fake_code&state=user_123", follow_redirects=False)
    
    # Should redirect to frontend
    assert response.status_code == 307 # Temporary Redirect
    assert "connected=true" in response.headers["location"]
    
    # Verify Neo4j was called
    mock_neo4j_session.run.assert_called_once()
