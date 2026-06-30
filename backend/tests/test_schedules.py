import pytest
from datetime import date, timedelta


def test_create_schedule_requires_admin(client, sample_feeder_id):
    response = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": str(date.today() + timedelta(days=30)),
        "start_time": "08:00",
        "end_time": "10:00",
        "type": "scheduled",
    })
    assert response.status_code == 422   # missing Authorization header


def test_overlap_rejected(client, admin_headers, sample_feeder_id):
    test_date = str(date.today() + timedelta(days=31))

    first = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": test_date,
        "start_time": "08:00",
        "end_time": "10:00",
        "type": "scheduled",
    }, headers=admin_headers)
    assert first.status_code == 201

    overlapping = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": test_date,
        "start_time": "09:00",
        "end_time": "11:00",
        "type": "scheduled",
    }, headers=admin_headers)
    assert overlapping.status_code == 409

    client.delete(f"/schedules/{first.json()['id']}", headers=admin_headers)


def test_non_overlapping_schedules_succeed(client, admin_headers, sample_feeder_id):
    test_date = str(date.today() + timedelta(days=32))

    first = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": test_date,
        "start_time": "08:00",
        "end_time": "10:00",
        "type": "scheduled",
    }, headers=admin_headers)
    assert first.status_code == 201

    second = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": test_date,
        "start_time": "10:00",
        "end_time": "12:00",
        "type": "scheduled",
    }, headers=admin_headers)
    assert second.status_code == 201

    client.delete(f"/schedules/{first.json()['id']}", headers=admin_headers)
    client.delete(f"/schedules/{second.json()['id']}", headers=admin_headers)


def test_end_before_start_rejected(client, admin_headers, sample_feeder_id):
    response = client.post("/schedules/", json={
        "feeder_id": sample_feeder_id,
        "schedule_date": str(date.today() + timedelta(days=33)),
        "start_time": "14:00",
        "end_time": "10:00",
        "type": "scheduled",
    }, headers=admin_headers)
    assert response.status_code == 422