export default function AccederButton() {
  const handleClick = (e) => {
    window.prettyModal?.open('modal-login', e);
  };

  return (
    <button className="btn-acceder" onClick={handleClick}>
      <div className="icon-badge">
        <svg
          className="icon-user"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="35" r="14" stroke="#000000" strokeWidth="10" />
          <path
            d="M 21 80 A 29 29 0 0 1 79 80"
            stroke="#000000"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="btn-text">Acceder</span>
    </button>
  );
}
