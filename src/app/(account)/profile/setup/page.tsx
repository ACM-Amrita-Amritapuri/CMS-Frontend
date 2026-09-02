import Link from "next/link";

import PrototypeField from "@/components/forms/PrototypeField";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function ProfileSetupPage() {
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
        <section className="auth-card auth-card-wide" aria-labelledby="profile-setup-title">
          <div className="auth-card-heading">
            <p className="eyebrow">Account setup · 02</p>
            <h1 id="profile-setup-title">Complete your profile</h1>
            <p>Give your clubmates enough context to know how to connect with you.</p>
          </div>

          <div className="setup-progress" aria-label="Profile setup progress">
            <div className="setup-progress-topline"><span>Profile setup</span><strong>2 of 3</strong></div>
            <div className="progress-track"><span style={{ width: "66%" }} /></div>
            <span className="field-hint">You can refine this information later.</span>
          </div>

          <form className="prototype-form">
            <div className="form-grid-two">
              <PrototypeField hint="This is shown on your profile." id="full-name" label="Full name" placeholder="e.g. Aanya Sharma" required />
              <PrototypeField hint="Your club identifier." id="roll-number" label="Roll number" placeholder="ACM-024" required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="about-you">About you</label>
              <textarea id="about-you" placeholder="What are you learning or building?" rows={4} />
              <span className="field-hint">A short introduction helps people find common ground.</span>
            </div>
            <div className="form-grid-two">
              <div className="field-group">
                <label className="field-label" htmlFor="primary-sig">Primary SIG</label>
                <select defaultValue="web" id="primary-sig">
                  <option value="web">Web Development</option>
                  <option value="ai">Artificial Intelligence</option>
                  <option value="design">Design &amp; Media</option>
                </select>
                <span className="field-hint">You can join more SIGs later.</span>
              </div>
              <PrototypeField hint="Optional public contact link." id="website" label="Website or social link" placeholder="https://..." type="text" />
            </div>
            <button className="button button-wide" type="button">Save profile</button>
          </form>
        </section>

        <aside className="auth-side" aria-label="Profile setup notes">
          <PrototypeNotice />
          <div className="profile-avatar-placeholder" aria-hidden="true">AS</div>
          <div className="auth-side-content">
            <span className="panel-kicker">Your profile preview</span>
            <h2>Let your work speak sooner.</h2>
            <p>Profile information will appear alongside learning progress, projects, and SIG participation.</p>
          </div>
          <div className="auth-success"><span className="status-dot" aria-hidden="true" /><div><strong>Profile ready to publish</strong><span>All required fields are present.</span></div></div>
        </aside>
      </div>
    </main>
  );
}
