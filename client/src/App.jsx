import { useEffect, useState } from "react";
import "./App.css";

async function authRequest(path, options = {}) {
  const response = await fetch(`/api/auth${path}`, {
    credentials: "include",
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const data = await authRequest("/me");

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (requestError) {
        if (!cancelled && requestError.status !== 401) {
          setStartupError(
            "Unable to connect. Check that the backend is running, then reload."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await authRequest("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setUser(data.user);
      setPassword("");
    } catch (requestError) {
      setError(
        requestError.status
          ? requestError.message
          : "Unable to connect. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setError("");
    setBusy(true);

    try {
      await authRequest("/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      setUser(null);
      setEmail("");
      setPassword("");
    } catch {
      setError("Logout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="loading-screen" role="status">
        Loading TuitionHub...
      </main>
    );
  }

  if (startupError) {
    return (
      <main className="login-card">
        <h1>TuitionHub</h1>
        <p role="alert">{startupError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </main>
    );
  }

  if (user) {
    const isTeacher = user.role === "teacher";

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <span className="brand">TuitionHub</span>
            <p>A/L Physics class management</p>
          </div>

          <button
            className="secondary-button"
            onClick={handleLogout}
            disabled={busy}
          >
            {busy ? "Logging out..." : "Log out"}
          </button>
        </header>

        <main className="welcome-card">
          <p className="eyebrow">
            {isTeacher ? "TEACHER WORKSPACE" : "STUDENT WORKSPACE"}
          </p>

          <h1>Welcome, {user.name}</h1>
          <p className="account-email">{user.email}</p>

          <p>
            {isTeacher
              ? "Your class management tools will appear here as we build them."
              : "Your enrolled classes, assignments, and progress will appear here."}
          </p>

          <div className="empty-state">
            <h2>
              {isTeacher
                ? "Ready to organise your classes"
                : "Ready to start learning"}
            </h2>
            <p>
              {isTeacher
                ? "Class creation is our next development task."
                : "Class enrolment will be added in an upcoming task."}
            </p>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <main className="login-page">
      <section className="intro-panel">
        <span className="brand">TuitionHub</span>
        <p className="eyebrow">A/L PHYSICS</p>
        <h1>A clearer path to learning.</h1>
        <p className="intro-text">
          One place for your classes, assignments, attendance,
          and learning progress.
        </p>

        <ul className="feature-list">
          <li>Stay organised with class assignments.</li>
          <li>Follow your attendance and results.</li>
          <li>Learn from teacher feedback.</li>
        </ul>
      </section>

      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">WELCOME BACK</p>
        <h2 id="login-title">Log in to your account</h2>
        <p className="muted">
          Use the account provided by your teacher.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            required
            disabled={busy}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={busy}
          />

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="help-text">
          Need an account? Contact your teacher.
        </p>
      </section>
    </main>
  );
}