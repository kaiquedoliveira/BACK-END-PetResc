const nodemailer = require('nodemailer');



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

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // smtp.gmail.com
  port: Number(process.env.MAIL_PORT), // 587
  secure: false, // ⚠️ OBRIGATÓRIO ser false para porta 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    // ⚠️ O PULO DO GATO: Isso evita erros de certificado no Render
    rejectUnauthorized: false,
    ciphers: "SSLv3"
  }
});
module.exports = { sendEmail, transporter };