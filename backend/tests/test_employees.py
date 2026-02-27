from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_employee_crud_flow(client: TestClient):
    headers = auth_headers(client)

    create_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'EMP-001',
            'profile_name': 'John Smith',
            'birth_date': '1994-04-20',
            'civil_status': 'single',
            'emergency_contact_name': 'Jane Smith',
            'emergency_contact_number': '+63 912 000 0001',
            'department': 'Engineering',
            'position': 'Software Engineer',
            'employment_status': 'active',
            'user_id': None,
        },
    )
    assert create_response.status_code == 201
    created_employee = create_response.json()['data']
    employee_id = created_employee['id']

    list_response = client.get('/api/v1/employees/', headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()['data']) == 1

    get_response = client.get(f'/api/v1/employees/{employee_id}', headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()['data']['employee_code'] == 'EMP-001'
    assert get_response.json()['data']['civil_status'] == 'single'

    update_response = client.put(
        f'/api/v1/employees/{employee_id}',
        headers=headers,
        json={
            'profile_name': 'John S.',
            'civil_status': 'married',
            'emergency_contact_number': '+63 912 000 1111',
            'department': 'Platform',
            'position': 'Senior Engineer',
            'employment_status': 'active',
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()['data']['profile_name'] == 'John S.'
    assert update_response.json()['data']['civil_status'] == 'married'
    assert update_response.json()['data']['emergency_contact_number'] == '+63 912 000 1111'

    delete_response = client.delete(f'/api/v1/employees/{employee_id}', headers=headers)
    assert delete_response.status_code == 200

    final_list_response = client.get('/api/v1/employees/', headers=headers)
    assert final_list_response.status_code == 200
    assert final_list_response.json()['data'] == []
