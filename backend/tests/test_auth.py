def test_register_receptionist_success(client):
    response = client.post("/auth/register", json={
        "username": "reception1",
        "email": "reception1@test.com",
        "password": "TestPass123",
        "role": "receptionist",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "reception1"
    assert data["role"] == "receptionist"
    assert "password" not in data


def test_register_admin_rejected(client):
    response = client.post("/auth/register", json={
        "username": "sneaky_admin",
        "email": "sneaky@test.com",
        "password": "TestPass123",
        "role": "admin",
    })
    assert response.status_code == 403


def test_register_duplicate_username(client):
    payload = {
        "username": "dupeuser",
        "email": "dupe1@test.com",
        "password": "TestPass123",
        "role": "doctor",
    }
    client.post("/auth/register", json=payload)
    payload["email"] = "dupe2@test.com"
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={
        "username": "loginuser",
        "email": "loginuser@test.com",
        "password": "TestPass123",
        "role": "doctor",
    })
    response = client.post("/auth/login", json={"username": "loginuser", "password": "TestPass123"})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "username": "wrongpassuser",
        "email": "wrongpass@test.com",
        "password": "TestPass123",
        "role": "doctor",
    })
    response = client.post("/auth/login", json={"username": "wrongpassuser", "password": "WrongPassword"})
    assert response.status_code == 401


def test_me_requires_token(client):
    response = client.get("/auth/me")
    assert response.status_code in (401, 403)


def test_me_with_token(client, auth_headers):
    headers = auth_headers("meuser", "doctor")
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "meuser"