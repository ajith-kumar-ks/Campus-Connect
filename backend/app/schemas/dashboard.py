from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DashboardEventSummary(BaseModel):
    id:int
    title:str
    venue:str
    start_time:datetime
    end_time:datetime
    model_config = ConfigDict(from_attributes=True)


class RecentRegistrationActivity(BaseModel):
    id:int
    status:str
    registered_at:datetime
    cancelled_at:datetime|None
    event:DashboardEventSummary
    model_config = ConfigDict(from_attributes=True)



class StudentDashboardResponse(BaseModel):
    total_joined_clubs:int
    total_active_registrations:int
    upcoming_events : list[DashboardEventSummary]
    recent_activity: list[RecentRegistrationActivity]


    

class OrganizerClubSummary(BaseModel):
    id: int
    name: str
    description: str | None = None
    total_events: int
    total_active_participants: int


class OrganizerEventSummary(BaseModel):
    id: int
    title: str
    venue: str
    start_time: datetime
    end_time: datetime
    club_id: int
    club_name: str
    total_registrations: int


class OrganizerDashboardResponse(BaseModel):
    total_managed_clubs: int
    total_events: int
    total_active_participants: int
    total_upcoming_events: int

    clubs: list[OrganizerClubSummary]
    upcoming_events: list[OrganizerEventSummary]



