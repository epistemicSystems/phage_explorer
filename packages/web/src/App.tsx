import React from 'react';

const App: React.FC = () => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">Phage Explorer Web</div>
        <div className="app-subtitle">Phase 0 · Foundation scaffold</div>
      </header>

      <main className="app-body">
        <section className="card">
          <h1>Bootstrapped</h1>
          <p>
            Vite + React 19 + Bun workspace is wired up. Next steps: hook shared
            packages, port themes, and build keyboard-first surface.
          </p>
        </section>
      </main>
    </div>
  );
};

export default App;

