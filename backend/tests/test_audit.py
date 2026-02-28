from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_audit_log_created_for_employee_create(client: TestClient):
    headers = auth_headers(client)

    create_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'EMP-9001',
            'profile_name': 'Audit Test Employee',
            'department': 'Engineering',
            'position': 'Developer',
            'employment_status': 'active',
            'rate_type': 'monthly',
            'rate_amount': 35000,
            'hourly_rate': 220,
        },
    )
    assert create_response.status_code == 201

    logs_response = client.get(
        '/api/v1/audit/logs',
        headers=headers,
        params={
            'action': 'create_employee',
            'entity_type': 'employee',
        },
    )
    assert logs_response.status_code == 200

    payload = logs_response.json()['data']
    assert payload['total'] >= 1
    first_log = payload['items'][0]
    assert first_log['action'] == 'create_employee'
    assert first_log['entity_type'] == 'employee'
    assert first_log['actor_email'] == 'admin@company.com'


def test_audit_logs_forbidden_for_employee_role(client: TestClient):
    signup_response = client.post(
        '/api/v1/auth/signup',
        json={
            'email': 'audit-employee@company.com',
            'full_name': 'Audit Employee',
            'password': 'Employee1pass',
            'department': 'Engineering',
        },
    )
    assert signup_response.status_code == 201

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'audit-employee@company.com',
            'password': 'Employee1pass',
        },
    )
    assert login_response.status_code == 200
    employee_token = login_response.json()['data']['access_token']

    logs_response = client.get(
        '/api/v1/audit/logs',
        headers={'Authorization': f'Bearer {employee_token}'},
    )
    assert logs_response.status_code == 403


def test_audit_log_filter_by_action(client: TestClient):
    headers = auth_headers(client)

    update_company_response = client.put(
        '/api/v1/settings/company-profile',
        headers=headers,
        json={
            'company_name': 'Audit Co',
            'email': 'audit@co.dev',
        },
    )
    assert update_company_response.status_code == 200

    logs_response = client.get(
        '/api/v1/audit/logs',
        headers=headers,
        params={'action': 'update_company_profile'},
    )
    assert logs_response.status_code == 200
    payload = logs_response.json()['data']
    assert payload['total'] >= 1
    assert payload['items'][0]['action'] == 'update_company_profile'
