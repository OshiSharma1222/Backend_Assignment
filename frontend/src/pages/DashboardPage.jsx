import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');

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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    // Implementation will subscribe user
  };

  const handleAddScore = async (e) => {
    e.preventDefault();
    // Implementation will add score
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
              <form onSubmit={handleSubscribe} className="inline-form stack">
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
                  <input type="number" min="1" max="45" placeholder="Stableford score" required />
                </div>
                <div>
                  <label>Played On</label>
                  <input type="date" required />
                </div>
                <button className="btn">Add Score</button>
              </form>
              <ul className="list" style={{ marginTop: '16px' }}>
                {data?.scores?.map((score, i) => (
                  <li key={i}>
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
