import { useEffect, useState } from 'react';
import { getToken, clearToken } from '../auth';
import { getMe, listPosts, createPost } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC'); // NEW
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) return navigate('/login');
    getMe(token)
      .then(me => setEmail(me.email))
      .then(() => listPosts(token).then(setPosts))
      .catch(() => {
        clearToken();
        navigate('/login');
      });
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
      await createPost(token, { title: title.trim(), body: body.trim(), visibility }); // send visibility
      setTitle(''); setBody(''); setVisibility('PUBLIC');
      const all = await listPosts(token);
      setPosts(all);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const badge = (vis) => (
    <span style={{
      fontSize: 12, padding: '2px 8px', borderRadius: 12,
      border: '1px solid #ccc', marginLeft: 8
    }}>
      {vis === 'PRIVATE' ? 'Private' : 'Public'}
    </span>
  );

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
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
        {/* NEW: visibility selector */}
        <label style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span>Visibility:</span>
          <select value={visibility} onChange={e=>setVisibility(e.target.value)}>
            <option value="PUBLIC">Public (anyone can see)</option>
            <option value="PRIVATE">Private (only me)</option>
          </select>
        </label>

        <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Post'}</button>
      </form>
      {err && <p style={{ color:'red' }}>{err}</p>}

      <h3>Feed (Public + your Private)</h3>
      {!posts.length && <p>No posts yet.</p>}
      <ul style={{ listStyle:'none', padding:0, display:'grid', gap:12 }}>
        {posts.map(p => (
          <li key={p.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <strong>{p.title}</strong>{badge(p.visibility)}
              </div>
              <small>{new Date(p.created_at).toLocaleString()}</small>
            </div>
            <p style={{ margin:'6px 0 8px' }}>{p.body}</p>
            <small>by {p.author}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
