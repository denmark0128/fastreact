from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_login_success(client: TestClient):
    response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'admin@company.com',
            'password': 'admin987654321',
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body['success'] is True
    assert body['data']['token_type'] == 'bearer'
    assert body['data']['user']['role'] == 'admin'


def test_me_requires_auth(client: TestClient):
    response = client.get('/api/v1/auth/me')
    assert response.status_code == 401


def test_register_user_as_admin(client: TestClient):
    headers = auth_headers(client)

    response = client.post(
        '/api/v1/auth/register',
        headers=headers,
        json={
            'email': 'employee1@company.com',
            'full_name': 'Employee One',
            'password': 'employee123',
            'role': 'employee',
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body['success'] is True
    assert body['data']['email'] == 'employee1@company.com'


def test_signup_creates_employee_with_department(client: TestClient):
    signup_response = client.post(
        '/api/v1/auth/signup',
        json={
            'email': 'selfsignup@company.com',
            'full_name': 'Self Signup',
            'password': 'signup123',
            'department': 'Engineering',
        },
    )
    assert signup_response.status_code == 201

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'selfsignup@company.com',
            'password': 'signup123',
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()['data']['access_token']

    employees_response = client.get(
        '/api/v1/employees/',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert employees_response.status_code == 200
    employees = employees_response.json()['data']

    assert len(employees) == 1
    assert employees[0]['profile_name'] == 'Self Signup'
    assert employees[0]['department'] == 'Engineering'


def test_change_password(client: TestClient):
    headers = auth_headers(client)

    change_password_response = client.put(
        '/api/v1/auth/change-password',
        headers=headers,
        json={
            'current_password': 'admin987654321',
            'new_password': 'admin987654321-new',
        },
    )
    assert change_password_response.status_code == 200

    login_with_new_password_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'admin@company.com',
            'password': 'admin987654321-new',
        },
    )
    assert login_with_new_password_response.status_code == 200
