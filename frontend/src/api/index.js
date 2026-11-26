import { http } from './client.js';

const unwrap = (promise) => promise.then((res) => res.data);

/* ---- Auth: /auth/login uses OAuth2PasswordRequestForm (form-encoded, field "username"). */
export const authApi = {
  login: (email, password) =>
    unwrap(
      http.post('/auth/login', new URLSearchParams({ username: email, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    ),
  register: (payload) => unwrap(http.post('/auth/register', payload)),
};

export const userApi = {
  me: () => unwrap(http.get('/users/me')),
  update: (payload) => unwrap(http.patch('/users/me', payload)),
  changePassword: (payload) => unwrap(http.post('/users/me/change-password', payload)),
  deactivate: () => unwrap(http.post('/users/me/deactivate')),
  clubs: (params) => unwrap(http.get('/users/me/clubs', { params })),
  registrations: (params) => unwrap(http.get('/users/me/registrations', { params })),
  dashboard: () => unwrap(http.get('/users/me/dashboard')),
};

/* NOTE: the list route is "/clubs/" (trailing slash). Calling "/clubs" makes FastAPI
   answer with a 307 redirect, which breaks the CORS preflight. */
export const clubApi = {
  list: () => unwrap(http.get('/clubs/')),
  get: (id) => unwrap(http.get(`/clubs/${id}`)),
  create: (payload) => unwrap(http.post('/clubs/', payload)),
  update: (id, payload) => unwrap(http.patch(`/clubs/${id}`, payload)),
  remove: (id) => unwrap(http.delete(`/clubs/${id}`)),
  join: (id) => unwrap(http.post(`/clubs/${id}/join`)),
  requests: (id) => unwrap(http.get(`/clubs/${id}/membership-requests`)),
  approve: (id, mid) => unwrap(http.patch(`/clubs/${id}/membership-requests/${mid}/approve`)),
  reject: (id, mid) => unwrap(http.patch(`/clubs/${id}/membership-requests/${mid}/reject`)),
  members: (id) => unwrap(http.get(`/clubs/${id}/members`)),
  removeMember: (id, mid) => unwrap(http.delete(`/clubs/${id}/members/${mid}`)),
  promote: (id, mid) => unwrap(http.patch(`/clubs/${id}/members/${mid}/promote`)),
  demote: (id, mid) => unwrap(http.patch(`/clubs/${id}/members/${mid}/demote`)),
};

export const eventApi = {
  list: (params) => unwrap(http.get('/events', { params })),
  get: (id) => unwrap(http.get(`/events/${id}`)),
  create: (clubId, payload) => unwrap(http.post(`/clubs/${clubId}/events`, payload)),
  update: (clubId, id, payload) => unwrap(http.patch(`/clubs/${clubId}/events/${id}`, payload)),
  setStatus: (clubId, id, status) =>
    unwrap(http.patch(`/clubs/${clubId}/events/${id}/status`, { status })),
  remove: (clubId, id) => unwrap(http.delete(`/clubs/${clubId}/events/${id}`)),

  register: (id) => unwrap(http.post(`/events/${id}/register`)),
  cancel: (id) => unwrap(http.delete(`/events/${id}/cancel`)),

  participants: (clubId, id, params) =>
    unwrap(http.get(`/clubs/${clubId}/events/${id}/participants`, { params })),

  /* The backend currently mounts the CSV export at /clubs/clubs/... (the router prefix is
     repeated in participant.py). Try the intended path first, then the current one, so this
     keeps working before AND after the backend is fixed. */
  exportParticipants: async (clubId, id) => {
    const paths = [
      `/clubs/${clubId}/events/${id}/participants/export`,
      `/clubs/clubs/${clubId}/events/${id}/participants/export`,
    ];
    let lastError;
    for (const path of paths) {
      try {
        const res = await http.get(path, { responseType: 'blob' });
        return res.data;
      } catch (err) {
        lastError = err;
        if (err.status !== 404) throw err;
      }
    }
    throw lastError;
  },
};

export const organizerApi = {
  dashboard: () => unwrap(http.get('/organizer/dashboard')),
};
