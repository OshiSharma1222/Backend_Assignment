import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import * as api from '../services/api';

export default function WinnerProofPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    winnerId: '',
    proofFile: null,
  });

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      proofFile: e.target.files[0],
    }));
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
    if (!formData.proofFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('winnerId', formData.winnerId);
      data.append('proof', formData.proofFile);
      await api.winners.uploadProof(data);
      setSuccess('Proof uploaded successfully!');
      setFormData({ winnerId: '', proofFile: null });
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
            <form onSubmit={handleSubmit} className="inline-form stack">
              <div>
                <label>Select Your Win</label>
                <select
                  name="winnerId"
                  value={formData.winnerId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a win...</option>
                  {/* Winners list will be populated from API */}
                </select>
              </div>
              <div>
                <label>Upload Proof</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  required
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
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
