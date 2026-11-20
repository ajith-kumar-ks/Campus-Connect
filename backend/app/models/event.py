from typing import TYPE_CHECKING

from backend.app.db.session import Base

from sqlalchemy import (String, Index, Text, DateTime, ForeignKey, CheckConstraint, Integer, func)

from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from backend.app.models.club import Club
    from backend.app.models.user import User
    from backend.app.models.registration import Registration


class Event(Base):
    __tablename__ = 'events'
    
    __table_args__ = (
        CheckConstraint(
        'end_time > start_time',
        name = 'ck_events_end_after_start'
        ),
        CheckConstraint(
            'capacity is NULL or capacity > 0',
            name = 'ck_events_capacity_POSITIVE'
        ),
        CheckConstraint(
            "status IN ('draft', 'published', 'completed', 'cancelled')",
            name = 'ck_events_status_valid'
        ),
        Index(
            "ix_events_club_status_start",
            "club_id",
            "status",
            "start_time"
        )
        #index => improving query performance.
    )
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    venue: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    start_time: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    end_time: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    registration_deadline: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    capacity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        server_default="draft",
        nullable=False
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships

    club: Mapped["Club"] = relationship(
        back_populates="events"
    )

    creator: Mapped["User"] = relationship(
        back_populates="created_events"
    )
    registrations: Mapped[list["Registration"]] = relationship(
    back_populates="event"
)
    



