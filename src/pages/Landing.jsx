import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import LoginModal from '../components/LoginModal.jsx';

export default function Landing() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="clipPath" clipPathUnits="objectBoundingBox">
            <path
              d="M0.745444 0C0.758024 0 0.768223 0.018108 0.768223 0.040445V0.091001C0.768223 0.113338 0.778423 0.131446 0.791002 0.131446H0.977221C0.989801 0.131446 1 0.149554 1 0.171891V0.959555C1 0.981892 0.989801 1 0.977221 1H0.022779C0.010199 1 0 0.981892 0 0.959555V0.171891C0 0.149554 0.010199 0.131446 0.022779 0.131446H0.118451C0.131031 0.131446 0.14123 0.113338 0.14123 0.091001V0.040445C0.14123 0.018108 0.151429 0 0.164009 0H0.745444Z"
              fill="#02542D"
            />
          </clipPath>
        </defs>
      </svg>

      <section>
        <Header />
        <Hero />
      </section>

      <LoginModal />
    </>
  );
}
