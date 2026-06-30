from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)


def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler returns a citizen-friendly error instead of
    slowapi's default response, and includes a Retry-After header.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Too many requests. Please wait a moment before trying again. "
                "If you continue to see this message, contact IESCO support."
            )
        },
        headers={"Retry-After": "60"},
    )
