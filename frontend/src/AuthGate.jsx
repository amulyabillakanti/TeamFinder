import { useEffect, useState } from 'react';
import AuthScreen from './AuthScreen.jsx';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5050').replace(/\/+$/, '');

function toDashboardUser(user) {
  const name = user.name || '';
  return {
    ...user,
    id: user.id || user._id,
    dept: user.department || '',
    goal: user.careerGoals || '',
    initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'TF',
    experience: 'Intermediate',
    color: user.color || 'violet',
    points: user.points || 0,
    skills: user.skills || [],
    interests: user.interests || [],
  };
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem('tf-token')));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('tf-token');

    if (!token) {
      localStorage.removeItem('tf-user');
      return () => {
        cancelled = true;
      };
    }

    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(response.status === 401
            ? 'Your session has expired. Please log in again.'
            : result.message || 'Unable to verify your login.');
        }
        return result;
      })
      .then((result) => {
        if (!result.user) throw new Error('The server returned an invalid account response.');
        if (cancelled) return;
        const authenticatedUser = toDashboardUser(result.user);
        localStorage.setItem('tf-user', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
      })
      .catch((requestError) => {
        if (cancelled) return;
        localStorage.removeItem('tf-token');
        localStorage.removeItem('tf-user');
        setError(requestError.message || 'Unable to verify your login. Please log in again.');
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = async (mode, credentials) => {
    setSubmitting(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? 'register' : 'login';
      const response = await fetch(`${API_URL}/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || (mode === 'register' ? 'Registration failed.' : 'Login failed.'));
      }
      if (!result.token || !result.user) {
        throw new Error('The server returned an invalid authentication response.');
      }

      const authenticatedUser = toDashboardUser(result.user);
      localStorage.setItem('tf-token', result.token);
      localStorage.setItem('tf-user', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('tf-token');
    localStorage.removeItem('tf-user');
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="auth-screen" role="status">
        <div className="auth-card">
          <div className="auth-symbol">⌕</div>
          <h1>Checking your session</h1>
          <p>Please wait while we verify your login.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen error={error} submitting={submitting} onAuthenticate={authenticate} onClearError={() => setError('')} />;
  }

  return typeof children === 'function' ? children(user, logout) : children;
}
