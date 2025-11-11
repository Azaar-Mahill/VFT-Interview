import { useEffect, useState } from 'react';
import { getToken, clearToken } from '../auth';
import {
  getMe,
  listPosts,
  createPost,
  updatePost,
  deletePost,
  listComments,
  addComment,
  updateComment,
  deleteComment
} from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [posts, setPosts] = useState([]);

  // create-post form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // post edit state
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editVisibility, setEditVisibility] = useState('PUBLIC');

  // comments state: map postId -> { items: Comment[] | null, input: string }
  const [comments, setComments] = useState({});
  // comment edit state
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');

  const navigate = useNavigate();
  const token = getToken();

  async function refresh() {
    const all = await listPosts(token);
    setPosts(all);
    const initial = {};
    for (const p of all) initial[p.id] = comments[p.id] || { items: null, input: '' };
    setComments(initial);
  }

  async function refreshComments(postId) {
    const items = await listComments(token, postId);
    setComments(prev => ({ ...prev, [postId]: { ...(prev[postId] || {}), items, input: '' } }));
  }

  useEffect(() => {
    if (!token) return navigate('/login');
    getMe(token)
      .then(me => setEmail(me.email))
      .then(refresh)
      .catch(() => {
        clearToken();
        navigate('/login');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  // ---------- Create post ----------
  const onCreatePost = async (e) => {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !body.trim()) {
      setErr('Title and description are required');
      return;
    }
    try {
      setBusy(true);
      await createPost(token, { title: title.trim(), body: body.trim(), visibility });
      setTitle(''); setBody(''); setVisibility('PUBLIC');
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Post edit/delete/visibility ----------
  const startEditPost = (p) => {
    setEditId(p.id);
    setEditTitle(p.title);
    setEditBody(p.body);
    setEditVisibility(p.visibility);
    setErr('');
  };

  const cancelEditPost = () => {
    setEditId(null);
    setEditTitle('');
    setEditBody('');
    setEditVisibility('PUBLIC');
  };

  const saveEditPost = async (id) => {
    if (!editTitle.trim() || !editBody.trim()) {
      setErr('Title and description are required');
      return;
    }
    try {
      setBusy(true);
      await updatePost(token, id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        visibility: editVisibility
      });
      cancelEditPost();
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      setBusy(true);
      await deletePost(token, id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const makePostVisibility = async (id, vis) => {
    try {
      setBusy(true);
      await updatePost(token, id, { visibility: vis });
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Comments load/add/edit/delete ----------
  const loadComments = async (postId) => {
    try {
      await refreshComments(postId);
    } catch (e) {
      setErr(e.message);
    }
  };

  const submitComment = async (postId) => {
    try {
      const input = (comments[postId]?.input || '').trim();
      if (!input) return;
      setBusy(true);
      await addComment(token, postId, input);
      await refreshComments(postId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const startEditComment = (c) => {
    setEditCommentId(c.id);
    setEditCommentBody(c.body);
  };

  const cancelEditComment = () => {
    setEditCommentId(null);
    setEditCommentBody('');
  };

  const saveEditComment = async (postId, commentId) => {
    if (!editCommentBody.trim()) return;
    try {
      setBusy(true);
      await updateComment(token, commentId, editCommentBody.trim());
      cancelEditComment();
      await refreshComments(postId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      setBusy(true);
      await deleteComment(token, commentId);
      await refreshComments(postId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const badge = (vis) => (
    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, border: '1px solid #ccc', marginLeft: 8 }}>
      {vis === 'PRIVATE' ? 'Private' : 'Public'}
    </span>
  );

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Dashboard — You have logged in ✅</h2>
        <div>
          {email && <span style={{ marginRight: 12 }}>Signed in as <b>{email}</b></span>}
          <button onClick={() => { clearToken(); navigate('/login'); }}>Log out</button>
        </div>
      </div>

      <hr/>

      <h3>Create a post</h3>
      <form onSubmit={onCreatePost} style={{ display:'grid', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          maxLength={200}
          required
        />
        <textarea
          placeholder="Description"
          value={body}
          onChange={e=>setBody(e.target.value)}
          rows={4}
          required
        />
        <label style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span>Visibility:</span>
          <select value={visibility} onChange={e=>setVisibility(e.target.value)}>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Post'}</button>
      </form>
      {err && <p style={{ color:'red' }}>{err}</p>}

      <h3>Feed (Public + your Private)</h3>
      {!posts.length && <p>No posts yet.</p>}

      <ul style={{ listStyle:'none', padding:0, display:'grid', gap:12 }}>
        {posts.map(p => {
          const minePost = p.author === email; // am I the post owner?
          const cstate = comments[p.id] || { items: null, input: '' };
          const isEditingPost = editId === p.id;

          return (
            <li key={p.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
              {/* Post header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  {!isEditingPost ? (
                    <>
                      <strong>{p.title}</strong>{badge(p.visibility)}
                    </>
                  ) : (
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      maxLength={200}
                      style={{ fontWeight: 600 }}
                    />
                  )}
                </div>
                <small>{new Date(p.created_at).toLocaleString()}</small>
              </div>

              {/* Post body or edit textarea */}
              {!isEditingPost ? (
                <p style={{ margin:'6px 0 8px' }}>{p.body}</p>
              ) : (
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={4}
                  style={{ margin:'6px 0 8px', width:'100%' }}
                />
              )}

              <small>by {p.author}</small>

              {/* Post controls (author only) */}
              {minePost && (
                <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
                  {!isEditingPost ? (
                    <>
                      <button onClick={() => startEditPost(p)}>Edit</button>
                      <button onClick={() => removePost(p.id)}>Delete</button>
                      {p.visibility === 'PUBLIC' ? (
                        <button onClick={() => makePostVisibility(p.id, 'PRIVATE')}>Make Private</button>
                      ) : (
                        <button onClick={() => makePostVisibility(p.id, 'PUBLIC')}>Make Public</button>
                      )}
                    </>
                  ) : (
                    <>
                      <label style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span>Visibility:</span>
                        <select value={editVisibility} onChange={e=>setEditVisibility(e.target.value)}>
                          <option value="PUBLIC">Public</option>
                          <option value="PRIVATE">Private</option>
                        </select>
                      </label>
                      <button onClick={() => saveEditPost(p.id)} disabled={busy}>Save</button>
                      <button onClick={cancelEditPost} type="button">Cancel</button>
                    </>
                  )}
                </div>
              )}

              {/* Comments */}
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    if (cstate.items == null) loadComments(p.id);
                  }}
                >
                  {cstate.items == null ? 'Show comments' : `Comments (${cstate.items.length})`}
                </button>
              </div>

              {cstate.items != null && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  {!cstate.items.length && <p style={{ margin: 0 }}>No comments yet. Be the first!</p>}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {cstate.items.map(c => {
                      const mineComment = c.author === email;     // I'm the comment author
                      const isEditingComment = editCommentId === c.id;

                      return (
                        <li key={c.id} style={{ borderTop: '1px solid #eee', paddingTop: 6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <small><b>{c.author}</b></small>
                            <small>{new Date(c.created_at).toLocaleString()}</small>
                          </div>

                          {!isEditingComment ? (
                            <div style={{ marginTop: 4 }}>{c.body}</div>
                          ) : (
                            <div style={{ display:'flex', gap:8, marginTop:6 }}>
                              <input
                                value={editCommentBody}
                                onChange={e => setEditCommentBody(e.target.value)}
                                style={{ flex: 1 }}
                              />
                              <button
                                onClick={() => saveEditComment(p.id, c.id)}
                                disabled={busy}
                              >
                                Save
                              </button>
                              <button onClick={cancelEditComment} type="button">Cancel</button>
                            </div>
                          )}

                          {/* Comment controls:
                              - Edit: only when I'm the comment author
                              - Delete: allowed for comment author OR post owner */}
                          <div style={{ display:'flex', gap:8, marginTop:6 }}>
                            {mineComment && !isEditingComment && (
                              <button onClick={() => startEditComment(c)}>Edit</button>
                            )}
                            {(mineComment || minePost) && !isEditingComment && (
                              <button onClick={() => removeComment(p.id, c.id)}>Delete</button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Add comment */}
                  <div style={{ display:'flex', gap: 8, marginTop: 8 }}>
                    <input
                      placeholder="Write a comment…"
                      value={cstate.input}
                      onChange={e => setComments(prev => ({
                        ...prev,
                        [p.id]: { ...cstate, input: e.target.value }
                      }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitComment(p.id);
                        }
                      }}
                    />
                    <button onClick={() => submitComment(p.id)} disabled={busy}>Comment</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
