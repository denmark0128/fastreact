from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_biometric_ingest_and_payroll_attendance_integration(client: TestClient):
    headers = auth_headers(client)

    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'BIO-001',
            'biometric_id': 'FP-1001',
            'profile_name': 'Biometric Employee',
            'department': 'Operations',
            'position': 'Staff',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 1000,
            'weekly_schedule': {
                'monday': '09:00-18:00',
                'tuesday': '09:00-18:00',
                'wednesday': '09:00-18:00',
                'thursday': '09:00-18:00',
                'friday': '09:00-18:00',
                'saturday': None,
                'sunday': None,
            },
        },
    )
    assert create_employee_response.status_code == 201

    ingest_response = client.post(
        '/api/v1/leave/attendance/punches/ingest',
        headers={'x-biometric-api-key': 'test_bio_ingest_2f3a7c8d'},
        json={
            'punches': [
                {
                    'device_id': 'BIO-DEVICE-1',
                    'employee_biometric_id': 'FP-1001',
                    'punch_time': '2026-02-16T09:15:00',
                    'punch_type': 'in',
                    'punch_id': 'PUNCH-1',
                },
                {
                    'device_id': 'BIO-DEVICE-1',
                    'employee_biometric_id': 'FP-1001',
                    'punch_time': '2026-02-16T18:45:00',
                    'punch_type': 'out',
                    'punch_id': 'PUNCH-2',
                },
            ]
        },
    )
    assert ingest_response.status_code == 200
    assert ingest_response.json()['data']['ingested_count'] == 2

    duplicate_ingest_response = client.post(
        '/api/v1/leave/attendance/punches/ingest',
        headers={'x-biometric-api-key': 'test_bio_ingest_2f3a7c8d'},
        json={
            'punches': [
                {
                    'device_id': 'BIO-DEVICE-1',
                    'employee_biometric_id': 'FP-1001',
                    'punch_time': '2026-02-16T09:15:00',
                    'punch_type': 'in',
                    'punch_id': 'PUNCH-1',
                }
            ]
        },
    )
    assert duplicate_ingest_response.status_code == 200
    assert duplicate_ingest_response.json()['data']['duplicate_count'] == 1

    process_response = client.post(
        '/api/v1/payroll/process',
        headers=headers,
        json={
            'cutoff_start': '2026-02-16',
            'cutoff_end': '2026-02-16',
            'pay_date': '2026-02-28',
        },
    )
    assert process_response.status_code == 200
    record = process_response.json()['data'][0]

    assert record['late_minutes'] == 15
    assert record['overtime_minutes'] == 45
    assert record['undertime_minutes'] == 0


def test_biometric_ingest_requires_api_key(client: TestClient):
    response = client.post(
        '/api/v1/leave/attendance/punches/ingest',
        json={
            'punches': [
                {
                    'device_id': 'BIO-DEVICE-1',
                    'employee_biometric_id': 'FP-404',
                    'punch_time': '2026-02-16T09:15:00',
                }
            ]
        },
    )

    assert response.status_code == 401
