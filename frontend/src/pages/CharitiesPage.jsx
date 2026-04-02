import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import * as charityApi from '../services/api';

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const response = await charityApi.charities.getAll();
      setCharities(response.data.charities || []);
    } catch (err) {
      setError('Failed to load charities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <h1>Featured Charities</h1>
          {error && <p className="error">{error}</p>}

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading charities...</p>
            </div>
          ) : (
            <section className="section-grid three">
              {charities.map(charity => (
                <article key={charity.id} className="card">
                  <h3>{charity.name}</h3>
                  <p>{charity.short_description}</p>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {charity.description}
                  </p>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
