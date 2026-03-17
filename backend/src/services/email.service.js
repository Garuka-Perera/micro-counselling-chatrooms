const nodemailer = require("nodemailer");

function getMailerConfig() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
  } = process.env;

  const enabled =
    Boolean(SMTP_HOST) &&
    Boolean(SMTP_PORT) &&
    Boolean(SMTP_USER) &&
    Boolean(SMTP_PASS) &&
    Boolean(EMAIL_FROM);

  return {
    enabled,
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || "false").toLowerCase() === "true",
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: EMAIL_FROM,
  };
}

let transporterCache = null;

function getTransporter() {
  if (transporterCache) return transporterCache;

  const config = getMailerConfig();

  if (!config.enabled) {
    return null;
  }

  transporterCache = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporterCache;
}

async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const config = getMailerConfig();
  const transporter = getTransporter();

  if (!config.enabled || !transporter) {
    return {
      sent: false,
      reason: "SMTP_NOT_CONFIGURED",
    };
  }

  const safeName = fullName || "there";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #123424; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Reset your Micro-Counsel password</h2>
      <p>Hello ${safeName},</p>
      <p>We received a request to reset your password.</p>
      <p>
        Click the button below to choose a new password:
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            background: #198754;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 18px;
            border-radius: 10px;
            font-weight: 700;
          "
        >
          Reset password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>This reset link will expire in 1 hour.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>— Micro-Counsel</p>
    </div>
  `;

  const text = [
    "Reset your Micro-Counsel password",
    "",
    `Hello ${safeName},`,
    "We received a request to reset your password.",
    `Reset link: ${resetUrl}`,
    "",
    "This reset link will expire in 1 hour.",
    "If you did not request this, you can ignore this email.",
    "",
    "— Micro-Counsel",
  ].join("\n");

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Reset your Micro-Counsel password",
    text,
    html,
  });

  return {
    sent: true,
  };
}

module.exports = {
  getMailerConfig,
  sendPasswordResetEmail,
};