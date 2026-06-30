import pytest


def test_payment_callback_amount_mismatch_rejected(client):
    bill_response = client.get("/bills/12345678901234")
    if bill_response.status_code != 200:
        pytest.skip("Test bill 12345678901234 not seeded")
    bill = bill_response.json()
    if bill.get("payment_status") == "paid":
        pytest.skip("Test bill already paid -- idempotency check fires before amount check")

    response = client.post("/bills/payment-callback", json={
        "reference_number": "12345678901234",
        "payment_method": "jazzcash",
        "transaction_ref": "TEST_MISMATCH_001",
        "amount_paid": 1.00,
    })
    assert response.status_code == 422


def test_duplicate_payment_rejected(client):
    bill_response = client.get("/bills/98765432109876")
    if bill_response.status_code != 200:
        pytest.skip("Test bill 98765432109876 not seeded")

    bill = bill_response.json()
    if bill["payment_status"] != "paid":
        pytest.skip("Test bill is not in paid state -- run after a successful payment test")

    response = client.post("/bills/payment-callback", json={
        "reference_number": "98765432109876",
        "payment_method": "jazzcash",
        "transaction_ref": "TEST_DUPLICATE_002",
        "amount_paid": float(bill["total_payable"]),
    })
    assert response.status_code == 409


def test_invalid_reference_number_format(client):
    response = client.get("/bills/1234")
    assert response.status_code == 422

    response = client.get("/bills/1234567890ABCD")
    assert response.status_code == 422


def test_jazzcash_invalid_mobile_rejected(client):
    response = client.post("/payments/jazzcash/initiate", json={
        "reference_number": "12345678901234",
        "mobile_number": "01234567890",
        "amount": 1000.00,
    })
    assert response.status_code == 422