import { useState } from 'react';
import { signup } from '../api';
import { saveToken } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { token } = await signup(email, password);
      saveToken(token);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h2>Create Account</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/>
        <label>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/>
        <button type="submit">Sign Up</button>
      </form>
      {err && <p style={{color:'red'}}>{err}</p>}
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
