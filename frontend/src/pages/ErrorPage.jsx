import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function ErrorPage({ message = 'Page not found' }) {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main style={{ flex: 1, paddingBottom: '20px' }}>
        <div className="shell">
          <section className="auth-wrap card">
            <h1>Error</h1>
            <p>{message}</p>
            <div className="cta-row">
              <button onClick={() => navigate('/')} className="btn">
                Go Home
              </button>
              <button onClick={() => navigate(-1)} className="ghost">
                Go Back
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
