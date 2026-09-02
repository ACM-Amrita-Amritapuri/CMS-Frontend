import Link from "next/link";

import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { prototypeSections } from "@/lib/prototype/content";

export default function PrototypePage() {
  return (
    <main className="prototype-index">
      <header className="landing-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ACM CMS</span>
        </Link>
        <Link className="text-link" href="/dashboard">Open workspace <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="prototype-intro" aria-labelledby="prototype-title">
        <p className="eyebrow">Design review index</p>
        <h1 id="prototype-title">Every screen has a job.</h1>
        <p>
          A clickable map of the CMS experience. Open any screen to review its
          hierarchy, content needs, and states with the design team.
        </p>
      </section>

      <PrototypeNotice />

      <div className="prototype-sections">
        {prototypeSections.map((section, index) => (
          <section className="prototype-section" key={section.label} aria-labelledby={`prototype-section-${index}`}>
            <div className="prototype-section-heading">
              <div>
                <p className="panel-kicker">0{index + 1}</p>
                <h2 id={`prototype-section-${index}`}>{section.label}</h2>
              </div>
              <p>{section.description}</p>
            </div>
            <div className="prototype-screen-grid">
              {section.screens.map((screen) => (
                <Link className="prototype-screen" href={screen.href} key={screen.href}>
                  <span className="prototype-screen-topline">
                    <span className="card-label">{screen.href}</span>
                    <span aria-hidden="true">↗</span>
                  </span>
                  <strong>{screen.label}</strong>
                  <span>{screen.purpose}</span>
                  <span className="prototype-screen-components">
                    {screen.components.map((component) => <span key={component}>{component}</span>)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
