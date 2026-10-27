import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  name: '',
  bio: '',
  location: '',
  portfolio: '',
  linkedin: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '', profile: {} });
  const [form, setForm] = useState(emptyForm);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        const profileData = data.data || {};
        setProfile(profileData);
        setForm({
          name: profileData.name || '',
          bio: profileData.profile?.bio || '',
          location: profileData.profile?.location || '',
          portfolio: profileData.profile?.portfolio || '',
          linkedin: profileData.profile?.linkedin || '',
        });
      } catch (err) {
        console.error('Profile load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data } = await api.put('/users/profile', {
        name: form.name,
        bio: form.bio,
        location: form.location,
        portfolio: form.portfolio,
        linkedin: form.linkedin,
      });

      setProfile((previous) => ({
        ...previous,
        ...data.data,
        profile: data.data.profile,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');

    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account and all saved applications. Continue?');
    if (!confirmed) return;

    try {
      await api.delete('/users/account');
      localStorage.removeItem('careertrack_token');
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete account.');
    }
  };

  if (loading) {
    return <div className="page-panel">Loading profile...</div>;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Account information</h2>
        </div>
      </header>

      <div className="content-grid two-columns">
        <section className="page-panel">
          <div className="profile-card">
            <div>
              <p className="muted-label">Name</p>
              <strong>{profile.name}</strong>
            </div>
            <div>
              <p className="muted-label">Email</p>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <p className="muted-label">Location</p>
              <strong>{profile.profile?.location || 'Not set'}</strong>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <h3>Update profile</h3>
          <form className="stacked-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} />
            </label>

            <label>
              Bio
              <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} />
            </label>

            <div className="two-col-inputs">
              <label>
                Location
                <input name="location" value={form.location} onChange={handleChange} />
              </label>
              <label>
                Portfolio
                <input name="portfolio" value={form.portfolio} onChange={handleChange} />
              </label>
            </div>

            <label>
              LinkedIn
              <input name="linkedin" value={form.linkedin} onChange={handleChange} />
            </label>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </section>
      </div>

      <div className="content-grid two-columns">
        <section className="page-panel">
          <h3>Change password</h3>
          <form className="stacked-form" onSubmit={handlePasswordSubmit}>
            <label>
              Current password
              <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
            </label>

            <label>
              New password
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} minLength={6} required />
            </label>

            {passwordError && <div className="error-box">{passwordError}</div>}

            <button type="submit" className="secondary-btn" disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="page-panel danger-panel">
          <h3>Danger zone</h3>
          <p>Delete your account and all associated job applications permanently.</p>
          <button type="button" className="danger-btn" onClick={handleDeleteAccount}>
            Delete account
          </button>
        </section>
      </div>
    </div>
  );
}
