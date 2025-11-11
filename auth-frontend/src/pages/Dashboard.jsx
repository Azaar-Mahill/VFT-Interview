import { useEffect, useState } from 'react';
import { getToken, clearToken } from '../auth';
import { getMe, listPosts, createPost, updatePost, deletePost, listComments, addComment } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // edit state (existing from your previous step)
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editVisibility, setEditVisibility] = useState('PUBLIC');

  // comments state: map postId -> {items: [], input: ''}
  const [comments, setComments] = useState({});

  const navigate = useNavigate();
  const token = getToken();

  async function refresh() {
    const all = await listPosts(token);
    setPosts(all);

    // Prime comment containers without fetching all at once (lazy load on expand)
    const initial = {};
    for (const p of all) initial[p.id] = comments[p.id] || { items: null, input: '' };
    setComments(initial);
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

  // existing edit/delete functions omitted for brevity … (keep from your last step)

  const loadComments = async (postId) => {
    try {
      const items = await listComments(token, postId);
      setComments(prev => ({ ...prev, [postId]: { ...(prev[postId] || {}), items } }));
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
      // refresh that post’s comments
      const items = await listComments(token, postId);
      setComments(prev => ({ ...prev, [postId]: { items, input: '' } }));
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
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} required />
        <textarea placeholder="Description" value={body} onChange={e=>setBody(e.target.value)} rows={4} required />
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
          const mine = p.author === email;
          const cstate = comments[p.id] || { items: null, input: '' };
          return (
            <li key={p.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <strong>{p.title}</strong>{badge(p.visibility)}
                </div>
                <small>{new Date(p.created_at).toLocaleString()}</small>
              </div>
              <p style={{ margin:'6px 0 8px' }}>{p.body}</p>
              <small>by {p.author}</small>

              {/* (keep your Edit/Delete/Visibility buttons for mine) */}

              <div style={{ marginTop: 12 }}>
                {/* Comments header / loader */}
                <button
                  onClick={() => {
                    if (cstate.items == null) loadComments(p.id); // lazy load on first click
                    else setComments(prev => ({ ...prev, [p.id]: { ...cstate, items: cstate.items } })); // no-op
                  }}
                >
                  {cstate.items == null ? 'Show comments' : `Comments (${cstate.items.length})`}
                </button>
              </div>

              {cstate.items != null && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  {!cstate.items.length && <p style={{ margin: 0 }}>No comments yet. Be the first!</p>}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {cstate.items.map(c => (
                      <li key={c.id} style={{ borderTop: '1px solid #eee', paddingTop: 6 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <small><b>{c.author}</b></small>
                          <small>{new Date(c.created_at).toLocaleString()}</small>
                        </div>
                        <div>{c.body}</div>
                      </li>
                    ))}
                  </ul>

                  {/* Add comment form */}
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
