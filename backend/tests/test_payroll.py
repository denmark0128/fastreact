from fastapi.testclient import TestClient
from pytest import approx

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


def test_payroll_uses_attendance_records(client: TestClient):
    headers = auth_headers(client)

    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'PAY-ATT-001',
            'profile_name': 'Payroll Attendance Employee',
            'department': 'Finance',
            'position': 'Analyst',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 800,
            'weekly_schedule': {
                'monday': '09:00-18:00',
                'tuesday': None,
                'wednesday': None,
                'thursday': None,
                'friday': None,
                'saturday': None,
                'sunday': None,
            },
        },
    )
    assert create_employee_response.status_code == 201
    employee_id = create_employee_response.json()['data']['id']

    create_attendance_response = client.post(
        '/api/v1/attendance/records',
        headers=headers,
        json={
            'employee_id': employee_id,
            'date': '2026-02-16',
            'am_in': '09:15',
            'am_out': '12:00',
            'pm_in': '12:00',
            'pm_out': '18:00',
        },
    )
    assert create_attendance_response.status_code == 201

    process_response = client.post(
        '/api/v1/payroll/process',
        headers=headers,
        json={
            'cutoff_start': '2026-02-16',
            'cutoff_end': '2026-02-16',
            'pay_date': '2026-02-28',
            'employee_ids': [employee_id],
            'adjustments': [],
        },
    )

    assert process_response.status_code == 200
    records = process_response.json()['data']
    assert len(records) == 1
    record = records[0]
    assert record['actual_minutes'] == 525
    assert record['late_minutes'] == 15
    assert record['undertime_minutes'] == 0
    assert record['overtime_minutes'] == 0


def test_payroll_does_not_count_day_off_as_absent(client: TestClient):
    headers = auth_headers(client)

    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'PAY-OFF-001',
            'profile_name': 'Payroll Day Off Employee',
            'department': 'Finance',
            'position': 'Analyst',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 800,
            'weekly_schedule': {
                'monday': '09:00-18:00',
                'tuesday': None,
                'wednesday': None,
                'thursday': None,
                'friday': None,
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
            'cutoff_end': '2026-02-17',
            'pay_date': '2026-02-28',
            'employee_ids': [employee_id],
            'adjustments': [],
        },
    )

    assert process_response.status_code == 200
    records = process_response.json()['data']
    assert len(records) == 1

    record = records[0]
    assert record['scheduled_minutes'] == 540
    assert record['actual_minutes'] == 0
    assert record['late_minutes'] == 0
    assert record['undertime_minutes'] == 0
    assert record['overtime_minutes'] == 0

    process_monday_only_response = client.post(
        '/api/v1/payroll/process',
        headers=headers,
        json={
            'cutoff_start': '2026-02-16',
            'cutoff_end': '2026-02-16',
            'pay_date': '2026-02-28',
            'employee_ids': [employee_id],
            'adjustments': [],
        },
    )

    assert process_monday_only_response.status_code == 200
    monday_only_record = process_monday_only_response.json()['data'][0]
    assert monday_only_record['scheduled_minutes'] == record['scheduled_minutes']
    assert monday_only_record['actual_minutes'] == record['actual_minutes']
    assert monday_only_record['late_minutes'] == record['late_minutes']
    assert monday_only_record['undertime_minutes'] == record['undertime_minutes']
    assert monday_only_record['overtime_minutes'] == record['overtime_minutes']


def test_payroll_uses_each_employee_own_rate(client: TestClient):
    headers = auth_headers(client)

    lower_rate_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'PAY-RATE-001',
            'profile_name': 'Payroll Lower Rate Employee',
            'department': 'Finance',
            'position': 'Analyst',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 800,
            'weekly_schedule': {
                'monday': '09:00-18:00',
                'tuesday': None,
                'wednesday': None,
                'thursday': None,
                'friday': None,
                'saturday': None,
                'sunday': None,
            },
        },
    )
    assert lower_rate_employee_response.status_code == 201
    lower_rate_employee_id = lower_rate_employee_response.json()['data']['id']

    higher_rate_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'PAY-RATE-002',
            'profile_name': 'Payroll Higher Rate Employee',
            'department': 'Finance',
            'position': 'Analyst',
            'employment_status': 'active',
            'rate_type': 'daily',
            'rate_amount': 1200,
            'weekly_schedule': {
                'monday': '09:00-18:00',
                'tuesday': None,
                'wednesday': None,
                'thursday': None,
                'friday': None,
                'saturday': None,
                'sunday': None,
            },
        },
    )
    assert higher_rate_employee_response.status_code == 201
    higher_rate_employee_id = higher_rate_employee_response.json()['data']['id']

    process_response = client.post(
        '/api/v1/payroll/process',
        headers=headers,
        json={
            'cutoff_start': '2026-02-16',
            'cutoff_end': '2026-02-16',
            'pay_date': '2026-02-28',
            'employee_ids': [lower_rate_employee_id, higher_rate_employee_id],
            'adjustments': [],
        },
    )

    assert process_response.status_code == 200
    records = process_response.json()['data']
    assert len(records) == 2

    record_by_employee_id = {item['employee_id']: item for item in records}
    lower_rate_record = record_by_employee_id[lower_rate_employee_id]
    higher_rate_record = record_by_employee_id[higher_rate_employee_id]

    assert lower_rate_record['scheduled_minutes'] == higher_rate_record['scheduled_minutes'] == 540
    assert lower_rate_record['actual_minutes'] == higher_rate_record['actual_minutes'] == 0
    assert lower_rate_record['basic_pay'] < higher_rate_record['basic_pay']
    assert lower_rate_record['net_pay'] < higher_rate_record['net_pay']
    assert higher_rate_record['basic_pay'] == approx(lower_rate_record['basic_pay'] * 1.5, abs=0.01)
    assert higher_rate_record['late_deduction'] == approx(lower_rate_record['late_deduction'] * 1.5, abs=0.01)
    assert higher_rate_record['undertime_deduction'] == approx(lower_rate_record['undertime_deduction'] * 1.5, abs=0.01)
