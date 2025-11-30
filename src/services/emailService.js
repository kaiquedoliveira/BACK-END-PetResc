const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), 
  secure: false, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, 
    ciphers: "SSLv3"           
  },
  connectionTimeout: 10000, 
});

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`Tentando enviar e-mail para: ${to}...`);
        const info = await transporter.sendMail({
            from: `"PetResc" <${process.env.MAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
        });
        console.log(` E-mail enviado: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(` Falha no envio de e-mail: ${error.message}`);
        return false; 
    }
};

module.exports = { sendEmail };