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
  const [selectedFileName, setSelectedFileName] = useState('');
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
      const availableWinnings = response.data.winnings || [];
      setWinnings(availableWinnings);
      if (availableWinnings.length > 0) {
        setFormData(prev => ({ ...prev, winnerId: availableWinnings[0].id }));
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFileName('');
      setFormData(prev => ({ ...prev, screenshotUrl: '' }));
      return;
    }

    setSelectedFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        screenshotUrl: String(reader.result || ''),
      }));
    };
    reader.onerror = () => {
      setError('Could not read the selected image');
      setSelectedFileName('');
      setFormData(prev => ({ ...prev, screenshotUrl: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.winnerId) {
      setError('Please select a win');
      return;
    }

    if (!formData.screenshotUrl.trim()) {
      setError('Please choose an image to upload');
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
      setSelectedFileName('');
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
              <p className="muted">No winnings are available yet.</p>
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
                <label>Upload Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  disabled={winningsLoading || winnings.length === 0}
                />
              </div>
              {selectedFileName && (
                <p style={{ marginTop: '-4px', fontSize: '14px', color: 'var(--muted)' }}>
                  Selected file: {selectedFileName}
                </p>
              )}
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

