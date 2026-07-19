import AccederButton from './AccederButton.jsx';

export default function Header() {
  return (
    <>
      <div className="contenidoIzquierda">
        <h1>Eco Mesh</h1>
      </div>
      <div className="contenidoDerecha">
        <AccederButton />
      </div>
    </>
  );
}
