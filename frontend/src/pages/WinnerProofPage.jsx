import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function WinnerProofPage() {
  const [loading, setLoading] = useState(false);
  const [winningsLoading, setWinningsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [winnings, setWinnings] = useState([]);
  const [formData, setFormData] = useState({
    winnerId: '',
    screenshotUrl: '',
  });

  useEffect(() => {
    fetchWinnings();
  }, []);

  const fetchWinnings = async () => {
    try {
      const response = await api.winners.getWinnings();
      setWinnings(response.data.winnings || []);
      if ((response.data.winnings || []).length > 0) {
        setFormData(prev => ({ ...prev, winnerId: response.data.winnings[0].id }));
      }
    } catch (err) {
      setError('Failed to load your winnings');
      setWinnings([]);
    } finally {
      setWinningsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.winnerId) {
      setError('Please select a win');
      return;
    }

    if (!formData.screenshotUrl.trim()) {
      setError('Please enter a screenshot URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.winners.uploadProof({
        winnerId: formData.winnerId,
        screenshotUrl: formData.screenshotUrl.trim(),
      });
      setSuccess('Proof uploaded successfully!');
      setFormData({ winnerId: '', screenshotUrl: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <section className="auth-wrap card">
            <h1>Upload Winner Proof</h1>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            {winningsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading your winnings...</p>
              </div>
            ) : winnings.length === 0 ? (
              <p className="muted">You do not have any winnings to verify yet.</p>
            ) : null}
            <form onSubmit={handleSubmit} className="inline-form stack">
              <div>
                <label>Select Your Win</label>
                <select
                  name="winnerId"
                  value={formData.winnerId}
                  onChange={handleChange}
                  required
                  disabled={winningsLoading || winnings.length === 0}
                >
                  <option value="">Choose a win...</option>
                  {winnings.map((winner) => (
                    <option key={winner.id} value={winner.id}>
                      {winner.draws?.month_key || 'Unknown draw'} • {winner.match_type} • {winner.payout_status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Screenshot URL</label>
                <input
                  type="url"
                  name="screenshotUrl"
                  value={formData.screenshotUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  required
                  disabled={winningsLoading || winnings.length === 0}
                />
              </div>
              <button type="submit" className="btn" disabled={loading || winningsLoading || winnings.length === 0}>
                {loading ? 'Uploading...' : 'Upload Proof'}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
