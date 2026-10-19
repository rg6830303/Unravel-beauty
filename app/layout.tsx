import "./globals.css";
import Link from "next/link";

export const metadata = { title: "WA Outreach" };

const NAV = [
  ["/", "Dashboard"], ["/contacts", "Contacts"], ["/campaigns", "Campaigns"],
  ["/inbox", "Inbox"], ["/templates", "Templates"], ["/automations", "AI & Automations"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <aside>
          <h2>WA Outreach</h2>
          {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </aside>
        <main>{children}</main>
      </body>
    </html>
  );
}
