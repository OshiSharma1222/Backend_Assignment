import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
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
      <main>
        <div className="shell">
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">Monthly Draw • Real Charity Impact</span>
              <h1>Play your scores. Fund good causes. Win fair rewards.</h1>
              <p>
                Submit your 5 latest Stableford scores, join the {currentMonth} draw, and direct your
                subscription contribution to a charity you trust.
              </p>
              <div className="cta-row">
                <Link to="/register" className="btn primary">Start Subscription</Link>
                <Link to="/charities" className="ghost">Explore Charities</Link>
              </div>
            </div>
            <div className="card glass">
              <h3>How It Works</h3>
              <ol className="list" style={{ marginTop: '1rem', paddingLeft: 0, gap: '0.5rem' }}>
                <li>Subscribe monthly or yearly</li>
                <li>Keep your latest 5 scores updated</li>
                <li>Admin runs monthly draw</li>
                <li>Winners upload proof, get paid</li>
              </ol>
            </div>
          </section>

          <section className="section-grid three">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading featured charities...</p>
              </div>
            ) : charities.length > 0 ? (
              charities.map(charity => (
                <article key={charity.id} className="card">
                  <h3>{charity.name}</h3>
                  <p>{charity.short_description}</p>
                </article>
              ))
            ) : (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No featured charities available</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
