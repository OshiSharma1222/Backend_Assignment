import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

const emptyCharityForm = {
  name: '',
  shortDescription: '',
  longDescription: '',
  imageUrl: '',
  upcomingEvent: '',
  isFeatured: false,
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingDraw, setSavingDraw] = useState(false);
  const [savingCharity, setSavingCharity] = useState(false);
  const [reviewingProofId, setReviewingProofId] = useState('');
  const [markingPaidId, setMarkingPaidId] = useState('');
  const [deletingCharityId, setDeletingCharityId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [charities, setCharities] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [charityId, setCharityId] = useState('');
  const [charityForm, setCharityForm] = useState(emptyCharityForm);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setError('');
      const [dashboardResponse, adminStatsResponse, charitiesResponse, proofsResponse] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getAdminStats(),
        api.admin.getCharities(),
        api.admin.getProofs(),
      ]);

      setDashboardData(dashboardResponse.data);
      setAdminStats(adminStatsResponse.data);
      setCharities(charitiesResponse.data.charities || []);
      setProofs(proofsResponse.data.proofs || []);

      const firstCharity = (charitiesResponse.data.charities || [])[0];
      if (firstCharity && !charityId) {
        setCharityId(firstCharity.id);
        setCharityForm({
          name: firstCharity.name || '',
          shortDescription: firstCharity.short_description || '',
          longDescription: firstCharity.long_description || '',
          imageUrl: firstCharity.image_url || '',
          upcomingEvent: firstCharity.upcoming_event || '',
          isFeatured: Boolean(firstCharity.is_featured),
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDraw = async (drawType) => {
    if (!window.confirm(`Publish ${drawType} draw?`)) return;

    try {
      setSavingDraw(true);
      setError('');
      setSuccess('');
      await api.draws.publish({ drawType });
      setSuccess('Draw published successfully.');
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish draw');
    } finally {
      setSavingDraw(false);
    }
  };

  const handleCharitySelect = (e) => {
    const selectedId = e.target.value;
    setCharityId(selectedId);
    const selected = charities.find((charity) => charity.id === selectedId);

    if (!selected) {
      setCharityForm(emptyCharityForm);
      return;
    }

    setCharityForm({
      name: selected.name || '',
      shortDescription: selected.short_description || '',
      longDescription: selected.long_description || '',
      imageUrl: selected.image_url || '',
      upcomingEvent: selected.upcoming_event || '',
      isFeatured: Boolean(selected.is_featured),
    });
  };

  const handleCharityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCharityForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveCharity = async (e) => {
    e.preventDefault();
    if (!charityId) {
      setError('Select a charity to update');
      return;
    }

    try {
      setSavingCharity(true);
      setError('');
      setSuccess('');
      await api.admin.updateCharity(charityId, charityForm);
      setSuccess('Charity updated successfully.');
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update charity');
    } finally {
      setSavingCharity(false);
    }
  };

  const handleDeleteCharity = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This will remove it from the charity list.`)) return;

    try {
      setDeletingCharityId(id);
      setError('');
      setSuccess('');
      await api.admin.deleteCharity(id);
      setSuccess('Charity deleted successfully.');

      if (charityId === id) {
        setCharityId('');
        setCharityForm(emptyCharityForm);
      }

      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete charity');
    } finally {
      setDeletingCharityId('');
    }
  };

  const handleProofReview = async (proofId, status) => {
    try {
      setReviewingProofId(proofId);
      setError('');
      setSuccess('');
      await api.admin.reviewProof(proofId, status);
      setSuccess(`Proof ${status}.`);
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proof review');
    } finally {
      setReviewingProofId('');
    }
  };

  const handleMarkPaid = async (winnerId) => {
    try {
      setMarkingPaidId(winnerId);
      setError('');
      setSuccess('');
      await api.admin.markWinnerPaid(winnerId);
      setSuccess('Winner marked as paid.');
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark winner as paid');
    } finally {
      setMarkingPaidId('');
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
          {success && <p className="success">{success}</p>}

          <section className="section-grid two">
            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Admin Summary</h2>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px 0' }}>Total users: <strong>{adminStats?.totalUsers ?? 0}</strong></p>
                <p style={{ margin: '0 0 8px 0' }}>Active subscriptions: <strong>{adminStats?.activeSubscriptions ?? 0}</strong></p>
                <p style={{ margin: '0' }}>Unpaid winners: <strong>{adminStats?.unpaidWinners ?? 0}</strong></p>
              </div>
              <div className="card" style={{ padding: '16px', background: 'rgba(15,108,98,0.04)' }}>
                <p style={{ margin: 0 }}>This page gives admin control over platform data, charity records, and proof review.</p>
              </div>
            </article>

            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Participation</h2>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px 0' }}>Published draws: <strong>{dashboardData?.drawCount || 0}</strong></p>
                <p style={{ margin: '0' }}>Total won: <strong>${dashboardData?.totalWon?.toFixed(2) || '0.00'}</strong></p>
              </div>
              <div className="cta-row">
                <button className="btn" onClick={() => handlePublishDraw('random')} disabled={savingDraw}>
                  {savingDraw ? 'Publishing...' : 'Publish Random Draw'}
                </button>
                <button className="btn" onClick={() => handlePublishDraw('algorithmic')} disabled={savingDraw}>
                  {savingDraw ? 'Publishing...' : 'Publish Algorithmic Draw'}
                </button>
              </div>
            </article>
          </section>

          <section className="section-grid two">
            <article className="card">
              <h2 style={{ fontSize: '20px' }}>Latest 5 Scores</h2>
              <ul className="list" style={{ marginTop: '16px' }}>
                {(dashboardData?.scores || []).map((score) => (
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
                {(dashboardData?.winnings || []).map((w, i) => (
                  <li key={i}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block' }}>{w.match_type} - {w.draws?.month_key}</span>
                      <span style={{ display: 'block', fontSize: '14px', color: 'var(--muted)' }}>${Number(w.payout_amount).toFixed(2)} - {w.payout_status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="card">
            <h2>Charity Management</h2>
            <div className="section-grid two" style={{ marginTop: '16px' }}>
              <form onSubmit={handleSaveCharity} className="inline-form stack">
                <div>
                  <label>Select Charity</label>
                  <select value={charityId} onChange={handleCharitySelect}>
                    <option value="">Choose a charity</option>
                    {charities.map((charity) => (
                      <option key={charity.id} value={charity.id}>
                        {charity.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Name</label>
                  <input name="name" value={charityForm.name} onChange={handleCharityChange} required />
                </div>
                <div>
                  <label>Short Description</label>
                  <input name="shortDescription" value={charityForm.shortDescription} onChange={handleCharityChange} required />
                </div>
                <div>
                  <label>Long Description</label>
                  <textarea name="longDescription" value={charityForm.longDescription} onChange={handleCharityChange} rows="4" />
                </div>
                <div>
                  <label>Image URL</label>
                  <input name="imageUrl" value={charityForm.imageUrl} onChange={handleCharityChange} />
                </div>
                <div>
                  <label>Upcoming Event</label>
                  <input name="upcomingEvent" value={charityForm.upcomingEvent} onChange={handleCharityChange} />
                </div>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="checkbox" name="isFeatured" checked={charityForm.isFeatured} onChange={handleCharityChange} />
                  Featured charity
                </label>
                <button className="btn" disabled={savingCharity || !charityId}>
                  {savingCharity ? 'Saving...' : 'Update Charity'}
                </button>
              </form>

              <div>
                <h3 style={{ marginBottom: '12px' }}>All Charities</h3>
                <ul className="list">
                  {charities.map((charity) => (
                    <li key={charity.id} style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontWeight: 600 }}>
                          {charity.name} {charity.is_featured ? '(featured)' : ''}
                        </span>
                        <span style={{ display: 'block', fontSize: '14px', color: 'var(--muted)' }}>
                          {charity.short_description}
                        </span>
                      </div>
                      <div className="cta-row" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="ghost" onClick={() => handleCharitySelect({ target: { value: charity.id } })}>
                          Edit
                        </button>
                        <button type="button" className="ghost" onClick={() => handleDeleteCharity(charity.id, charity.name)} disabled={deletingCharityId === charity.id}>
                          {deletingCharityId === charity.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Proof Review</h2>
            {proofs.length === 0 ? (
              <p className="muted">No proofs to review yet.</p>
            ) : (
              <ul className="list" style={{ marginTop: '16px' }}>
                {proofs.map((proof) => (
                  <li key={proof.id} style={{ alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontWeight: 600 }}>
                        {proof.winners?.users?.full_name || 'Unknown user'} - {proof.winners?.draws?.month_key || 'Unknown draw'} - {proof.winners?.match_type || 'Unknown match'}
                      </span>
                      <span style={{ display: 'block', fontSize: '14px', color: 'var(--muted)' }}>
                        {proof.review_status}
                      </span>
                      <a href={proof.screenshot_url} target="_blank" rel="noreferrer">Open proof</a>
                    </div>
                    <div className="cta-row" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="ghost" onClick={() => handleProofReview(proof.id, 'approved')} disabled={reviewingProofId === proof.id}>
                        Approve
                      </button>
                      <button type="button" className="ghost" onClick={() => handleProofReview(proof.id, 'rejected')} disabled={reviewingProofId === proof.id}>
                        Reject
                      </button>
                      {proof.winners?.payout_status !== 'paid' && (
                        <button type="button" className="btn" onClick={() => handleMarkPaid(proof.winners.id)} disabled={markingPaidId === proof.winners.id}>
                          {markingPaidId === proof.winners.id ? 'Saving...' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}