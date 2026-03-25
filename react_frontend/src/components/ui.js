import React from "react";

// PUBLIC_INTERFACE
export function Card({ title, right, children }) {
  /** Standard card container used across pages. */
  return (
    <section className="card">
      {(title || right) && (
        <div className="cardHeader">
          <h3 className="cardTitle">{title}</h3>
          <div>{right}</div>
        </div>
      )}
      <div className="cardBody">{children}</div>
    </section>
  );
}

// PUBLIC_INTERFACE
export function Badge({ tone = "blue", children }) {
  /** Small badge for status/severity. tone: blue|amber|red */
  const cls =
    tone === "red" ? "badge badgeRed" : tone === "amber" ? "badge badgeAmber" : "badge badgeBlue";
  return <span className={cls}>{children}</span>;
}

// PUBLIC_INTERFACE
export function Notice({ tone = "info", children }) {
  /** Inline notice callout. tone: info|error */
  const cls = tone === "error" ? "notice noticeError" : "notice noticeInfo";
  return <div className={cls}>{children}</div>;
}
