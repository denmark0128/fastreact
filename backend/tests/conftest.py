import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient


os.environ['DATABASE_URL'] = 'sqlite:///./test_hr.sqlite3'
os.environ['JWT_SECRET_KEY'] = 'test_jwt_secret_3d9f6a1b2c4e8g7h5k0m9n2p6q1r4s8'
os.environ['BIOMETRIC_INGEST_API_KEY'] = 'test_bio_ingest_2f3a7c8d'
os.environ['DEFAULT_ADMIN_EMAIL'] = 'admin@company.com'
os.environ['DEFAULT_ADMIN_PASSWORD'] = 'admin987654321'
os.environ['DEFAULT_ADMIN_NAME'] = 'System Admin'
os.environ['DEFAULT_HR_EMAIL'] = 'hr@company.com'
os.environ['DEFAULT_HR_PASSWORD'] = 'hr987654321'
os.environ['DEFAULT_HR_NAME'] = 'HR Manager'

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope='function')
def client() -> Generator[TestClient, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)


def auth_headers(client: TestClient) -> dict[str, str]:
    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'admin@company.com',
            'password': 'admin987654321',
        },
    )
    token = login_response.json()['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
