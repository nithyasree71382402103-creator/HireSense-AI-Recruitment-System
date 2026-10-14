from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str  # "candidate" or "recruiter"
    company_name: Optional[str] = None  # required if recruiter
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: str
    company_name: Optional[str] = None
    profile_id: Optional[int] = None

    class Config:
        from_attributes = True
