const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('pp_admin_token');

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid server response');
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
};

export default api;