export default function ComingSoon({ title, description }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__card">
        <div className="coming-soon__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span className="coming-soon__badge">Próximamente</span>
        <h2 className="coming-soon__title">{title}</h2>
        {description && <p className="coming-soon__description">{description}</p>}
      </div>
    </div>
  );
}
