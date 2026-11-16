from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.app.models.club import Club
    from backend.app.models.user import User

from datetime import datetime, timezone

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.session import Base




class ClubMembership(Base):

    __tablename__ = "club_memberships"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "club_id",
            name="unique_user_club_membership"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="member",
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user: Mapped["User"] = relationship(
    back_populates="club_memberships"
)

    club: Mapped["Club"] = relationship(
    back_populates="memberships"
)



    


# TYPE_CHECKING
# It is True when static type checkers analyze your code.
# It is False during normal Python execution.
# Therefore, the import won't execute at runtime.
# This avoids circular imports while helping VS Code understand the types.
#You don't need to import another model class just to define a relationship.