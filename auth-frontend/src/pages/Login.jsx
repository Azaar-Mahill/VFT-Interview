import { useState } from 'react';
import { login } from '../api';
import { saveToken } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { token } = await login(email, password);
      saveToken(token);
      navigate('/dashboard'); // ← goes to “you have logged in” page
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h2>Log In</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/>
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/>
        </div>
        
        <button type="submit">Log In</button>
      </form>
      {err && <p style={{color:'red'}}>{err}</p>}
      <p>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}
