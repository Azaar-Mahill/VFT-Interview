const BASE = 'http://localhost:4000';

export async function signup(email, password) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Signup failed');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
}

/*export async function getMe(token) {
  const res = await fetch(`${BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Not authorized');
  return res.json();
}*/


////////////////////////////////////////////////



const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export async function getMe(token) {
  const res = await fetch(`${BASE}/api/me`, { headers: authHeader(token) });
  if (!res.ok) throw new Error('Not authorized');
  return res.json();
}

// NEW: posts
export async function listPosts(token) {
  const res = await fetch(`${BASE}/api/posts`, { headers: { ...authHeader(token) } });
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export async function createPost(token, { title, body }) {
  const res = await fetch(`${BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ title, body })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create post');
  return res.json();
}

