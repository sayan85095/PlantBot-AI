from auth import normalize_email


def test_normalize_email_lowercases_and_strips_whitespace():
    assert normalize_email('  User@Example.COM  ') == 'user@example.com'
