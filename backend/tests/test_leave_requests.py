from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_leave_request_rejects_end_date_before_start_date(client: TestClient):
    signup_response = client.post(
        '/api/v1/auth/signup',
        json={
            'email': 'leave.employee@company.com',
            'full_name': 'Leave Employee',
            'password': 'LeaveEmp123!',
            'department': 'Operations',
        },
    )
    assert signup_response.status_code == 201

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'leave.employee@company.com',
            'password': 'LeaveEmp123!',
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    leave_response = client.post(
        '/api/v1/leave/requests',
        headers=headers,
        json={
            'leave_type': 'vacation',
            'start_date': '2026-03-10',
            'end_date': '2026-03-08',
            'reason': 'Invalid range check',
        },
    )

    assert leave_response.status_code == 400
    assert leave_response.json()['detail'] == 'end_date cannot be earlier than start_date'


def test_leave_request_rejects_invalid_date_format(client: TestClient):
    signup_response = client.post(
        '/api/v1/auth/signup',
        json={
            'email': 'leave.format@company.com',
            'full_name': 'Leave Format',
            'password': 'LeaveFmt123!',
            'department': 'Operations',
        },
    )
    assert signup_response.status_code == 201

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'leave.format@company.com',
            'password': 'LeaveFmt123!',
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    leave_response = client.post(
        '/api/v1/leave/requests',
        headers=headers,
        json={
            'leave_type': 'sick',
            'start_date': '03/10/2026',
            'end_date': '2026-03-12',
            'reason': 'Invalid date format check',
        },
    )

    assert leave_response.status_code == 400
    assert leave_response.json()['detail'] == 'start_date must be in YYYY-MM-DD format'


def test_leave_request_requires_linked_employee_profile(client: TestClient):
    admin_headers = auth_headers(client)

    register_response = client.post(
        '/api/v1/auth/register',
        headers=admin_headers,
        json={
            'email': 'leave.noemployee@company.com',
            'full_name': 'Leave No Employee',
            'password': 'LeaveNoEmp123!',
            'role': 'employee',
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'leave.noemployee@company.com',
            'password': 'LeaveNoEmp123!',
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    leave_response = client.post(
        '/api/v1/leave/requests',
        headers=headers,
        json={
            'leave_type': 'vacation',
            'start_date': '2026-03-15',
            'end_date': '2026-03-16',
            'reason': 'No employee profile check',
        },
    )

    assert leave_response.status_code == 400
    assert leave_response.json()['detail'] == 'No employee profile linked to your account'
