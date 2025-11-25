const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }      
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"PetResc" <${process.env.MAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
        });
        console.log(`E-mail enviado para ${to}`);
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
    }
};

module.exports = { sendEmail };