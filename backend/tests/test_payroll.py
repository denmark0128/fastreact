from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_payroll_process_cutoff_and_summary(client: TestClient):
    headers = auth_headers(client)

    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'PAY-001',
            'profile_name': 'Payroll Employee',
            'department': 'Finance',
            'position': 'Analyst',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 800,
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
    employee_id = create_employee_response.json()['data']['id']

    process_response = client.post(
        '/api/v1/payroll/process',
        headers=headers,
        json={
            'cutoff_start': '2026-02-16',
            'cutoff_end': '2026-02-20',
            'pay_date': '2026-02-28',
            'adjustments': [
                {
                    'employee_id': employee_id,
                    'actual_minutes': 2520,
                    'late_minutes': 30,
                    'overtime_minutes': 120,
                    'allowances': 250,
                    'other_deductions': 100,
                    'notes': 'Approved OT and lateness from attendance log',
                }
            ],
        },
    )

    assert process_response.status_code == 200
    processed_records = process_response.json()['data']
    assert len(processed_records) == 1

    record = processed_records[0]
    assert record['late_minutes'] == 30
    assert record['undertime_minutes'] >= 0
    assert record['overtime_minutes'] == 120
    assert record['gross_pay'] >= record['basic_pay']
    assert record['net_pay'] <= record['gross_pay']

    records_response = client.get(
        '/api/v1/payroll/records',
        headers=headers,
        params={'cutoff_start': '2026-02-16', 'cutoff_end': '2026-02-20'},
    )
    assert records_response.status_code == 200
    assert len(records_response.json()['data']) == 1

    summary_response = client.get(
        '/api/v1/payroll/summary',
        headers=headers,
        params={'cutoff_start': '2026-02-16', 'cutoff_end': '2026-02-20'},
    )
    assert summary_response.status_code == 200
    summary = summary_response.json()['data']
    assert summary['record_count'] == 1
    assert summary['total_late_minutes'] == 30
    assert summary['total_overtime_minutes'] == 120
