import { getToken } from './auth';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}
