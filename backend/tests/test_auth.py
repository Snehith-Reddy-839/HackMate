def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "roll_number": "12345",
            "branch": "CSE",
            "year": 3,
            "section": "A"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data

def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "duplicate@example.com",
            "password": "password123"
        }
    )
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Another User",
            "email": "duplicate@example.com",
            "password": "password456"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "password123"
        }
    )
    response = client.post(
        "/api/auth/login",
        data={
            "username": "login@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Login User 2",
            "email": "login2@example.com",
            "password": "password123"
        }
    )
    response = client.post(
        "/api/auth/login",
        data={
            "username": "login2@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_unauthorized_access(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_authorized_access(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Auth User",
            "email": "auth@example.com",
            "password": "password123"
        }
    )
    login_resp = client.post(
        "/api/auth/login",
        data={
            "username": "auth@example.com",
            "password": "password123"
        }
    )
    token = login_resp.json()["access_token"]
    
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "auth@example.com"
