import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const result = await api.dashboard.getAdminStats();
      setData(result.data);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDraw = async (drawType) => {
    if (!window.confirm(`Publish ${drawType} draw?`)) return;
    try {
      await api.draws.publish({ drawType });
      setSuccess('Draw published!');
      fetchAdminData();
    } catch (err) {
      setError('Failed to publish draw');
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
              <p>Loading admin dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <h1>Admin Dashboard</h1>
          {error && <p className="error">{error}</p>}

          <section className="section-grid three">
            <article className="card">
              <h3>Total Users</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{data?.totalUsers || 0}</p>
            </article>
            <article className="card">
              <h3>Active Subscriptions</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{data?.activeSubscriptions || 0}</p>
            </article>
            <article className="card">
              <h3>Unpaid Winners</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{data?.unpaidWinners || 0}</p>
            </article>
          </section>

          <section className="card">
            <h2>Draw Management</h2>
            <div className="cta-row">
              <button
                onClick={() => handlePublishDraw('random')}
                className="btn"
              >
                Publish Random Draw
              </button>
              <button
                onClick={() => handlePublishDraw('algorithmic')}
                className="btn"
              >
                Publish Algorithmic Draw
              </button>
              <a href="/admin/simulate" className="ghost">Simulate Draw</a>
            </div>
          </section>

          <section className="card">
            <h2>Recent Winners</h2>
            <ul className="list">
              {data?.recentWinners?.map((w, i) => (
                <li key={i}>
                  <span>{w.users?.full_name} - {w.match_type}</span>
                  <span>${w.payout_amount} • {w.payout_status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
