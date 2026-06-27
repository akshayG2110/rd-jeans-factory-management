import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored hashed password.
    Supports transparently verifying plain-text passwords as a fallback
    for existing development database records.
    """
    # If the stored password starts with a standard bcrypt prefix, use bcrypt checkpw
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False
            
    # Fallback to plain text comparison
    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt hash of a plain text password.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")
