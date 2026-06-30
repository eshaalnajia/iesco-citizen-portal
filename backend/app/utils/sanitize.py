import bleach

# No HTML tags are allowed anywhere in citizen-supplied text fields.
# This portal has no legitimate use case for rich text input.
ALLOWED_TAGS = []
ALLOWED_ATTRS = {}


def sanitize_text(value: str | None) -> str | None:
    """
    Strips all HTML tags and dangerous characters from free-text input.
    Use on every citizen-supplied free-text field before storing it.
    """
    if value is None:
        return None
    cleaned = bleach.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,
    )
    return cleaned.strip()