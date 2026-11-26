import axios from 'axios';

export const TOKEN_KEY = 'cc_token';
export const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const http = axios.create({ baseURL: API_BASE, timeout: 20000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Every failed request becomes an ApiError.
 * The backend always answers with { success:false, message, status_code, errors }.
 * - 422 validation: errors = [{ field: 'body.title', message, type }]
 * - other HTTP errors: message is the HTTPException detail string
 */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, formErrors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }
}

const cleanMessage = (msg = '') => msg.replace(/^Value error,\s*/i, '');

function normalize(error) {
  if (error.response) {
    const { status, data } = error.response;
    const fieldErrors = {};
    const formErrors = [];

    if (Array.isArray(data?.errors)) {
      for (const item of data.errors) {
        const parts = String(item.field || '').split('.').filter((p) => p !== 'body' && p !== 'query');
        const key = parts[parts.length - 1];
        const msg = cleanMessage(item.message);
        if (key) fieldErrors[key] = msg;
        else formErrors.push(msg);
      }
    }

    const message =
      formErrors[0] ||
      (status === 422 && Object.values(fieldErrors)[0]) ||
      (data && typeof data === 'object' && data.message) ||
      `Request failed (${status})`;

    return new ApiError(message, { status, fieldErrors, formErrors });
  }

  if (error.request) {
    return new ApiError(
      `Can't reach the server at ${API_BASE}. Check that the FastAPI app is running.`,
      { status: 0 }
    );
  }
  return new ApiError(error.message || 'Unexpected error');
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiError = normalize(error);
    const isLogin = error.config?.url?.includes('/auth/login');
    if (apiError.status === 401 && !isLogin) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(apiError);
  }
);
