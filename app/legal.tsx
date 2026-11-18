// Shared copy for the public legal pages Meta requires before an app can go Live.
export const COMPANY = "Kendu Technologies";
export const CONTACT = "technologykendu@gmail.com";
export const UPDATED = "18 November 2026";

export function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="card" style={{ maxWidth: 760, lineHeight: 1.6 }}>
      <h1>{title}</h1>
      <p className="muted">{COMPANY} · Last updated {UPDATED}</p>
      {children}
      <p>Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </article>
  );
}
