import { useState } from "react";
import "./App.css";

export default function App() {
  const [message, setMessage] = useState("Connection not checked yet.");
  const [checking, setChecking] = useState(false);

  async function checkBackend() {
    setChecking(true);
    setMessage("Connecting...");

    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      if (data.success !== true) {
        throw new Error("Unexpected backend response");
      }

      setMessage(data.message);
    } catch {
      setMessage("Unable to connect. Check that the backend is running.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="connection-card">
      <p className="eyebrow">A/L PHYSICS CLASS MANAGEMENT</p>
      <h1>TuitionHub</h1>
      <p>Manage classes, attendance, assignments, and student progress.</p>

      <section className="status-box" aria-label="Backend connection">
        <h2>Backend connection</h2>
        <p role="status">{message}</p>

        <button onClick={checkBackend} disabled={checking}>
          {checking ? "Checking..." : "Check connection"}
        </button>
      </section>
    </main>
  );
}