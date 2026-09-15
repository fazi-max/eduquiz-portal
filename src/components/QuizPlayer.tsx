import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  Check
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
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 transition-all">
        {/* Quiz Title & Question Progress */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            title="Exit Quiz"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span>{quiz.title}</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-600">{quiz.category}</span>
              <span>•</span>
              <span className="font-bold text-indigo-600">
                {answeredCount} of {totalQuestions} Answered
              </span>
            </div>
          </div>
        </div>

        {/* View Mode, Timer & Submit */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Toggle View Mode */}
          <div className="hidden sm:flex bg-slate-100/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/60">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Step Mode</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Scroll List</span>
            </button>
          </div>

          {/* Live Timer Pill */}
          <motion.div
            animate={isLowTime ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm font-bold font-mono transition-all duration-300 ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-400 shadow-sm shadow-rose-500/20'
                : isWarningTime
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm shadow-amber-500/15'
                : 'bg-slate-50 text-slate-800 border-slate-200/90'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600 animate-spin' : isWarningTime ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>{formatTimer(timeLeft)}</span>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="btn-submit-quiz-header"
            onClick={handleProceedToSubmit}
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit Quiz</span>
          </motion.button>
        </div>
      </div>

      {/* Interactive Progress Bar */}
      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      {/* Main Grid: Left Question Content, Right Navigation Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Question Area (Span 3 on Desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'single' ? (
            /* Question-by-Question Single Display with Animated Transitions */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-3.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Question {currentIndex + 1} of {totalQuestions}</span>
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        flagged.has(currentQuestion.id)
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/50'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${flagged.has(currentQuestion.id) ? 'fill-white text-white' : ''}`} />
                      <span>{flagged.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag Question'}</span>
                    </motion.button>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
                    {currentQuestion.questionText}
                  </h3>

                  {/* Animated & Colorful Options List */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((option, optIdx) => {
                      const isSelected = answers[currentQuestion.id] === optIdx;
                      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                      return (
                        <motion.button
                          key={optIdx}
                          type="button"
                          id={`option-${currentQuestion.id}-${optIdx}`}
                          whileHover={{ scale: 1.012, y: -2 }}
                          whileTap={{ scale: 0.985 }}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: optIdx * 0.05, duration: 0.22, ease: "easeOut" }}
                          onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className={`w-full group relative flex items-center p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-indigo-600 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/50 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                              : 'border-slate-200/90 bg-white hover:border-indigo-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50/30 hover:shadow-md hover:shadow-indigo-500/5'
                          }`}
                        >
                          {/* Option badge */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold mr-4 shrink-0 transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/80 group-hover:bg-indigo-100 group-hover:text-indigo-700 group-hover:border-indigo-300'
                            }`}
                          >
                            {optionLetters[optIdx] || optIdx + 1}
                          </div>

                          {/* Option text */}
                          <span
                            className={`flex-1 text-sm sm:text-base leading-relaxed transition-colors ${
                              isSelected ? 'font-bold text-slate-900' : 'text-slate-700 group-hover:text-slate-900 font-medium'
                            }`}
                          >
                            {option}
                          </span>

                          {/* Interactive Selection Check Indicator */}
                          <div className="ml-3 shrink-0">
                            {isSelected ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </motion.div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-indigo-300 transition-colors" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <motion.button
                  whileHover={{ scale: currentIndex === 0 ? 1 : 1.03 }}
                  whileTap={{ scale: currentIndex === 0 ? 1 : 0.97 }}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center space-x-2 px-4 sm:px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </motion.button>

                <div className="flex items-center space-x-3">
                  {currentIndex < totalQuestions - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="flex items-center space-x-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleProceedToSubmit}
                      className="flex items-center space-x-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/25 transition cursor-pointer"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Clean Scrollable List View Mode with Enhanced Styles */
            <div className="space-y-6">
              {quiz.questions.map((question, qIdx) => {
                const isFlagged = flagged.has(question.id);
                const currentAnswer = answers[question.id];
                const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <motion.div
                    key={question.id}
                    id={`list-question-${question.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qIdx * 0.04, duration: 0.25 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Question {qIdx + 1} of {totalQuestions} • {question.marks} Marks
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleFlag(question.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 font-semibold transition-all cursor-pointer ${
                          isFlagged
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/25'
                            : 'text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-white text-white' : ''}`} />
                        <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
                      </motion.button>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {question.questionText}
                    </h4>

                    <div className="space-y-2.5 pt-1">
                      {question.options.map((opt, optIdx) => {
                        const isSelected = currentAnswer === optIdx;

                        return (
                          <motion.div
                            key={optIdx}
                            whileHover={{ scale: 1.01, x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectOption(question.id, optIdx)}
                            className={`group flex items-center p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-indigo-600 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/50 shadow-xs ring-1 ring-indigo-500/30'
                                : 'border-slate-200/90 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mr-3 font-extrabold transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200/80 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                              }`}
                            >
                              {optionLetters[optIdx] || optIdx + 1}
                            </span>
                            <span className={`flex-1 text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>
                              {opt}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-2 shrink-0" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              <div className="text-center py-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleProceedToSubmit}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                >
                  Review & Submit All Answers
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Question Palette (Span 1 on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 sticky top-36">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Question Navigator</span>
              <span className="text-[11px] font-normal text-slate-400">{answeredCount}/{totalQuestions}</span>
            </h4>

            {/* Quick Palette Chips */}
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flagged.has(q.id);
                const isCurrent = viewMode === 'single' && currentIndex === idx;

                return (
                  <motion.button
                    key={q.id}
                    id={`nav-chip-${idx}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      setViewMode('single');
                      setCurrentIndex(idx);
                    }}
                    className={`relative h-11 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all border cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-600 text-indigo-700 bg-indigo-50/90 shadow-xs'
                        : isAnswered
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-xs shadow-indigo-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-xs" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md shadow-2xs" />
                <span className="font-medium text-slate-700">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded-md" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 bg-white border border-amber-400 rounded-md relative">
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                </span>
                <span>Flagged for Review ({flagged.size})</span>
              </div>
            </div>

            {/* Submit CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="btn-sidebar-submit"
              onClick={handleProceedToSubmit}
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              Finish & Evaluate
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission with Smooth Animation */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5"
            >
              <div className="flex items-center space-x-3 text-amber-600">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Quiz Submission</h3>
                  <p className="text-xs text-slate-500">EduQuiz Portal Automated Grading</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-2.5 text-xs">
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
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  ⚠️ Notice: You still have {unansweredCount} unanswered questions. Once submitted, answers cannot be edited.
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Back to Questions
                </button>
                <button
                  type="button"
                  id="btn-confirm-final-submit"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
