import nodemailer from 'nodemailer';

export interface AlertEmail {
  projeto: string;
  etapa: string;
  dataFim: string;
}

export interface EmailConfig {
  user: string;
  appPassword: string;
  recipient: string;
}

export async function sendAlertEmail(config: EmailConfig, data: AlertEmail): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });
    await transporter.sendMail({
      from: `"Controle de Producao" <${config.user}>`,
      to: config.recipient,
      subject: `Alerta: Fase "Quase Atraso" - ${data.etapa}`,
      html: `
        <h2>Alerta: Fase Quase Atraso</h2>
        <p>Uma fase do projeto entrou em status <strong>Quase Atraso</strong>.</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Projeto</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.projeto}</td></tr>
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Etapa</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.etapa}</td></tr>
          <tr><td style="padding:4px 12px;border:1px solid #ddd;"><strong>Data Fim</strong></td><td style="padding:4px 12px;border:1px solid #ddd;">${data.dataFim}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6272a4;font-size:12px;">Email automatico do sistema de Controle de Producao.</p>
      `,
    });
    console.log(`[Email Alert] Sent: "${data.etapa}" (${data.projeto}) is almost overdue`);
    return true;
  } catch (err) {
    console.error('[Email Alert] Failed to send:', err);
    return false;
  }
}

export async function sendAlerts(config: EmailConfig, fases: AlertEmail[]): Promise<{ total: number; sent: number }> {
  let sent = 0;
  for (const f of fases) {
    const ok = await sendAlertEmail(config, f);
    if (ok) sent++;
  }
  return { total: fases.length, sent };
}
