import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BriefcaseBusiness, CalendarClock, Plus, Send, Video } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const formatDate = (value) => {
  if (!value) return 'Date not set';
  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? 'Date not set' : new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const initialStats = {
  totals: { totalApplications: 0, submittedThisMonth: 0, interviews: 0, offers: 0, rejected: 0, upcomingFollowUps: 0 },
  recentApplications: [],
  upcomingFollowups: [],
  statusDistribution: [],
  monthlyActivity: [],
};

function CountUp({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || target === 0) {
      setCount(target);
      return undefined;
    }

    let frameId;
    const startTime = performance.now();
    const duration = 650;
    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <>{count}</>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats({ ...initialStats, ...data.data, totals: { ...initialStats.totals, ...data.data?.totals } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="page-panel dashboard-load-error" role="alert">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button type="button" className="primary-btn" onClick={loadDashboard}>Try again</button>
        </section>
      </div>
    );
  }

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const hasApplications = stats.totals.totalApplications > 0;

  return (
    <div className="page-shell">
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Your job search</p>
          <h2>{firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}</h2>
          <p className="dashboard-context">Your applications, progress, and next steps at a glance.</p>
        </div>
        <Link className="primary-btn dashboard-action" to="/applications">
          <Plus size={17} aria-hidden="true" />
          Add application
        </Link>
      </header>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label"><BriefcaseBusiness size={16} aria-hidden="true" /><span>Total applications</span></div>
          <strong><CountUp value={stats.totals.totalApplications} /></strong>
        </div>
        <div className="stat-card success">
          <div className="stat-label"><Send size={16} aria-hidden="true" /><span>Submitted this month</span></div>
          <strong><CountUp value={stats.totals.submittedThisMonth} /></strong>
        </div>
        <div className="stat-card warning">
          <div className="stat-label"><Video size={16} aria-hidden="true" /><span>Interviews</span></div>
          <strong><CountUp value={stats.totals.interviews} /></strong>
        </div>
        <div className="stat-card neutral">
          <div className="stat-label"><CalendarClock size={16} aria-hidden="true" /><span>Upcoming follow-ups</span></div>
          <strong><CountUp value={stats.totals.upcomingFollowUps} /></strong>
        </div>
      </div>

      <div className="content-grid two-columns">
        <section className="page-panel">
          <div className="panel-heading">
            <div>
              <h3>Monthly activity</h3>
              <p>Applications added this year</p>
            </div>
          </div>
          {hasApplications ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyActivity} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid, #e8edf4)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label, #69758b)', fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label, #69758b)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(53, 99, 217, 0.06)' }}
                    contentStyle={{ border: `1px solid ${theme === 'dark' ? '#3a4b5b' : '#e3e8f0'}`, borderRadius: 8, background: theme === 'dark' ? '#1b2835' : '#fff', color: theme === 'dark' ? '#e2e9f0' : '#172536', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}
                  />
                  <Bar dataKey="count" name="Applications" fill="#456bc3" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-empty">
              <p>Your activity will appear here once you add an application.</p>
              <Link to="/applications">Add your first application</Link>
            </div>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-heading">
            <div>
              <h3>Application status</h3>
              <p>Where things stand right now</p>
            </div>
          </div>
          {hasApplications ? (
            <div className="status-list">
              {stats.statusDistribution.map((item) => (
                <div key={item.name} className="status-row">
                  <span>{item.name}</span>
                  <div className="status-row-value">
                    <div className="status-track" aria-hidden="true">
                      <span style={{ width: `${Math.min((item.value / stats.totals.totalApplications) * 100, 100)}%` }} />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Status breakdown will appear after you save your first application.</p>
          )}
        </section>
      </div>

      <div className="content-grid two-columns">
        <section className="page-panel">
          <div className="panel-heading">
            <div><h3>Recent applications</h3><p>Your latest activity</p></div>
            <Link className="panel-link" to="/applications">View all</Link>
          </div>
          {stats.recentApplications.length === 0 ? (
            <div className="dashboard-empty">
              <p>No applications yet. Add a role to start keeping track.</p>
              <Link to="/applications">Go to applications</Link>
            </div>
          ) : (
            <div className="recent-list">
              {stats.recentApplications.map((item) => (
                <div key={item._id} className="recent-item">
                  <div>
                    <strong>{item.companyName}</strong>
                    <p>{item.jobTitle} <span className="recent-date">· {formatDate(item.applicationDate)}</span></p>
                  </div>
                  <span className={`status-pill status-${item.currentStatus?.toLowerCase()}`}>{item.currentStatus}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-heading">
            <div><h3>Upcoming follow-ups</h3><p>Next reminders, by date</p></div>
            <Link className="panel-link" to="/applications">View all</Link>
          </div>
          {stats.upcomingFollowups.length === 0 ? (
            <div className="dashboard-empty">
              <p>No follow-ups due. Add a reminder to an application when you need one.</p>
              <Link to="/applications">Review applications</Link>
            </div>
          ) : (
            <div className="recent-list">
              {stats.upcomingFollowups.map((item) => (
                <div key={item._id} className="recent-item">
                  <div>
                    <strong>{item.companyName}</strong>
                    <p>{item.jobTitle}</p>
                  </div>
                  <time dateTime={String(item.followUpDate).slice(0, 10)}>{formatDate(item.followUpDate)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
