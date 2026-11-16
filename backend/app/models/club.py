from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.app.models.club_membership import ClubMembership
    
from datetime import datetime, timezone

from sqlalchemy import String, Text, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.session import Base



class Club(Base):
    __tablename__ = 'clubs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active : Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),nullable=False)
    memberships: Mapped[list["ClubMembership"]] = relationship(
        back_populates="club"
    )
