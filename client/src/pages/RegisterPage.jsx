import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const initialForm = {
  name: '',
  email: '',
  password: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
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
      await register(form);
      navigate('/login', {
        replace: true,
        state: { registered: true, email: form.email.trim() },
      });
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
            <span className="auth-kicker">A calmer way to keep track</span>
            <h1>Make room for your next move.</h1>
            <p>Bring your applications, conversations, and follow-ups together in one simple place.</p>
          </div>
          <img src="/career-journey.svg" alt="Career opportunities organized in a colorful dashboard" />
          <div className="auth-visual-note">
            <span className="auth-note-dot" />
            Start with one opportunity at a time.
          </div>
        </section>

        <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-badge">CT</div>
          <div>
            <p className="eyebrow">Start tracking</p>
            <h2>Create your account</h2>
          </div>
        </div>

        <p className="auth-subtitle">Create an account to keep your applications and next steps organized.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
