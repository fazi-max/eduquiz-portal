import { Router, Response } from 'express';
import { db, QuizAttempt } from './db';
import { hashPassword, comparePassword, generateToken, authenticateToken, requireAdmin, AuthenticatedRequest, optionalAuth } from './auth';
import { sendQuizCompletionNotifications, sendTestEmail, sendUserInquiryToAdmin } from './mailer';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/auth/register
 * Registers a new candidate/user with hashed password and returns a JWT
 * STRICT: Public registrations are ALWAYS standard student accounts.
 */
apiRouter.post('/auth/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name (minimum 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      return;
    }

    // Securely hash password using bcrypt
    const passwordHash = await hashPassword(password);
    // Public registration is restricted to 'student' role only
    const assignedRole = 'student';

    const user = db.createUser(name, email, passwordHash, assignedRole);

    const token = generateToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user account. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials, compares bcrypt hash, and returns a signed JWT
 */
apiRouter.post('/auth/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'Your account has been suspended or blocked by the Administrator.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service encountered an unexpected error.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = db.findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// ==========================================
// 2. QUIZ MANAGEMENT & TAKING
// ==========================================

/**
 * GET /api/quizzes
 * Returns list of available quizzes (safe, no answers)
 */
apiRouter.get('/quizzes', optionalAuth, (req, res) => {
  const publicQuizzes = db.getPublicQuizzes();
  res.json({ quizzes: publicQuizzes });
});

/**
 * GET /api/quizzes/:id
 * Fetches a quiz for an active candidate.
 * IMPORTANT: Correct answers and explanations are stripped server-side.
 */
apiRouter.get('/quizzes/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const quizId = req.params.id;
  const sanitizedQuiz = db.getQuizForTaker(quizId);

  if (!sanitizedQuiz) {
    res.status(404).json({ error: 'Quiz not found or not published.' });
    return;
  }

  res.json({ quiz: sanitizedQuiz });
});

/**
 * POST /api/quizzes/:id/submit
 * Core evaluation endpoint:
 * 1. Validates user answers against database correct answers securely
 * 2. Computes score, marks, percentage, and pass/fail state
 * 3. Saves attempt in database
 * 4. Triggers automated Nodemailer email to candidate and admin copy
 * 5. Returns full score report with explanations
 */
apiRouter.post('/quizzes/:id/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const quizId = req.params.id;
    const user = req.user!;
    const { answers = {}, timeSpentSeconds = 0 } = req.body;

    // Retrieve master quiz with correct answer keys securely
    const masterQuiz = db.getQuizByIdFull(quizId);
    if (!masterQuiz) {
      res.status(404).json({ error: 'Target quiz not found.' });
      return;
    }

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const evaluatedAnswers = masterQuiz.questions.map((question) => {
      const selectedOptionIndex = answers[question.id] !== undefined ? Number(answers[question.id]) : null;
      
      const isAnswered = selectedOptionIndex !== null && selectedOptionIndex >= 0;
      const isCorrect = isAnswered && selectedOptionIndex === question.correctOptionIndex;

      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks;
        totalScore += marksAwarded;
        correctCount += 1;
      } else if (isAnswered) {
        incorrectCount += 1;
      } else {
        unansweredCount += 1;
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        marksAwarded,
        maxMarks: question.marks,
        explanation: question.explanation
      };
    });

    const percentage = Number(((totalScore / masterQuiz.totalMarks) * 100).toFixed(1));
    const passed = percentage >= masterQuiz.passingPercentage;

    // Record attempt in database
    const savedAttempt = db.recordAttempt({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      quizId: masterQuiz.id,
      quizTitle: masterQuiz.title,
      score: totalScore,
      totalMarks: masterQuiz.totalMarks,
      percentage,
      passed,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unansweredCount,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      answers: evaluatedAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect: a.isCorrect,
        marksAwarded: a.marksAwarded,
        explanation: a.explanation
      })),
      emailNotification: {
        sentToUser: false,
        sentToAdmin: false,
        userEmail: user.email,
        adminEmail: process.env.ADMIN_EMAIL || 'admin@eduquizportal.com',
        timestamp: new Date().toISOString()
      }
    });

    // Asynchronously dispatch automated email via Nodemailer
    // Candidate receives detailed score summary, Admin receives notification copy
    let emailResult: {
      sentToUser: boolean;
      sentToAdmin: boolean;
      simulated: boolean;
      previewUrl?: string;
      userMessageId?: string;
      adminMessageId?: string;
    } = {
      sentToUser: false,
      sentToAdmin: false,
      simulated: true,
      previewUrl: undefined
    };

    try {
      emailResult = await sendQuizCompletionNotifications(savedAttempt);
    } catch (mailErr) {
      console.error('Email dispatch error on quiz submission:', mailErr);
    }

    res.json({
      message: 'Quiz evaluated and submitted successfully.',
      result: {
        attemptId: savedAttempt.id,
        quizId: masterQuiz.id,
        quizTitle: masterQuiz.title,
        score: totalScore,
        totalMarks: masterQuiz.totalMarks,
        percentage,
        passed,
        passingPercentage: masterQuiz.passingPercentage,
        correctAnswersCount: correctCount,
        incorrectAnswersCount: incorrectCount,
        unansweredCount,
        timeSpentSeconds,
        submittedAt: savedAttempt.submittedAt,
        answers: evaluatedAnswers,
        emailNotification: emailResult
      }
    });
  } catch (err: any) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Failed to process quiz evaluation.' });
  }
});

