import pytest


def test_calculate_single_slab(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": 50,
        "consumer_type": "residential",
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["slab_breakdown"]) == 1
    assert data["units_consumed"] == 50
    assert data["total_payable"] > 0


def test_calculate_multi_slab(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": 350,
        "consumer_type": "residential",
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["slab_breakdown"]) >= 3
    total_in_slabs = sum(s["units_in_slab"] for s in data["slab_breakdown"])
    assert total_in_slabs == 350


def test_calculate_zero_units(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": 0,
        "consumer_type": "residential",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["energy_charges"] == 0


def test_calculate_negative_units_rejected(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": -10,
        "consumer_type": "residential",
    })
    assert response.status_code == 422


def test_calculate_invalid_consumer_type(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": 100,
        "consumer_type": "not_a_real_type",
    })
    assert response.status_code in (404, 422)


def test_gst_applied_correctly(client):
    response = client.get("/tariffs/calculate", params={
        "units_consumed": 100,
        "consumer_type": "residential",
    })
    data = response.json()
    expected_gst = round(data["subtotal"] * data["gst_rate"], 2)
    assert abs(data["gst_amount"] - expected_gst) < 0.01
    expected_total = round(data["subtotal"] + data["gst_amount"], 2)
    assert abs(data["total_payable"] - expected_total) < 0.01


def test_revision_marks_old_slabs_historical(client, admin_headers):
    before = client.get("/tariffs/current", params={"consumer_type": "commercial"})
    before_count = len(before.json().get("data", []))

    response = client.post("/tariffs/revision", json={
        "slabs": [{
            "consumer_type": "commercial",
            "units_from": 1,
            "units_to": None,
            "peak_rate": 38.00,
            "offpeak_rate": 31.00,
            "fixed_charge": 500.00,
            "effective_from": "2026-01-01",
        }]
    }, headers=admin_headers)
    assert response.status_code == 201

    history = client.get("/tariffs/history", params={"consumer_type": "commercial"})
    revisions = history.json()["revisions"]
    current_revisions = [r for r in revisions if r["is_current"]]
    assert len(current_revisions) == 1