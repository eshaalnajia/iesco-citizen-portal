import pytest
import os
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "test"

from app.main import app
from app.config import supabase


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token():
    email    = os.environ.get("TEST_ADMIN_EMAIL", "admin@iesco.gov.pk")
    password = os.environ.get("TEST_ADMIN_PASSWORD", "")
    if not password:
        pytest.skip("TEST_ADMIN_PASSWORD not set -- skipping admin tests")
    result = supabase.auth.sign_in_with_password({"email": email, "password": password})
    return result.session.access_token


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_feeder_id(client):
    response = client.get("/feeders/")
    feeders = response.json()["data"]
    assert len(feeders) > 0, "No feeders in database"
    return feeders[0]["id"]