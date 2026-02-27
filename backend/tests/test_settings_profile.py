from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_update_my_profile(client: TestClient):
    headers = auth_headers(client)

    update_response = client.put(
        '/api/v1/auth/me',
        headers=headers,
        json={
            'full_name': 'System Admin Updated',
            'profile_picture_url': 'https://example.com/admin.png',
        },
    )

    assert update_response.status_code == 200
    data = update_response.json()['data']
    assert data['full_name'] == 'System Admin Updated'
    assert data['profile_picture_url'] == 'https://example.com/admin.png'


def test_department_and_company_profile_management(client: TestClient):
    headers = auth_headers(client)

    create_department_response = client.post(
        '/api/v1/settings/departments',
        headers=headers,
        json={
            'name': 'Finance',
            'description': 'Finance team',
        },
    )
    assert create_department_response.status_code == 201
    department_id = create_department_response.json()['data']['id']

    update_department_response = client.put(
        f'/api/v1/settings/departments/{department_id}',
        headers=headers,
        json={
            'name': 'Finance & Accounting',
            'description': 'Finance and accounting team',
            'head_employee_id': 1,
        },
    )
    assert update_department_response.status_code == 200
    updated_department = update_department_response.json()['data']
    assert updated_department['name'] == 'Finance & Accounting'
    assert updated_department['head_employee_id'] == 1

    list_departments_response = client.get('/api/v1/settings/departments', headers=headers)
    assert list_departments_response.status_code == 200
    departments = list_departments_response.json()['data']
    assert len(departments) == 1
    assert departments[0]['name'] == 'Finance & Accounting'

    update_company_response = client.put(
        '/api/v1/settings/company-profile',
        headers=headers,
        json={
            'company_name': 'FastReact Inc',
            'email': 'hello@fastreact.dev',
            'contact_number': '+63 912 345 6789',
            'street': 'Main Street 123',
            'city': 'Cebu City',
            'region': 'Central Visayas',
            'logo_url': 'https://example.com/company-logo.png',
        },
    )
    assert update_company_response.status_code == 200
    company_profile = update_company_response.json()['data']
    assert company_profile['company_name'] == 'FastReact Inc'
    assert company_profile['contact_number'] == '+63 912 345 6789'
    assert company_profile['street'] == 'Main Street 123'
    assert company_profile['city'] == 'Cebu City'
    assert company_profile['region'] == 'Central Visayas'
    assert company_profile['logo_url'] == 'https://example.com/company-logo.png'

    get_company_response = client.get('/api/v1/settings/company-profile', headers=headers)
    assert get_company_response.status_code == 200
    assert get_company_response.json()['data']['company_name'] == 'FastReact Inc'


def test_admin_settings_management(client: TestClient):
    headers = auth_headers(client)

    get_admin_settings_response = client.get('/api/v1/settings/admin', headers=headers)
    assert get_admin_settings_response.status_code == 200
    assert get_admin_settings_response.json()['data']['payroll_cutoff_mode'] == 'semi_monthly'

    update_admin_settings_response = client.put(
        '/api/v1/settings/admin',
        headers=headers,
        json={
            'late_grace_minutes': 10,
            'minimum_overtime_minutes': 45,
            'undertime_rounding_minutes': 5,
            'payroll_cutoff_mode': 'monthly',
            'employee_self_service_enabled': True,
            'allow_hr_process_payroll': True,
            'allow_hr_manage_employees': True,
            'allow_hr_manage_settings': False,
            'default_employee_role': 'employee',
            'default_rate_type': 'monthly',
            'default_shift_start': '08:30',
            'default_shift_end': '17:30',
            'default_work_days': 'monday-friday',
        },
    )

    assert update_admin_settings_response.status_code == 200
    updated = update_admin_settings_response.json()['data']
    assert updated['late_grace_minutes'] == 10
    assert updated['minimum_overtime_minutes'] == 45
    assert updated['payroll_cutoff_mode'] == 'monthly'
    assert updated['default_shift_start'] == '08:30'

    confirm_response = client.get('/api/v1/settings/admin', headers=headers)
    assert confirm_response.status_code == 200
    assert confirm_response.json()['data']['late_grace_minutes'] == 10