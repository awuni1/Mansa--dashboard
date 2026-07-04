import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  // Require internal API secret to prevent unauthenticated SMTP relay abuse
  const authHeader = req.headers.get('authorization');
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to, toName, subject, body } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return NextResponse.json(
      { error: 'Email service is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM to .env.local.' },
      { status: 503 }
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Sanitize toName to prevent SMTP header injection
  const safeName = (toName || '').replace(/[\r\n"]/g, '');

  try {
    await transporter.sendMail({
      from: `"Mansa to Mansa" <${from}>`,
      to: safeName ? `"${safeName}" <${to}>` : to,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
