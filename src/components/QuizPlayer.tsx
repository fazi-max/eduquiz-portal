import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  List,
  LayoutGrid,
  Maximize2,
  X,
  Sparkles
} from 'lucide-react';
import { ActiveQuiz } from '../types';

interface QuizPlayerProps {
  quiz: ActiveQuiz;
  onSubmit: (answers: Record<string, number>, timeSpentSeconds: number) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onSubmit,
  onCancel,
  submitting
}) => {
  // Current active question index (for single question mode)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected answers: questionId -> selectedOptionIndex (0-indexed)
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // Flagged for review questions: Set of questionIds
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // View mode: 'single' (question-by-question) or 'list' (clean scrollable list)
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer state
  const totalSeconds = (quiz.timeLimitMinutes || 10) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Keep track of submission triggered by timer expiration
  const autoSubmittedRef = useRef(false);

  // Live countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoSubmit = async () => {
    // Automatically submit when countdown reaches 0
    await onSubmit(answers, totalSeconds);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Format time (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 60; // Under 1 minute
  const isWarningTime = timeLeft <= 180 && !isLowTime; // Under 3 minutes

  const currentQuestion = quiz.questions[currentIndex];

  const handleProceedToSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await onSubmit(answers, elapsedTime);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Sticky Test Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Quiz Title & Question Progress */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            title="Exit Quiz"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {quiz.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>{quiz.category}</span>
              <span>•</span>
              <span className="font-semibold text-blue-600">
                {answeredCount} of {totalQuestions} Answered
              </span>
            </div>
          </div>
        </div>

        {/* View Mode & Timer */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Toggle View Mode */}
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Step Mode</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Scroll List</span>
            </button>
          </div>

          {/* Live Timer Pill */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm font-bold font-mono transition-all ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : isWarningTime
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600' : 'text-slate-500'}`} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-quiz-header"
            onClick={handleProceedToSubmit}
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit Quiz</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Grid: Left Question Content, Right Navigation Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Question Area (Span 3 on Desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'single' ? (
            /* Question-by-Question Single Display */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({currentQuestion.marks} Marks)
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    flagged.has(currentQuestion.id)
                      ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${flagged.has(currentQuestion.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{flagged.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag Question'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQuestion.questionText}
              </h3>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                  return (
                    <div
                      key={optIdx}
                      id={`option-${currentQuestion.id}-${optIdx}`}
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mr-3.5 shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {optionLetters[optIdx] || optIdx + 1}
                      </div>

                      <span className={`text-sm leading-relaxed ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleProceedToSubmit}
                      className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Clean Scrollable List View Mode */
            <div className="space-y-6">
              {quiz.questions.map((question, qIdx) => {
                const isFlagged = flagged.has(question.id);
                const currentAnswer = answers[question.id];

                return (
                  <div
                    key={question.id}
                    id={`list-question-${question.id}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Question {qIdx + 1} of {totalQuestions} • {question.marks} Marks
                      </span>
                      <button
                        onClick={() => handleToggleFlag(question.id)}
                        className={`text-xs px-2.5 py-1 rounded-md border flex items-center space-x-1 ${
                          isFlagged
                            ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                            : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isFlagged ? 'fill-amber-500' : ''}`} />
                        <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {question.questionText}
                    </h4>

                    <div className="space-y-2 pt-1">
                      {question.options.map((opt, optIdx) => {
                        const isSelected = currentAnswer === optIdx;
                        const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(question.id, optIdx)}
                            className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 font-semibold text-slate-900'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs mr-3 font-bold ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {optionLetters[optIdx] || optIdx + 1}
                            </span>
                            <span className="text-xs">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="text-center py-4">
                <button
                  onClick={handleProceedToSubmit}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  Review & Submit All Answers
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Question Palette (Span 1 on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Question Navigator
            </h4>

            {/* Quick Palette Chips */}
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flagged.has(q.id);
                const isCurrent = viewMode === 'single' && currentIndex === idx;

                return (
                  <button
                    key={q.id}
                    id={`nav-chip-${idx}`}
                    onClick={() => {
                      setViewMode('single');
                      setCurrentIndex(idx);
                    }}
                    className={`relative h-10 rounded-xl text-xs font-bold flex items-center justify-center transition border ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 border-blue-600 text-blue-700 bg-blue-50'
                        : isAnswered
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-blue-600 rounded-sm" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded-sm" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-white border border-amber-400 rounded-sm relative">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                </span>
                <span>Flagged for Review ({flagged.size})</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              id="btn-sidebar-submit"
              onClick={handleProceedToSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Finish & Evaluate
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Quiz Submission</h3>
                <p className="text-xs text-slate-500">EduQuiz Portal Automated Grading</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {unansweredCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-slate-900">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-medium">
                ⚠️ Notice: You still have {unansweredCount} unanswered questions. Once submitted, questions cannot be re-answered.
              </p>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Back to Questions
              </button>
              <button
                type="button"
                id="btn-confirm-final-submit"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
