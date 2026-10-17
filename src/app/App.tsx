import { Link, Navigate, Route, Routes } from "react-router";

function FoundationPage() {
  return (
    <main className="foundation-shell">
      <section className="foundation-card">
        <p className="foundation-eyebrow">React migration</p>
        <h1>Beyblade X Scorebook</h1>
        <p>
          The React, TypeScript, Vite, and HashRouter foundation is running.
          Page migration begins after this tooling baseline is verified.
        </p>
        <div className="foundation-actions">
          <Link to="/foundation">Verify client-side routing</Link>
          <a href="./">Open the current application</a>
        </div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route index element={<FoundationPage />} />
      <Route path="foundation" element={<FoundationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