// ==========================================
// 3. ATTEMPT HISTORY
// ==========================================

/**
 * GET /api/attempts/my
 * Returns the authenticated user's attempt history
 */
apiRouter.get('/attempts/my', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const userAttempts = db.getUserAttempts(user.userId);
  res.json({ attempts: userAttempts });
});

/**
 * GET /api/attempts/:id
 * Returns a specific attempt with question-by-question breakdown
 */
apiRouter.get('/attempts/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const attempt = db.getAttemptById(req.params.id);

  if (!attempt) {
    res.status(404).json({ error: 'Attempt record not found.' });
    return;
  }

  // Ensure user owns this attempt or is admin
  if (attempt.userId !== user.userId && user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized to view this attempt record.' });
    return;
  }

  // Hydrate with question text and options
  const masterQuiz = db.getQuizByIdFull(attempt.quizId);
  const hydratedAnswers = attempt.answers.map((ans) => {
    const q = masterQuiz?.questions.find((mq) => mq.id === ans.questionId);
    return {
      ...ans,
      questionText: q?.questionText || 'Question item',
      options: q?.options || [],
      correctOptionIndex: q?.correctOptionIndex
    };
  });

  res.json({
    attempt: {
      ...attempt,
      answers: hydratedAnswers
    }
  });
});

/**
 * POST /api/contact-admin
 * Allows a student to send an email / support inquiry to the administrator
 */
apiRouter.post('/contact-admin', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subject, message } = req.body;
    const user = req.user!;

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a valid inquiry subject (minimum 3 characters).' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ error: 'Please enter a valid message (minimum 5 characters).' });
      return;
    }

    // Record message in DB
    const adminMsg = db.createAdminMessage({
      senderId: user.userId,
      senderName: user.name,
      senderEmail: user.email,
      subject: subject.trim(),
      message: message.trim()
    });

    // Send email to Administrator via SMTP
    const emailRes = await sendUserInquiryToAdmin({
      senderName: user.name,
      senderEmail: user.email,
      subject: subject.trim(),
      message: message.trim()
    });

    res.json({
      success: true,
      message: emailRes.message,
      previewUrl: emailRes.previewUrl,
      inquiryId: adminMsg.id
    });
  } catch (err: any) {
    console.error('Contact admin error:', err);
    res.status(500).json({ error: 'Failed to dispatch inquiry to administrator.' });
  }
});

// ==========================================
// 4. ADMIN ONLY ROUTES (AUDIT, USERS, QUIZZES)
// ==========================================

/**
 * GET /api/admin/attempts
 * Returns all student attempts (Admin only)
 */
apiRouter.get('/admin/attempts', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const attempts = db.getAllAttempts();
  res.json({ attempts });
});

/**
 * GET /api/admin/users
 * Returns list of registered candidate users with stats & block status (Admin only)
 */
apiRouter.get('/admin/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const users = db.getAllUsers();
  res.json({ users });
});

/**
 * POST /api/admin/users/:id/block
 * Blocks or unblocks a candidate (Admin only)
 */
apiRouter.post('/admin/users/:id/block', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { isBlocked } = req.body;
  const updatedUser = db.setUserBlocked(req.params.id, Boolean(isBlocked));
  if (!updatedUser) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }
  res.json({
    success: true,
    message: isBlocked ? 'User account has been blocked and active session terminated.' : 'User account has been unblocked.',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked
    }
  });
});

