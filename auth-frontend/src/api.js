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

export async function createPost(token, { title, body, visibility = 'PUBLIC' }) {
  const res = await fetch(`${BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, body, visibility })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create post');
  return res.json();
}

export async function updatePost(token, id, { title, body, visibility }) {
  const res = await fetch(`${BASE}/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, body, visibility })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update post');
  return res.json();
}

export async function deletePost(token, id) {
  const res = await fetch(`${BASE}/api/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete post');
  return res.json();
}

export async function listComments(token, postId) {
  const res = await fetch(`${BASE}/api/posts/${postId}/comments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load comments');
  return res.json();
}

export async function addComment(token, postId, body) {
  const res = await fetch(`${BASE}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add comment');
  return res.json();
}

