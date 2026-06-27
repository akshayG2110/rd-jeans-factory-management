from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, LoginSuccessResponse
from app.utils.security import verify_password, get_password_hash
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/login",
    response_model=LoginSuccessResponse,
    summary="Login user using username and password"
)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    # Find user by username
    user = db.query(User).filter(User.username == login_in.username).first()
    
    # Check if user exists and password matches
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid username or password"
            }
        )
    
    # Transparently upgrade plain text passwords to bcrypt hashes
    if not (user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$")):
        user.password_hash = get_password_hash(login_in.password)
        db.commit()
        db.refresh(user)

    # Generate JWT access token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "token": access_token
        }
    }