/**
 * POST /api/admin/users/:id/force-logout
 * Forces candidate logout by invalidating token (Admin only)
 */
apiRouter.post('/admin/users/:id/force-logout', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const updatedUser = db.forceLogoutUser(req.params.id);
  if (!updatedUser) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }
  res.json({
    success: true,
    message: `Active session for ${updatedUser.name} has been forcefully revoked.`
  });
});

/**
 * GET /api/admin/quizzes
 * Returns all quizzes with complete questions, answers & explanations (Admin only)
 */
apiRouter.get('/admin/quizzes', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const quizzes = db.getAllQuizzesAdmin();
  res.json({ quizzes });
});

/**
 * POST /api/admin/quizzes
 * Creates a brand new quiz (Admin only)
 */
apiRouter.post('/admin/quizzes', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, category, difficulty, timeLimitMinutes, passingPercentage, questions, isPublished } = req.body;
  if (!title || !description || !Array.isArray(questions)) {
    res.status(400).json({ error: 'Quiz title, description, and questions array are required.' });
    return;
  }

  const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0);
  const newQuiz = db.createQuiz({
    title,
    description,
    category: category || 'General',
    difficulty: difficulty || 'Intermediate',
    timeLimitMinutes: Number(timeLimitMinutes) || 10,
    passingPercentage: Number(passingPercentage) || 60,
    totalMarks,
    questions,
    isPublished: isPublished !== false
  });

  res.status(201).json({ success: true, quiz: newQuiz });
});

/**
 * PUT /api/admin/quizzes/:id
 * Updates quiz settings / details (Admin only)
 */
apiRouter.put('/admin/quizzes/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const updated = db.updateQuiz(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }
  res.json({ success: true, quiz: updated });
});

/**
 * PUT /api/admin/quizzes/:id/questions
 * Updates / reorders questions for a quiz (Admin only)
 */
apiRouter.put('/admin/quizzes/:id/questions', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    res.status(400).json({ error: 'Questions array is required.' });
    return;
  }

  const updated = db.updateQuizQuestions(req.params.id, questions);
  if (!updated) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }
  res.json({ success: true, quiz: updated });
});

/**
 * DELETE /api/admin/quizzes/:id
 * Deletes a quiz (Admin only)
 */
apiRouter.delete('/admin/quizzes/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteQuiz(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }
  res.json({ success: true, message: 'Quiz deleted successfully.' });
});

/**
 * GET /api/admin/messages
 * Returns student messages sent to the admin (Admin only)
 */
apiRouter.get('/admin/messages', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const messages = db.getAdminMessages();
  res.json({ messages });
});

// ==========================================
// 5. EMAIL DISPATCH & LOGS
// ==========================================

/**
 * GET /api/email-logs
 * Returns audit log of sent/simulated emails (Admin only)
 */
apiRouter.get('/email-logs', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const logs = db.getEmailLogs();
  res.json({ logs });
});

/**
 * POST /api/system/test-email
 * Sends a test email to verify SMTP credentials
 */
apiRouter.post('/system/test-email', async (req, res): Promise<void> => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail || !targetEmail.includes('@')) {
      res.status(400).json({ error: 'A valid target email address is required.' });
      return;
    }

    const testRes = await sendTestEmail(targetEmail);
    res.json(testRes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing SMTP test.' });
  }
});

// ==========================================
// 5. SYSTEM STATUS & STATS
// ==========================================

/**
 * GET /api/system/info
 * Returns system readiness, active database counts, and SMTP configuration status
 */
apiRouter.get('/system/info', (req, res) => {
  const stats = db.getStats();
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('notifications@eduquizportal.com')
  );

  res.json({
    portalName: 'EduQuiz Portal',
    version: '1.0.0',
    stats,
    smtp: {
      configured: smtpConfigured,
      host: process.env.SMTP_HOST || 'Simulated Ethereal SMTP',
      port: process.env.SMTP_PORT || '587',
      adminEmail: process.env.ADMIN_EMAIL || 'mf0622192@gmail.com',
      mode: smtpConfigured ? 'Production SMTP' : 'Sandbox / In-App Email Log Mode'
    },
    demoAccounts: [
      { role: 'Student', email: 'student@eduquiz.com', password: 'password123', name: 'Alex Rivera' }
    ]
  });
});
