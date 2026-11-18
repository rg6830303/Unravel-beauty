import { COMPANY, Legal } from "../legal";

export const metadata = { title: `Terms of Service · ${COMPANY}` };

export default function Terms() {
  return (
    <Legal title="Terms of Service">
      <p>These terms apply when you message {COMPANY} on WhatsApp or receive messages from us.</p>
      <h3>Messaging</h3>
      <ul>
        <li>We message you only after you have shared your number with us or contacted us.</li>
        <li>Promotional messages can be stopped any time by replying STOP or tapping "Stop promotions".</li>
        <li>Standard WhatsApp and data charges from your mobile provider may apply.</li>
      </ul>
      <h3>Acceptable use</h3>
      <p>Do not send unlawful, abusive or harmful content, or attempt to disrupt our systems. We may stop responding to numbers that misuse the service.</p>
      <h3>Content</h3>
      <p>Information in our messages, including offers and prices, may change. Automated replies are provided for convenience and a human can follow up on request.</p>
      <h3>Third-party services</h3>
      <p>WhatsApp is operated by Meta and governed by <a href="https://www.whatsapp.com/legal/terms-of-service">WhatsApp's Terms of Service</a>. We are not responsible for outages of WhatsApp or your network.</p>
      <h3>Liability</h3>
      <p>The service is provided "as is". To the extent permitted by law, {COMPANY} is not liable for indirect or consequential losses arising from its use.</p>
      <h3>Changes</h3>
      <p>We may update these terms by posting a new version on this page. Continuing to message us means you accept the current terms. These terms are governed by the laws of India.</p>
      <p>See also our <a href="/privacy">Privacy Policy</a>.</p>
    </Legal>
  );
}
