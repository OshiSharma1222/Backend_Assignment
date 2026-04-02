import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function WinnerProofPage() {
  const [loading, setLoading] = useState(false);
  const [winningsLoading, setWinningsLoading] = useState(true);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [winnings, setWinnings] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    winnerId: '',
  });

  useEffect(() => {
    fetchWinnings();
    fetchProofs();
  }, []);

  const fetchWinnings = async () => {
    try {
      const response = await api.winners.getWinnings();
      const availableWinnings = response.data.winnings || [];
      setWinnings(availableWinnings);
      if (availableWinnings.length > 0) {
        setFormData({ winnerId: availableWinnings[0].id });
      }
    } catch (err) {
      setError('Failed to load your winnings');
      setWinnings([]);
    } finally {
      setWinningsLoading(false);
    }
  };

  const fetchProofs = async () => {
    try {
      const response = await api.winners.getProofs();
      setProofs(response.data.proofs || []);
    } catch (err) {
      setProofs([]);
    } finally {
      setProofsLoading(false);
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
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSelectedFileName(file ? file.name : '');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.winnerId) {
      setError('Please select a win');
      return;
    }

    if (!selectedFile) {
      setError('Please upload an image');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('winnerId', formData.winnerId);
      payload.append('screenshot', selectedFile);
      await api.winners.uploadProof(payload);
      setSuccess('Proof uploaded successfully!');
      setFormData({ winnerId: '' });
      setSelectedFile(null);
      setSelectedFileName('');
      await fetchProofs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <main>
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
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Uploaded Proofs</h2>
              {proofsLoading ? (
                <p className="muted">Loading uploaded proofs...</p>
              ) : proofs.length === 0 ? (
                <p className="muted">No proofs uploaded yet.</p>
              ) : (
                <ul className="list">
                  {proofs.map((proof) => (
                    <li key={proof.id} style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block' }}>
                          {proof.winners?.draws?.month_key || 'Unknown draw'} - {proof.winners?.match_type || 'Unknown match'}
                        </span>
                        <span style={{ display: 'block', fontSize: '14px', color: 'var(--muted)' }}>
                          {proof.review_status}
                        </span>
                        <a href={proof.screenshot_url} target="_blank" rel="noreferrer">View uploaded proof</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                      {winner.draws?.month_key || 'Unknown draw'} - {winner.match_type} - {winner.payout_status}
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
              <button type="submit" className="btn primary" disabled={loading || winningsLoading || winnings.length === 0}>
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
