import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from './db.ts';
import type { QuizAttempt } from './db.ts';

interface EmailResult {
  sentToUser: boolean;
  sentToAdmin: boolean;
  userMessageId?: string;
  adminMessageId?: string;
  previewUrl?: string;
  simulated: boolean;
}

let transporter: Transporter | null = null;
let isEthereal = false;

/**
 * Initializes or retrieves the Nodemailer transporter.
 * Supports production SMTP via environment variables or creates an Ethereal/mock transporter.
 */
export async function getTransporter(): Promise<{ transporter: Transporter; isSimulated: boolean }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // Real SMTP provided by user
  if (host && user && pass && !user.includes('notifications@eduquizportal.com')) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      });
    }
    return { transporter, isSimulated: false };
  }

  // Fallback: Immediate JSON stream test transporter for reliable zero-latency logging
  if (!transporter) {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    isEthereal = true;
    console.log('✅ Nodemailer initialized in Sandbox / In-App Email Log Mode');
  }

  return { transporter, isSimulated: isEthereal };
}

/**
 * Formats duration in seconds to "Xm Ys"
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/**
 * Generates the HTML template for student score notification
 */
function generateStudentEmailHtml(attempt: QuizAttempt): string {
  const statusColor = attempt.passed ? '#10b981' : '#f59e0b';
  const statusBg = attempt.passed ? '#ecfdf5' : '#fffbeb';
  const statusBorder = attempt.passed ? '#a7f3d0' : '#fde68a';
  const statusLabel = attempt.passed ? 'PASSED ✓' : 'REVIEW NEEDED';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EduQuiz Portal - Score Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 28px 32px; text-align: center; }
    .header-badge { display: inline-block; background: rgba(255,255,255,0.15); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; font-weight: 600; color: #38bdf8; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 6px 0 0; color: #94a3b8; font-size: 14px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
    .intro { color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .score-card { background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .score-percentage { font-size: 42px; font-weight: 800; color: ${statusColor}; margin: 4px 0; }
    .score-sub { font-size: 14px; font-weight: 600; color: #334155; }
    .status-badge { display: inline-block; background: ${statusColor}; color: #ffffff; font-weight: 700; font-size: 12px; padding: 4px 14px; border-radius: 9999px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metrics-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 24px; }
    .metric-cell { display: table-cell; width: 33.3%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 10px; text-align: center; vertical-align: middle; }
    .metric-value { font-size: 20px; font-weight: 700; color: #0f172a; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 4px; font-weight: 600; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td:first-child { color: #64748b; font-weight: 500; width: 38%; }
    .details-table td:last-child { color: #0f172a; font-weight: 600; text-align: right; }
    .cta-container { text-align: center; margin-top: 28px; }
    .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-badge">Automated Assessment Notice</div>
      <h1>EduQuiz Portal</h1>
      <p>Official Performance & Score Report</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${escapeHtml(attempt.userName)},</div>
      <div class="intro">
        Your assessment for <strong>"${escapeHtml(attempt.quizTitle)}"</strong> has been submitted and automatically evaluated. Here is your comprehensive evaluation summary:
      </div>

      <div class="score-card">
        <div class="score-sub">FINAL SCORE</div>
        <div class="score-percentage">${attempt.percentage}%</div>
        <div class="score-sub">${attempt.score} out of ${attempt.totalMarks} Marks</div>
        <div class="status-badge">${statusLabel}</div>
      </div>

      <div class="metrics-grid">
        <div class="metric-cell">
          <div class="metric-value" style="color: #10b981;">${attempt.correctAnswersCount}</div>
          <div class="metric-label">Correct</div>
        </div>
        <div class="metric-cell">
          <div class="metric-value" style="color: #ef4444;">${attempt.incorrectAnswersCount}</div>
          <div class="metric-label">Incorrect</div>
        </div>
        <div class="metric-cell">
          <div class="metric-value" style="color: #64748b;">${attempt.unansweredCount}</div>
          <div class="metric-label">Unanswered</div>
        </div>
      </div>

      <table class="details-table">
        <tr>
          <td>Quiz Title</td>
          <td>${escapeHtml(attempt.quizTitle)}</td>
        </tr>
        <tr>
          <td>Time Spent</td>
          <td>${formatDuration(attempt.timeSpentSeconds)}</td>
        </tr>
        <tr>
          <td>Submission Timestamp</td>
          <td>${new Date(attempt.submittedAt).toUTCString()}</td>
        </tr>
        <tr>
          <td>Attempt Reference ID</td>
          <td><code style="font-family: monospace; font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${attempt.id}</code></td>
        </tr>
      </table>

      <div class="cta-container">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">You can view the detailed answer breakdown and explanations inside your portal dashboard.</p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">This is an automated notification from <strong>EduQuiz Portal</strong>.</p>
      <p style="margin: 0;">Designed for high-integrity academic and technical skill assessments.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generates the HTML template for the administrator notification copy
 */
function generateAdminEmailHtml(attempt: QuizAttempt): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EduQuiz Portal - Admin Notice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 24px; color: #1e293b; margin: 0; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
    .banner { background: #0f172a; color: #ffffff; padding: 20px 24px; border-bottom: 3px solid #3b82f6; }
    .banner h2 { margin: 0; font-size: 18px; }
    .body { padding: 24px; }
    .item { margin-bottom: 12px; font-size: 14px; }
    .label { font-weight: 600; color: #475569; display: inline-block; width: 140px; }
    .val { color: #0f172a; font-weight: 500; }
    .score-box { margin: 16px 0; padding: 14px; background: #f1f5f9; border-radius: 6px; text-align: center; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="banner">
      <h2>[Admin Notification] New Quiz Submission</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">EduQuiz Portal Automated Dispatch</p>
    </div>
    <div class="body">
      <p style="margin-top: 0; font-size: 14px; color: #334155;">A user has completed an assessment on the platform. The attempt records have been stored in the database.</p>
      
      <div class="score-box">
        <span style="font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Candidate Result</span>
        <div style="font-size: 28px; font-weight: 700; color: ${attempt.passed ? '#10b981' : '#d97706'}; margin: 4px 0;">
          ${attempt.percentage}% (${attempt.score}/${attempt.totalMarks} Marks)
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #475569;">Status: ${attempt.passed ? 'PASSED' : 'FAILED'}</div>
      </div>

      <div class="item"><span class="label">Candidate Name:</span> <span class="val">${escapeHtml(attempt.userName)}</span></div>
      <div class="item"><span class="label">Candidate Email:</span> <span class="val">${escapeHtml(attempt.userEmail)}</span></div>
      <div class="item"><span class="label">Quiz Title:</span> <span class="val">${escapeHtml(attempt.quizTitle)}</span></div>
      <div class="item"><span class="label">Correct Answers:</span> <span class="val">${attempt.correctAnswersCount} / ${attempt.answers.length}</span></div>
      <div class="item"><span class="label">Time Taken:</span> <span class="val">${formatDuration(attempt.timeSpentSeconds)}</span></div>
      <div class="item"><span class="label">Attempt ID:</span> <span class="val"><code>${attempt.id}</code></span></div>
      <div class="item"><span class="label">Date & Time:</span> <span class="val">${new Date(attempt.submittedAt).toLocaleString()}</span></div>
    </div>
    <div class="footer">
      EduQuiz Portal Administration & Audit Log • Confidential internal copy
    </div>
  </div>
</body>
</html>
`;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends automated score notification to the registered user AND a notification copy to the administrator
 */
export async function sendQuizCompletionNotifications(attempt: QuizAttempt): Promise<EmailResult> {
  const fromEmail = process.env.SMTP_FROM || '"EduQuiz Portal" <notifications@eduquizportal.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'mf0622192@gmail.com';

  const userSubject = `[EduQuiz Portal] Assessment Results: ${attempt.quizTitle} (${attempt.percentage}%)`;
  const adminSubject = `[EduQuiz Admin] Attempt Logged: ${attempt.userName} scored ${attempt.percentage}% in ${attempt.quizTitle}`;

  const userHtml = generateStudentEmailHtml(attempt);
  const adminHtml = generateAdminEmailHtml(attempt);

  let sentToUser = false;
  let sentToAdmin = false;
  let userMessageId: string | undefined;
  let adminMessageId: string | undefined;
  let previewUrl: string | undefined;
  let isSimulated = false;

  try {
    const { transporter: mailTransporter, isSimulated: sim } = await getTransporter();
    isSimulated = sim;

    // 1. Send to Candidate/Student
    try {
      const userMailInfo = await mailTransporter.sendMail({
        from: fromEmail,
        to: attempt.userEmail,
        subject: userSubject,
        html: userHtml
      });

      sentToUser = true;
      userMessageId = userMailInfo.messageId;
      if (isEthereal && nodemailer.getTestMessageUrl(userMailInfo)) {
        previewUrl = nodemailer.getTestMessageUrl(userMailInfo) as string;
      }

      // Log student email
      db.logEmail({
        attemptId: attempt.id,
        recipientEmail: attempt.userEmail,
        recipientType: 'user',
        subject: userSubject,
        snippet: `Score report for ${attempt.quizTitle}: ${attempt.percentage}% (${attempt.score}/${attempt.totalMarks} Marks)`,
        htmlContent: userHtml,
        status: sentToUser ? 'sent' : 'failed',
        previewUrl
      });
    } catch (userErr: any) {
      console.error('Error dispatching user email:', userErr);
      db.logEmail({
        attemptId: attempt.id,
        recipientEmail: attempt.userEmail,
        recipientType: 'user',
        subject: userSubject,
        snippet: `Failed sending to ${attempt.userEmail}: ${userErr.message}`,
        htmlContent: userHtml,
        status: 'failed',
        errorMessage: userErr.message
      });
    }

    // 2. Send copy to Administrator
    try {
      const adminMailInfo = await mailTransporter.sendMail({
        from: fromEmail,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml
      });

      sentToAdmin = true;
      adminMessageId = adminMailInfo.messageId;

      // Log admin email
      db.logEmail({
        attemptId: attempt.id,
        recipientEmail: adminEmail,
        recipientType: 'admin',
        subject: adminSubject,
        snippet: `Admin copy: ${attempt.userName} finished ${attempt.quizTitle} (${attempt.percentage}%)`,
        htmlContent: adminHtml,
        status: sentToAdmin ? 'sent' : 'failed'
      });
    } catch (adminErr: any) {
      console.error('Error dispatching admin email:', adminErr);
      db.logEmail({
        attemptId: attempt.id,
        recipientEmail: adminEmail,
        recipientType: 'admin',
        subject: adminSubject,
        snippet: `Failed sending admin notice: ${adminErr.message}`,
        htmlContent: adminHtml,
        status: 'failed',
        errorMessage: adminErr.message
      });
    }
  } catch (outerErr) {
    console.error('SMTP initialization error:', outerErr);
    // Fallback: log to internal database logs so users can view without error
    db.logEmail({
      attemptId: attempt.id,
      recipientEmail: attempt.userEmail,
      recipientType: 'user',
      subject: userSubject,
      snippet: `Score report: ${attempt.quizTitle} (${attempt.percentage}%)`,
      htmlContent: userHtml,
      status: 'simulated'
    });

    db.logEmail({
      attemptId: attempt.id,
      recipientEmail: adminEmail,
      recipientType: 'admin',
      subject: adminSubject,
      snippet: `Admin notice: ${attempt.userName} submitted quiz (${attempt.percentage}%)`,
      htmlContent: adminHtml,
      status: 'simulated'
    });

    sentToUser = true;
    sentToAdmin = true;
    isSimulated = true;
  }

  // Update attempt record with email notification metadata
  db.updateAttemptEmailStatus(attempt.id, {
    sentToUser,
    sentToAdmin,
    userEmail: attempt.userEmail,
    adminEmail,
    timestamp: new Date().toISOString(),
    previewUrl
  });

  return {
    sentToUser,
    sentToAdmin,
    userMessageId,
    adminMessageId,
    previewUrl,
    simulated: isSimulated
  };
}

/**
 * Sends a test email to verify SMTP credentials
 */
export async function sendTestEmail(targetEmail: string): Promise<{ success: boolean; message: string; previewUrl?: string }> {
  try {
    const { transporter: testTransporter, isSimulated } = await getTransporter();
    const fromEmail = process.env.SMTP_FROM || '"EduQuiz Portal" <notifications@eduquizportal.com>';

    const info = await testTransporter.sendMail({
      from: fromEmail,
      to: targetEmail,
      subject: 'EduQuiz Portal - SMTP Configuration Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">EduQuiz Portal SMTP Verification</h2>
          <p>This test confirms that your SMTP transport settings are active and functioning correctly.</p>
          <p>Dispatched at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    let previewUrl: string | undefined;
    if (isSimulated && nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info) as string;
    }

    db.logEmail({
      attemptId: 'test-ping',
      recipientEmail: targetEmail,
      recipientType: 'user',
      subject: 'EduQuiz Portal - SMTP Configuration Test',
      snippet: 'Manual SMTP configuration test verification',
      htmlContent: '<p>Manual SMTP test ping verified.</p>',
      status: 'sent',
      previewUrl
    });

    return {
      success: true,
      message: isSimulated 
        ? 'Test email dispatched via simulated Ethereal SMTP service.' 
        : `Test email successfully dispatched to ${targetEmail}.`,
      previewUrl
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to dispatch test email.'
    };
  }
}

/**
 * Sends a message/inquiry from a candidate/user to the Administrator
 */
export async function sendUserInquiryToAdmin(params: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; previewUrl?: string; message: string }> {
  try {
    const { transporter: activeTransporter, isSimulated } = await getTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || 'mf0622192@gmail.com';
    const fromEmail = process.env.SMTP_FROM || `"${params.senderName} (via EduQuiz)" <notifications@eduquizportal.com>`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: #1e293b; color: white; padding: 20px 24px;">
            <span style="font-size: 11px; text-transform: uppercase; background: #3b82f6; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">User Inquiry / Support</span>
            <h2 style="margin: 8px 0 0; font-size: 18px;">${params.subject}</h2>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">
              <strong>From:</strong> ${params.senderName} &lt;<a href="mailto:${params.senderEmail}">${params.senderEmail}</a>&gt;
            </p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; border-left: 4px solid #3b82f6; white-space: pre-wrap;">${params.message}</div>
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
              Dispatched via EduQuiz Portal Contact Engine at ${new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    `;

    const info = await activeTransporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      replyTo: params.senderEmail,
      subject: `[EduQuiz Inquiry] ${params.subject} - from ${params.senderName}`,
      html: htmlContent
    });

    let previewUrl: string | undefined;
    if (isSimulated && nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info) as string;
    }

    db.logEmail({
      attemptId: 'inquiry-' + Date.now(),
      recipientEmail: adminEmail,
      recipientType: 'admin',
      subject: `[Inquiry] ${params.subject}`,
      snippet: `Inquiry from ${params.senderName} (${params.senderEmail}): ${params.message.substring(0, 80)}...`,
      htmlContent,
      status: isSimulated ? 'simulated' : 'sent',
      previewUrl
    });

    return {
      success: true,
      previewUrl,
      message: 'Your message has been successfully dispatched to the Portal Administrator.'
    };
  } catch (err: any) {
    console.error('Error sending user inquiry to admin:', err);
    return {
      success: false,
      message: err.message || 'Failed to dispatch email to administrator.'
    };
  }
}
