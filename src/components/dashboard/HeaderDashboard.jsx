import { Link } from 'react-router-dom';

export default function HeaderDashboard() {
  return (
    <header className="header-dashboard">
      <div className="header-dashboard__left">
        <Link to="/" className="header-dashboard__back">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Volver al inicio</span>
        </Link>
      </div>
      <div className="header-dashboard__right">
        <div className="header-dashboard__user">
          <div className="header-dashboard__avatar">
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="35" r="14" stroke="#ffffff" strokeWidth="10" />
              <path d="M 21 80 A 29 29 0 0 1 79 80" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
            </svg>
          </div>
          <span className="header-dashboard__name">Admin</span>
        </div>
      </div>
    </header>
  );
}
