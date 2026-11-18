import { COMPANY, CONTACT, Legal } from "../legal";

export const metadata = { title: `Privacy Policy · ${COMPANY}` };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy">
      <p>{COMPANY} uses the WhatsApp Business Platform (Cloud API) provided by Meta to send updates and answer customer messages. This policy explains what we collect and how we use it.</p>
      <h3>Information we collect</h3>
      <ul>
        <li>Your WhatsApp phone number and profile name.</li>
        <li>Messages you send us and the delivery and read status of messages we send you.</li>
        <li>Details you give us directly, such as your name, and clicks on links we send.</li>
      </ul>
      <h3>How we use it</h3>
      <ul>
        <li>To send messages you agreed to receive and reply to your questions.</li>
        <li>To respect your choices, including opting out of promotional messages.</li>
        <li>To measure delivery and improve how often and when we contact you.</li>
      </ul>
      <p>Some replies may be drafted by an AI assistant. We do not sell your personal information.</p>
      <h3>Sharing</h3>
      <p>Messages travel through Meta's WhatsApp service and are subject to <a href="https://www.whatsapp.com/legal/privacy-policy">WhatsApp's Privacy Policy</a>. We store data with our hosting and database providers (Vercel, Supabase) under contracts that keep it confidential. We disclose data only when required by law.</p>
      <h3>Retention and security</h3>
      <p>We keep contact and message records while you remain a contact and delete them on request. Data is encrypted in transit and access is limited to authorised staff.</p>
      <h3>Your choices</h3>
      <p>Reply <b>STOP</b> or tap "Stop promotions" to stop promotional messages at any time. You can request a copy or deletion of your data; see our <a href="/data-deletion">data deletion instructions</a> or email {CONTACT}.</p>
      <h3>Changes</h3>
      <p>We will post updates to this page and change the date above.</p>
    </Legal>
  );
}
