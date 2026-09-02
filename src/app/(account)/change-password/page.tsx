import Link from "next/link";

import PrototypeField from "@/components/forms/PrototypeField";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function ChangePasswordPage() {
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
        <section className="auth-card" aria-labelledby="change-password-title">
          <div className="auth-card-heading">
            <p className="eyebrow">Account setup · 01</p>
            <h1 id="change-password-title">Set a new password</h1>
            <p>This one-time step protects your account before you enter the workspace.</p>
          </div>

          <div className="auth-callout auth-callout-warning">
            <span className="callout-icon" aria-hidden="true">!</span>
            <div>
              <strong>Temporary password</strong>
              <p>Your administrator’s temporary password expires after this first change.</p>
            </div>
          </div>

          <form className="prototype-form">
            <PrototypeField hint="The temporary password from your administrator." id="current-password" label="Current password" type="password" required />
            <PrototypeField hint="Use something only you know." id="new-password" label="New password" type="password" required />
            <PrototypeField hint="Enter the same password again." id="confirm-password" label="Confirm new password" type="password" required />
            <button className="button button-wide" type="button">Change password</button>
          </form>
        </section>

        <aside className="auth-side" aria-label="Password requirements">
          <PrototypeNotice />
          <div className="auth-side-content">
            <span className="panel-kicker">Password checklist</span>
            <h2>Strong enough to forget about.</h2>
            <ul className="check-list check-list-status">
              <li><span aria-hidden="true">✓</span>At least 8 characters</li>
              <li><span aria-hidden="true">✓</span>One uppercase letter</li>
              <li><span aria-hidden="true">✓</span>One number or symbol</li>
              <li><span aria-hidden="true">✓</span>Does not match your username</li>
            </ul>
          </div>
          <div className="auth-success">
            <span className="status-dot" aria-hidden="true" />
            <div><strong>Password changed successfully</strong><span>You can continue to profile setup.</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
