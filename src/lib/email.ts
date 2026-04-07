import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export interface AlertEmail {
  projeto: string;
  etapa: string;
  dataFim: string;
}

export async function sendAlertEmail(data: AlertEmail): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Controle de Producao" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject: `⚠ Fase "Quase Atraso" — ${data.etapa}`,
      html: `
        <h2>Alerta: Fase Quase Atraso</h2>
        <p>Uma fase do projeto entrou em status <strong>Quase Atraso</strong>.</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Projeto</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.projeto}</td></tr>
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Etapa</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.etapa}</td></tr>
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Data Fim</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.dataFim}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6272a4;font-size:12px;">Este email foi enviado automaticamente pelo sistema de Controle de Producao.</p>
      `,
    });
    console.log(`[Email Alert] Sent: "${data.etapa}" (${data.projeto}) is almost overdue`);
    return true;
  } catch (err) {
    console.error('[Email Alert] Failed to send:', err);
    return false;
  }
}
