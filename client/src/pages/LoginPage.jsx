import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach CareerTrack. Check that the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <ThemeToggle />
      <div className="auth-layout">
        <section className="auth-visual">
          <div className="auth-visual-copy">
            <span className="auth-kicker">Your search, in one place</span>
            <h1>Keep every opportunity moving.</h1>
            <p>Track applications, remember the next step, and see how your search is progressing.</p>
          </div>
          <img src="/career-journey.svg" alt="Career opportunities organized in a colorful dashboard" />
          <div className="auth-visual-note">
            <span className="auth-note-dot" />
            A little more clarity for the road ahead.
          </div>
        </section>

        <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-badge">CT</div>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to CareerTrack</h2>
          </div>
        </div>

        <p className="auth-subtitle">Sign in to pick up where you left off.</p>

        {location.state?.registered && (
          <div className="success-box" role="status">
            Account created successfully. Sign in to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
