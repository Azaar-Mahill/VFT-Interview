import { useEffect, useState } from 'react';
import { getToken, clearToken } from '../auth';
import { getMe } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return navigate('/login');
    getMe(token)
      .then(me => setEmail(me.email))
      .catch(() => {
        clearToken();
        navigate('/login');
      });
  }, [navigate]);

  return (
    <div style={{ maxWidth: 480, margin: '60px auto' }}>
      <h2>You have logged in ✅</h2>
      {email && <p>Welcome, <b>{email}</b>.</p>}
      <button onClick={() => { clearToken(); navigate('/login'); }}>
        Log out
      </button>
    </div>
  );
}
