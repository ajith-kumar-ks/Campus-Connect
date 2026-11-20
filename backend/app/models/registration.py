from typing import TYPE_CHECKING

from backend.app.db.session import Base
from datetime import datetime

from sqlalchemy import (
    Integer,String,DateTime,ForeignKey,UniqueConstraint,CheckConstraint,Index,func
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from backend.app.models.event import Event
    from backend.app.models.user import User


class Registration(Base):

    __tablename__ = 'registrations'
    __table_args__ = (
        UniqueConstraint(
            'event_id',
            'user_id',
            name='uq_registration_event_user'
        ),
        CheckConstraint(
            "status IN ('registered', 'cancelled')"
        ),
        Index(
            'ix_registrations_event_status',
            'event_id',
            'status'
        )
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey('events.id'), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default='registered',
        server_default='registered',
        nullable=False
    )
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships

    event: Mapped["Event"] = relationship(
        back_populates="registrations"
    )

    user: Mapped["User"] = relationship(
        back_populates="registrations"
    )

