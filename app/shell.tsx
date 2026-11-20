"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["/", "Dashboard"], ["/contacts", "Contacts"], ["/campaigns", "Campaigns"],
  ["/inbox", "Inbox"], ["/templates", "Templates"], ["/automations", "AI & Automations"], ["/settings", "Delivery settings"],
  ["/whatsapp", "WhatsApp Business"], ["/setup", "Setup & health"],
];
// Public pages (login, legal pages Meta links to) must not show the admin menu.
const PUBLIC = ["/login", "/privacy", "/terms", "/data-deletion"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (PUBLIC.includes(path)) return <main>{children}</main>;
  return (
    <>
      <aside>
        <h2>WA Outreach</h2>
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "active" : ""}>{label}</Link>
        ))}
        <a href="/login" className="logout" onClick={(e) => {
          e.preventDefault();
          fetch("/api/login", { method: "DELETE" }).finally(() => { location.href = "/login"; });
        }}>Log out</a>
      </aside>
      <main>{children}</main>
    </>
  );
}
