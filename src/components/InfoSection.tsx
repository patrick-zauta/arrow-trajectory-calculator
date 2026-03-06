export function InfoSection() {
  return (
    <section className="card info-grid">
      <details>
        <summary>Theorie</summary>
        <p>
          Ballistikmodell mit Luftwiderstand auf Basis von Cw, rho, Querschnitt A und diskreter Zeitintegration
          ueber dt. Die vertikale Widerstandskomponente wird als abs(vy/speed) in das Modell integriert.
        </p>
      </details>

      <details>
        <summary>Quellen</summary>
        <ul>
          <li>Fachliche Vorlage aus bestehenden Tabellenmodellen (Kompakt, Datenreihen, Theorie, Quellen)</li>
          <li>SI Umrechnungen: fps zu m/s, grain zu kg, mm zu m</li>
          <li>Konstanten in der App: Cw=2.1, g=9.81, rho=1.2, dt=0.001 (anpassbar)</li>
        </ul>
      </details>
    </section>
  )
}
