import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import * as charityApi from '../services/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    charityId: '',
    charityPercentage: 10,
  });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const response = await charityApi.charities.getAll();
      setCharities(response.data.charities || []);
      if (response.data.charities?.length > 0) {
        setFormData(prev => ({ ...prev, charityId: response.data.charities[0].id }));
      }
    } catch (err) {
      setError('Failed to load charities');
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
    setLoading(true);
    setError('');

    try {
      await register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.charityId,
        parseInt(formData.charityPercentage)
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <section className="auth-wrap card">
            <h1>Create account</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="inline-form stack">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>
              <div>
                <label>Choose Charity</label>
                <select
                  name="charityId"
                  value={formData.charityId}
                  onChange={handleChange}
                  required
                >
                  {charities.map(charity => (
                    <option key={charity.id} value={charity.id}>
                      {charity.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Charity Contribution % (min 10)</label>
                <input
                  type="number"
                  name="charityPercentage"
                  min="10"
                  max="100"
                  value={formData.charityPercentage}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p style={{ marginTop: '16px', textAlign: 'center' }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
