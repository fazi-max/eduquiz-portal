/**
 * EduQuiz Portal - Mongoose Database Schema Models
 * 
 * These models define the MongoDB schemas for Users, Quizzes, Questions,
 * Quiz Attempts, and Email Notification Logs.
 */

export interface IUserDocument {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin' | 'instructor';
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionDocument {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number; // 0-indexed correct answer (kept strictly on server)
  explanation: string;
  marks: number;
}

export interface IQuizDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitMinutes: number; // 0 for unlimited, or e.g. 10 minutes
  totalMarks: number;
  passingPercentage: number;
  questionsCount: number;
  questions: IQuestionDocument[];
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAttemptDocument {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
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
  submittedAt: Date;
  answers: {
    questionId: string;
    selectedOptionIndex: number | null;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
  emailNotificationStatus: {
    sentToUser: boolean;
    sentToAdmin: boolean;
    userEmail: string;
    adminEmail: string;
    dispatchedAt: Date;
    messageId?: string;
    previewUrl?: string;
  };
}

export interface IEmailLogDocument {
  id: string;
  attemptId: string;
  recipientEmail: string;
  recipientType: 'user' | 'admin';
  subject: string;
  htmlContent: string;
  status: 'sent' | 'simulated' | 'failed';
  errorMessage?: string;
  timestamp: Date;
  previewUrl?: string;
}

/**
 * Example Mongoose Code representation for reference and export
 */
export const mongooseCodeExample = `
import mongoose, { Schema } from 'mongoose';

// 1. User Schema
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'instructor'], default: 'student' },
}, { timestamps: true });

// 2. Question Sub-Schema
const QuestionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 }
});

// 3. Quiz Schema
const QuizSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  timeLimitMinutes: { type: Number, required: true, default: 10 },
  totalMarks: { type: Number, required: true },
  passingPercentage: { type: Number, default: 60 },
  questions: [QuestionSchema],
  isPublished: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// 4. Attempt Schema
const AttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  correctAnswersCount: { type: Number, required: true },
  incorrectAnswersCount: { type: Number, required: true },
  unansweredCount: { type: Number, required: true },
  timeSpentSeconds: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  answers: [{
    questionId: { type: String, required: true },
    selectedOptionIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true }
  }],
  emailNotificationStatus: {
    sentToUser: { type: Boolean, default: false },
    sentToAdmin: { type: Boolean, default: false },
    userEmail: String,
    adminEmail: String,
    dispatchedAt: Date,
    messageId: String
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
export const Quiz = mongoose.model('Quiz', QuizSchema);
export const Attempt = mongoose.model('Attempt', AttemptSchema);
`;
