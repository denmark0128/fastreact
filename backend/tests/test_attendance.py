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


def test_attendance_records_crud_and_csv_import(client: TestClient):
    headers = auth_headers(client)

    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'ATT-001',
            'profile_name': 'Attendance Employee',
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
    employee_id = create_employee_response.json()['data']['id']

    create_attendance_response = client.post(
        '/api/v1/attendance/records',
        headers=headers,
        json={
            'employee_id': employee_id,
            'date': '2026-03-01',
            'am_in': '08:50',
            'am_out': '12:00',
            'pm_in': '13:00',
            'pm_out': '18:10',
            'note': 'on-site',
        },
    )
    assert create_attendance_response.status_code == 201
    created_record = create_attendance_response.json()['data']
    assert created_record['am_in'] == '08:50'
    assert created_record['pm_out'] == '18:10'

    list_response = client.get('/api/v1/attendance/records', headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()['data']['total'] == 1

    update_response = client.put(
        f"/api/v1/attendance/records/{created_record['id']}",
        headers=headers,
        json={
            'pm_out': '18:30',
            'note': 'updated shift',
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()['data']['pm_out'] == '18:30'

    csv_content = '\n'.join(
        [
            'employee_code,date,am_in,am_out,pm_in,pm_out,note',
            'ATT-001,2026-03-01,08:55,12:05,13:05,18:20,csv update',
            'ATT-001,2026-03-02,09:00,12:00,13:00,18:00,new day',
        ]
    )

    import_response = client.post(
        '/api/v1/attendance/records/import',
        headers=headers,
        files={
            'file': ('attendance.csv', csv_content, 'text/csv'),
        },
    )
    assert import_response.status_code == 200
    import_data = import_response.json()['data']
    assert import_data['updated'] == 1
    assert import_data['imported'] == 1
    assert import_data['skipped'] == 0

    filtered_list_response = client.get('/api/v1/attendance/records?date_from=2026-03-01&date_to=2026-03-02', headers=headers)
    assert filtered_list_response.status_code == 200
    assert filtered_list_response.json()['data']['total'] == 2


def test_attendance_excel_import(client: TestClient):
    openpyxl = __import__('openpyxl')

    headers = auth_headers(client)
    create_employee_response = client.post(
        '/api/v1/employees/',
        headers=headers,
        json={
            'employee_code': 'ATT-EXCEL-001',
            'profile_name': 'Excel Employee',
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

    from io import BytesIO

    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.append(['employee_code', 'date', 'am_in', 'am_out', 'pm_in', 'pm_out', 'note'])
    sheet.append(['ATT-EXCEL-001', '2026-03-03', '09:00', '12:00', '13:00', '18:00', 'excel import'])
    stream = BytesIO()
    workbook.save(stream)
    stream.seek(0)

    import_response = client.post(
        '/api/v1/attendance/records/import',
        headers=headers,
        files={
            'file': ('attendance.xlsx', stream.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        },
    )
    assert import_response.status_code == 200
    assert import_response.json()['data']['imported'] == 1
