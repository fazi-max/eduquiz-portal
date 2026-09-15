/**
 * EduQuiz Portal - Full-Stack Web-Based Quiz & Assessment Platform
 * 
 * Includes user authentication, interactive timed quizzes, automated grading,
 * database storage, and Nodemailer SMTP notifications.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuizPlayer } from './components/QuizPlayer';
import { ResultModal } from './components/ResultModal';
import { AttemptHistory } from './components/AttemptHistory';
import { AdminBoard } from './components/AdminBoard';
import { AuthModal } from './components/AuthModal';
import { AttemptReviewModal } from './components/AttemptReviewModal';
import { ContactAdmin } from './components/ContactAdmin';
import { api, tokenStorage } from './services/api';
import {
  User,
  QuizListItem,
  ActiveQuiz,
  QuizResult,
  QuizAttempt,
  SystemInfo
} from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => tokenStorage.getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'quizzes' | 'history' | 'admin' | 'contact-admin'>('quizzes');

  // Quizzes & Attempts state
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Active Quiz taking & evaluation states
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [activeResult, setActiveResult] = useState<QuizResult | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fetch initial data
  const loadPortalData = useCallback(async () => {
    try {
      // 1. Fetch available quizzes
      const quizzesRes = await api.getQuizzes();
      setQuizzes(quizzesRes.quizzes || []);

      // 2. Fetch system readiness
      const sysRes = await api.getSystemInfo();
      setSystemInfo(sysRes);

      // 3. If logged in, fetch user's attempts
      if (tokenStorage.getToken()) {
        try {
          const userRes = await api.getMe();
          setCurrentUser(userRes.user);
          const attemptsRes = await api.getMyAttempts();
          setUserAttempts(attemptsRes.attempts || []);
        } catch {
          // Token expired, revoked, or user blocked
          tokenStorage.clear();
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Sign out
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setUserAttempts([]);
    setActiveTab('quizzes');
    setActiveQuiz(null);
    setActiveResult(null);
    setFeedbackMessage('You have been logged out successfully.');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Start a Quiz
  const handleStartQuiz = async (quizId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.getQuiz(quizId);
      setActiveQuiz(res.quiz);
      setActiveResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize quiz session.');
    }
  };

  // Submit a Quiz
  const handleSubmitQuiz = async (answers: Record<string, number>, timeSpentSeconds: number) => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz.id, answers, timeSpentSeconds);
      setActiveQuiz(null);
      setActiveResult(res.result);

      // Refresh user's attempts
      const attemptsRes = await api.getMyAttempts();
      setUserAttempts(attemptsRes.attempts || []);
    } catch (err: any) {
      alert(err.message || 'Failed to submit and grade assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveQuiz(null);
          setActiveResult(null);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        systemInfo={systemInfo}
      />

      {/* Floating Notification Banner */}
      {feedbackMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Active Timed Quiz Session */}
        {activeQuiz ? (
          <QuizPlayer
            quiz={activeQuiz}
            onSubmit={handleSubmitQuiz}
            onCancel={() => {
              setActiveQuiz(null);
            }}
            submitting={submitting}
          />
        ) : activeResult ? (
          /* Instant Assessment Results Screen */
          <ResultModal
            result={activeResult}
            onRetake={() => handleStartQuiz(activeResult.quizId)}
            onGoHome={() => setActiveResult(null)}
            onViewEmails={() => {
              setActiveResult(null);
              setActiveTab('history');
            }}
          />
        ) : (
          /* Standard Views */
          <>
            {activeTab === 'quizzes' && (
              <Dashboard
                quizzes={quizzes}
                userAttempts={userAttempts}
                currentUser={currentUser}
                onSelectQuiz={handleStartQuiz}
                onRequireAuth={() => setAuthModalOpen(true)}
                onViewHistory={() => setActiveTab('history')}
                onGoToAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'history' && (
              <AttemptHistory
                attempts={userAttempts}
                onSelectAttemptForReview={(id) => setReviewAttemptId(id)}
                onGoToQuizzes={() => setActiveTab('quizzes')}
              />
            )}

            {activeTab === 'contact-admin' && (
              <ContactAdmin
                currentUser={currentUser}
                onSent={() => setActiveTab('quizzes')}
              />
            )}

            {activeTab === 'admin' && (
              currentUser?.role === 'admin' ? (
                <AdminBoard onSelectAttempt={(id) => setReviewAttemptId(id)} />
              ) : (
                <Dashboard
                  quizzes={quizzes}
                  userAttempts={userAttempts}
                  currentUser={currentUser}
                  onSelectQuiz={handleStartQuiz}
                  onRequireAuth={() => setAuthModalOpen(true)}
                  onViewHistory={() => setActiveTab('history')}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              E
            </div>
            <span className="font-bold text-slate-800">EduQuiz Portal</span>
            <span>• Automated Assessment & Examination Architecture</span>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} EduQuiz Portal. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
            setFeedbackMessage(`Welcome Administrator ${user.name}`);
          } else {
            setActiveTab('quizzes');
            setFeedbackMessage(`Signed in as ${user.name}`);
          }
          setTimeout(() => setFeedbackMessage(null), 3500);
          loadPortalData();
        }}
      />

      {/* Attempt Answer Sheet Modal */}
      <AttemptReviewModal
        attemptId={reviewAttemptId}
        onClose={() => setReviewAttemptId(null)}
      />
    </div>
  );
}
