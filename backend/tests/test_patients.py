def test_create_patient_as_receptionist(client, auth_headers):
    headers = auth_headers("recep_patients", "receptionist")
    response = client.post("/patients/", json={
        "full_name": "John Doe",
        "gender": "Male",
        "phone": "0771234567",
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Doe"


def test_list_patients(client, auth_headers):
    headers = auth_headers("recep_list", "receptionist")
    client.post("/patients/", json={"full_name": "Jane Smith"}, headers=headers)
    response = client.get("/patients/", headers=headers)
    assert response.status_code == 200
    names = [p["full_name"] for p in response.json()]
    assert "Jane Smith" in names


def test_search_patients(client, auth_headers):
    headers = auth_headers("recep_search", "receptionist")
    client.post("/patients/", json={"full_name": "Alice Wonder"}, headers=headers)
    client.post("/patients/", json={"full_name": "Bob Builder"}, headers=headers)
    response = client.get("/patients/?search=Alice", headers=headers)
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["full_name"] == "Alice Wonder"


def test_doctor_cannot_access_patients(client, auth_headers):
    headers = auth_headers("doc_blocked", "doctor")
    response = client.get("/patients/", headers=headers)
    assert response.status_code == 403


def test_patient_not_found(client, auth_headers):
    headers = auth_headers("recep_404", "receptionist")
    response = client.get("/patients/99999", headers=headers)
    assert response.status_code == 404