import Link from "next/link";

import PrototypeField from "@/components/forms/PrototypeField";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ACM CMS</span>
        </Link>
        <Link className="text-link" href="/prototype">Screen map <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="auth-layout">
        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-card-heading">
            <p className="eyebrow">Member access</p>
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to continue learning, building, and contributing with your club.</p>
          </div>

          <div className="auth-alert" role="alert">
            <strong>Invalid credentials</strong>
            <span>Check your roll number or username and try again.</span>
          </div>

          <form className="prototype-form">
            <PrototypeField
              hint="Use the identifier from your club account."
              id="login"
              label="Roll number or username"
              placeholder="e.g. ACM-024"
              required
            />
            <PrototypeField
              hint="Your password is never shown in the URL or browser storage."
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
            />
            <div className="form-row form-row-between">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember this device</span>
              </label>
              <button className="text-button" type="button">Forgot password?</button>
            </div>
            <button className="button button-wide" type="button">Sign in</button>
          </form>
          <p className="auth-footer-copy">New to the club? Your administrator can create an account for you.</p>
        </section>

        <aside className="auth-side" aria-label="Login screen notes">
          <PrototypeNotice />
          <div className="auth-side-content">
            <span className="panel-kicker">What this screen needs</span>
            <h2>Make the first step feel light.</h2>
            <ul className="check-list">
              <li>Clear account identifier guidance</li>
              <li>Readable invalid-credentials recovery</li>
              <li>Visible path to password help</li>
              <li>Keyboard-first form flow</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
