import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import * as charityApi from '../services/api';

export default function HomePage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const response = await charityApi.charities.getFeatured();
      setCharities(response.data.charities || []);
    } catch (err) {
      console.error('Error fetching charities:', err);
    } finally {
      setLoading(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = months[new Date().getMonth()];

  return (
    <>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <section className="hero">
            <div>
              <p className="eyebrow">Monthly Draw • Real Charity Impact</p>
              <h1>Play your scores. Fund good causes. Win fair rewards.</h1>
              <p>
                Submit your 5 latest Stableford scores, join the {currentMonth} draw, and direct your
                subscription contribution to a charity you trust.
              </p>
              <div className="cta-row">
                <Link to="/register" className="btn">Start Subscription</Link>
                <Link to="/charities" className="ghost">Explore Charities</Link>
              </div>
            </div>
            <div className="card glass">
              <h3>How It Works</h3>
              <ol style={{ margin: '0', paddingLeft: '20px', textAlign: 'left' }}>
                <li>Subscribe monthly or yearly</li>
                <li>Keep your latest 5 scores updated</li>
                <li>Admin runs monthly draw</li>
                <li>Winners upload proof, get paid</li>
              </ol>
            </div>
          </section>

          <section className="section-grid three">
            {loading ? (
              <p>Loading featured charities...</p>
            ) : charities.length > 0 ? (
              charities.map(charity => (
                <article key={charity.id} className="card">
                  <h3>{charity.name}</h3>
                  <p>{charity.short_description}</p>
                </article>
              ))
            ) : (
              <p>No featured charities available</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
