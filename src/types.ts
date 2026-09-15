export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isBlocked?: boolean;
  forceLoggedOutAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  isPublished: boolean;
  createdAt: string;
  questionsCount: number;
}

export interface QuestionForTaker {
  id: string;
  questionText: string;
  options: string[];
  marks: number;
}

export interface ActiveQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  isPublished: boolean;
  createdAt: string;
  questions: QuestionForTaker[];
}

export interface EvaluatedAnswer {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation: string;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingPercentage: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: EvaluatedAnswer[];
  emailNotification: {
    sentToUser: boolean;
    sentToAdmin: boolean;
    userMessageId?: string;
    adminMessageId?: string;
    previewUrl?: string;
    simulated: boolean;
  };
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: {
    questionId: string;
    questionText?: string;
    options?: string[];
    selectedOptionIndex: number | null;
    correctOptionIndex?: number;
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
  }[];
  emailNotification?: {
    sentToUser: boolean;
    sentToAdmin: boolean;
    userEmail: string;
    adminEmail: string;
    timestamp: string;
    previewUrl?: string;
  };
}

export interface EmailLog {
  id: string;
  attemptId: string;
  recipientEmail: string;
  recipientType: 'user' | 'admin';
  subject: string;
  snippet: string;
  htmlContent: string;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: string;
  previewUrl?: string;
  errorMessage?: string;
}

export interface SystemInfo {
  portalName: string;
  version: string;
  stats: {
    totalUsers: number;
    totalQuizzes: number;
    totalAttempts: number;
    totalEmailsDispatched: number;
  };
  smtp: {
    configured: boolean;
    host: string;
    port: string;
    adminEmail: string;
    mode: string;
  };
  demoAccounts: {
    role: string;
    email: string;
    password: string;
    name: string;
  }[];
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isBlocked: boolean;
  forceLoggedOutAt?: string;
  createdAt: string;
  attemptsCount: number;
  lastAttemptDate?: string;
}

export interface FullQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
}

export interface AdminQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  isPublished: boolean;
  createdAt: string;
  questions: FullQuestion[];
}

export interface AdminMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}
