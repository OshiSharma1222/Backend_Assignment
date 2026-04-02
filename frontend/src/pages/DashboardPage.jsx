import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({
    value: '',
    playedOn: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await api.dashboard.getStats();
      setData(result.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddScore = async (e) => {
    e.preventDefault();
    setError('');

    const scoreValue = Number(formData.value);
    if (!scoreValue || scoreValue < 1 || scoreValue > 45) {
      setError('Please enter a score between 1 and 45');
      return;
    }

    setSavingScore(true);

    try {
      await api.scores.add({
        value: scoreValue,
        playedOn: formData.playedOn,
      });
      setFormData({
        value: '',
        playedOn: new Date().toISOString().slice(0, 10),
      });
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add score');
    } finally {
      setSavingScore(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, paddingBottom: '20px' }}>
          <div className="shell">
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <h1>Dashboard</h1>
          {error && <p className="error">{error}</p>}

          <section className="section-grid two">
            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Subscription</h2>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px 0' }}>Status: <strong>{data?.subscription?.status || 'inactive'}</strong></p>
                <p style={{ margin: '0' }}>Renewal: {data?.subscription?.renews_at ? new Date(data.subscription.renews_at).toDateString() : 'Not subscribed'}</p>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="inline-form stack">
                <div>
                  <label>Plan Type</label>
                  <select defaultValue="monthly">
                    <option value="monthly">Monthly - $49</option>
                    <option value="yearly">Yearly - $490</option>
                  </select>
                </div>
                <div>
                  <label>Charity %</label>
                  <input type="number" min="10" max="100" defaultValue="10" />
                </div>
                <button className="btn">Subscribe / Renew</button>
              </form>
            </article>

            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Participation</h2>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px 0' }}>Published draws: <strong>{data?.drawCount || 0}</strong></p>
                <p style={{ margin: '0' }}>Total won: <strong>${data?.totalWon?.toFixed(2) || '0.00'}</strong></p>
              </div>
              <a href="/winner-proof" className="ghost" style={{ display: 'block' }}>Upload winner proof</a>
            </article>
          </section>

          <section className="section-grid two">
            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Latest 5 Scores</h2>
              <form onSubmit={handleAddScore} className="inline-form stack">
                <div>
                  <label>Score</label>
                  <input
                    type="number"
                    name="value"
                    min="1"
                    max="45"
                    placeholder="Stableford score"
                    value={formData.value}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label>Played On</label>
                  <input
                    type="date"
                    name="playedOn"
                    value={formData.playedOn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button className="btn" disabled={savingScore}>
                  {savingScore ? 'Saving...' : 'Add Score'}
                </button>
              </form>
              <ul className="list" style={{ marginTop: '16px' }}>
                {(data?.scores || []).map((score) => (
                  <li key={score.id || `${score.value}-${score.played_on}`}>
                    <span>{score.value} pts</span>
                    <span>{new Date(score.played_on).toDateString()}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Winnings Overview</h2>
              <ul className="list">
                {data?.winnings?.map((w, i) => (
                  <li key={i}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block' }}>{w.match_type} - {w.draws?.month_key}</span>
                      <span style={{ display: 'block', fontSize: '14px', color: 'var(--muted)' }}>${Number(w.payout_amount).toFixed(2)} • {w.payout_status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

