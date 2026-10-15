import { useState } from 'react';
import './AuthScreen.css';

export default function AuthScreen({ error, submitting, onAuthenticate, onClearError }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isRegistering = mode === 'register';

  const submit = (event) => {
    event.preventDefault();
    onAuthenticate(mode, {
      ...(isRegistering ? { name: name.trim() } : {}),
      email: email.trim(),
      password,
    });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    onClearError();
  };

  return (
    <main className="auth-screen">
      <div className="auth-brand">
        <span className="brand-mark">t<span>f</span></span>
        <span>teamfinder</span>
      </div>
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="auth-symbol">✦</div>
        <span className="eyebrow">YOUR NEXT TEAM STARTS HERE</span>
        <h1 id="auth-heading">{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
        <p>{isRegistering
          ? 'Register with your details to start finding teammates.'
          : 'Log in with your registered email and password to continue.'}</p>

        <div className="auth-switch" role="group" aria-label="Choose login or registration">
          <button type="button" className={!isRegistering ? 'active' : ''} aria-pressed={!isRegistering} onClick={() => switchMode('login')}>Log in</button>
          <button type="button" className={isRegistering ? 'active' : ''} aria-pressed={isRegistering} onClick={() => switchMode('register')}>Register</button>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={submit}>
          {isRegistering && (
            <label>
              Full name
              <input autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
            </label>
          )}
          <label>
            Email address
            <input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@college.edu" />
          </label>
          <label>
            Password
            <input autoComplete={isRegistering ? 'new-password' : 'current-password'} type="password" required minLength={isRegistering ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegistering ? 'At least 8 characters' : 'Your password'} />
          </label>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Log in'} <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-security-note">Your password is verified securely by TeamFinder.</p>
      </section>
    </main>
  );
}
