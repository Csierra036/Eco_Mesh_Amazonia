import { useNavigate } from 'react-router-dom';

export default function LoginModal() {
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const dialog = e.currentTarget.closest('.modal');
    if (dialog) {
      window.prettyModal?.close('modal-login', { currentTarget: dialog });
    }
    navigate('/dashboard');
  };

  const onCloseClick = (e) => {
    window.prettyModal?.close('modal-login', e);
  };

  return (
    <dialog id="modal-login" className="modal">
      <button
        className="modal__close"
        type="button"
        aria-label="Cerrar"
        onClick={onCloseClick}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      <div className="modal__content">
        <h2 className="modal__title">Bienvenido</h2>
        <p className="modal__subtitle">Ingresa para continuar</p>

        <form className="modal__form" onSubmit={onSubmit}>
          <label className="modal__field">
            <span>Email</span>
            <input type="email" required autoComplete="email" />
          </label>
          <label className="modal__field">
            <span>Contraseña</span>
            <input type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" className="modal__submit">
            Acceder
          </button>
        </form>
      </div>
    </dialog>
  );
}
