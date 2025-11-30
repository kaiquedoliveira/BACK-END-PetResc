const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    console.log(`Enviando e-mail para ${to}...`);

    const data = await resend.emails.send({
      from: "PetResc <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("E-mail enviado via Resend!", data);
    return true;

  } catch (error) {
    console.error("Erro ao enviar com Resend:", error);
    return false;
  }
}

module.exports = { sendEmail };
