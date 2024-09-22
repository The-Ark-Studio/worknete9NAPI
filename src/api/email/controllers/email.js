// ./api/email/controllers/email.js
// const strapi = require('@strapi/strapi')

module.exports = {
  async sendTestEmail(ctx) {
    try {
      // Access Strapi's email service
      await strapi.plugins['email'].services.email.send({
        to: 'huynhlananh0411@gmail.com',
        from: 'no-reply-e9@theark.studio',
        subject: 'Test Email',
        text: 'This is a test email from Strapi using Brevo (Sendinblue)',
      });

      ctx.send({ message: 'Email sent successfully' });
    } catch (err) {
      ctx.send({ error: 'Failed to send email', details: err.message }, 500);
    }
  },
};
