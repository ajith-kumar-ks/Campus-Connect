import { Route, Routes } from 'react-router-dom';
import { ProtectedLayout, PublicOnly } from './components/Layout.jsx';
import ClubDetail from './pages/ClubDetail.jsx';
import Clubs from './pages/Clubs.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Events from './pages/Events.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import ManageClub from './pages/ManageClub.jsx';
import MyClubs from './pages/MyClubs.jsx';
import MyRegistrations from './pages/MyRegistrations.jsx';
import NotFound from './pages/NotFound.jsx';
import OrganizerHub from './pages/OrganizerHub.jsx';
import Participants from './pages/Participants.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:clubId" element={<ClubDetail />} />
        <Route path="/tickets" element={<MyRegistrations />} />
        <Route path="/my-clubs" element={<MyClubs />} />
        <Route path="/organizer" element={<OrganizerHub />} />
        <Route path="/manage/:clubId" element={<ManageClub />} />
        <Route path="/manage/:clubId/events/:eventId/participants" element={<Participants />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
