import { Resend } from 'resend';

const resend = new Resend('re_PgR8QPs2_38yRuvBK9EeCe2nRj15EsxQk');

(async () => {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'thiagobodevanadvocacia@gmail.com',
      subject: 'Hello World from Assistente Jurídico',
      html: '<p>Congrats on sending your <strong>first email</strong> from the project!</p>'
    });

    console.log('Email sent successfully!');
    console.log(data);
  } catch (error) {
    console.error('Error sending email:', error);
  }
})();
