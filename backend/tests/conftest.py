import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient


os.environ['DATABASE_URL'] = 'sqlite:///./test_hr.sqlite3'
os.environ['DEFAULT_ADMIN_EMAIL'] = 'admin@company.com'
os.environ['DEFAULT_ADMIN_PASSWORD'] = 'admin12345'
os.environ['DEFAULT_ADMIN_NAME'] = 'System Admin'

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
            'password': 'admin12345',
        },
    )
    token = login_response.json()['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
