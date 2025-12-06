import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration - use environment variables in production
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.DEFAULT_FROM_EMAIL || '',
    pass: process.env.SMTP_PASSWORD || '', // Use app password for Gmail
  },
};

const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || process.env.SMTP_USER || 'noreply@mansa.com';

export async function POST(request: NextRequest) {
  try {
    const { recipients, subject, body, fromEmail = DEFAULT_FROM_EMAIL } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required' },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      // Fallback to mailto links if SMTP fails
      return NextResponse.json({
        success: false,
        message: 'SMTP not configured. Using mailto fallback.',
        useMailto: true,
        recipients,
        subject,
        body
      });
    }

    const results = [];
    const errors = [];

    // Send emails with delay to avoid rate limiting
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        const mailOptions = {
          from: {
            name: 'Mansa to Mansa',
            address: fromEmail
          },
          to: recipient.email,
          subject: subject.replace(/{{name}}/g, recipient.name).replace(/{{email}}/g, recipient.email),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0;">Mansa to Mansa</h1>
                <p style="color: #6b7280; margin: 5px 0;">Connecting African Professionals</p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                ${body
                  .replace(/{{name}}/g, recipient.name)
                  .replace(/{{email}}/g, recipient.email)
                  .replace(/\n/g, '<br>')
                }
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  This email was sent from the Mansa to Mansa admin dashboard.
                </p>
                <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                  If you have any questions, please contact us at ${fromEmail}
                </p>
              </div>
            </div>
          `,
          text: body
            .replace(/{{name}}/g, recipient.name)
            .replace(/{{email}}/g, recipient.email)
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
          messageId: info.messageId
        });

        // Add delay between emails to avoid rate limiting
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        errors.push({
          email: recipient.email,
          name: recipient.name,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${results.length} emails${errors.length > 0 ? ` with ${errors.length} failures` : ''}`,
      results,
      errors,
      total: recipients.length,
      sent: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}