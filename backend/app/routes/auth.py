from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, CandidateProfile, RecruiterProfile
from backend.app.schemas.auth import UserRegister, UserLogin, Token, UserOut
from backend.app.security.password import hash_password, verify_password
from backend.app.security.tokens import create_access_token
from backend.app.security.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    if user_in.role not in ["candidate", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'candidate' or 'recruiter'",
        )

    # Create User
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    profile_id = None
    company_name = None

    if user_in.role == "candidate":
        cand_prof = CandidateProfile(
            user_id=new_user.id,
            full_name=user_in.full_name,
            location=user_in.location or ""
        )
        db.add(cand_prof)
        db.flush()
        profile_id = cand_prof.id
    else:
        company_name = user_in.company_name or "Organization"
        rec_prof = RecruiterProfile(
            user_id=new_user.id,
            full_name=user_in.full_name,
            company_name=company_name,
            location=user_in.location or ""
        )
        db.add(rec_prof)
        db.flush()
        profile_id = rec_prof.id

    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "full_name": user_in.full_name,
            "company_name": company_name,
            "profile_id": profile_id,
        }
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )

    full_name = "User"
    company_name = None
    profile_id = None

    if user.role == "candidate" and user.candidate_profile:
        full_name = user.candidate_profile.full_name
        profile_id = user.candidate_profile.id
    elif user.role == "recruiter" and user.recruiter_profile:
        full_name = user.recruiter_profile.full_name
        company_name = user.recruiter_profile.company_name
        profile_id = user.recruiter_profile.id

    access_token = create_access_token(data={
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": full_name,
            "company_name": company_name,
            "profile_id": profile_id,
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    full_name = "User"
    company_name = None
    profile_id = None

    if current_user.role == "candidate" and current_user.candidate_profile:
        full_name = current_user.candidate_profile.full_name
        profile_id = current_user.candidate_profile.id
    elif current_user.role == "recruiter" and current_user.recruiter_profile:
        full_name = current_user.recruiter_profile.full_name
        company_name = current_user.recruiter_profile.company_name
        profile_id = current_user.recruiter_profile.id

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": full_name,
        "company_name": company_name,
        "profile_id": profile_id,
    }
