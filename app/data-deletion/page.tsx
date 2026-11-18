import { COMPANY, CONTACT, Legal } from "../legal";

export const metadata = { title: `Data Deletion · ${COMPANY}` };

export default function DataDeletion() {
  return (
    <Legal title="Data Deletion Instructions">
      <p>You can ask {COMPANY} to delete everything we hold about you: your phone number, name, messages and delivery history.</p>
      <h3>How to request deletion</h3>
      <ol>
        <li>Send <b>DELETE MY DATA</b> to us on WhatsApp from the number you want removed, or</li>
        <li>Email <a href={`mailto:${CONTACT}?subject=Data%20deletion%20request`}>{CONTACT}</a> with the subject "Data deletion request" and the WhatsApp number to remove.</li>
      </ol>
      <h3>What happens next</h3>
      <p>We confirm your request and delete your records within 30 days. We may keep a minimal record that you opted out so we never message you again, and anything we must retain by law.</p>
      <p>To delete WhatsApp's own copy of your account, use the settings in the WhatsApp app.</p>
    </Legal>
  );
}
