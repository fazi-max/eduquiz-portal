import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { QuizResult } from '../types';

interface ResultModalProps {
  result: QuizResult;
  onRetake: () => void;
  onGoHome: () => void;
  onViewEmails: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onRetake,
  onGoHome,
  onViewEmails
}) => {
  useEffect(() => {
    // Fire celebratory confetti if candidate passed the assessment!
    if (result.passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result.passed]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Primary Score Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl border shadow-xl p-8 sm:p-10 text-center ${
        result.passed
          ? 'bg-gradient-to-b from-emerald-900/90 via-slate-900 to-slate-950 border-emerald-500/40 text-white'
          : 'bg-gradient-to-b from-amber-900/90 via-slate-900 to-slate-950 border-amber-500/40 text-white'
      }`}>
        {/* Status Pill */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-white/10 text-white backdrop-blur-xs">
          {result.passed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assessment Passed Successfully</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Passing Threshold Not Reached</span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          {result.quizTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
          {result.passed
            ? 'Outstanding performance! Your responses have been validated against our server answer keys.'
            : `You scored ${result.percentage}%. The passing threshold is set at ${result.passingPercentage}%. Keep practicing and retake whenever ready.`}
        </p>

        {/* Big Percentage Badge */}
        <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-white/20 bg-white/5 backdrop-blur-md shadow-2xl mb-6">
          <span className="text-4xl font-black tracking-tight text-white">{result.percentage}%</span>
          <span className="text-xs text-slate-300 font-semibold mt-0.5">
            {result.score} / {result.totalMarks} Marks
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-xl">
            <div className="text-xs text-slate-300 font-medium">Correct Answers</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{result.correctAnswersCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-xl">
            <div className="text-xs text-slate-300 font-medium">Incorrect Answers</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{result.incorrectAnswersCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-xl">
            <div className="text-xs text-slate-300 font-medium">Unanswered</div>
            <div className="text-xl font-bold text-slate-300 mt-1">{result.unansweredCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-xl">
            <div className="text-xs text-slate-300 font-medium">Time Taken</div>
            <div className="text-xl font-bold text-white mt-1">{formatDuration(result.timeSpentSeconds)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            id="btn-retake-quiz"
            onClick={onRetake}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-bold shadow-lg hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Assessment</span>
          </button>
          <button
            id="btn-go-dashboard"
            onClick={onGoHome}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Automated Nodemailer Email Notification Banner */}
      <div className="bg-white rounded-2xl border border-blue-200 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">Automated SMTP Score Dispatch</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase">
                Dispatched
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              A detailed score report was generated and dispatched to your registered address and copied to the platform administrator.
            </p>
          </div>
        </div>

        <button
          onClick={onViewEmails}
          className="shrink-0 flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition"
        >
          <span>View Email in Center</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comprehensive Answer Review Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Detailed Question Review & Explanations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your answers, correct answers, and academic explanations for each topic.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {result.answers.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-6">
          {result.answers.map((item, idx) => {
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const isAnswered = item.selectedOptionIndex !== null && item.selectedOptionIndex >= 0;

            return (
              <div
                key={item.questionId}
                className={`p-5 rounded-2xl border transition-all ${
                  item.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isAnswered
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Question {idx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">
                      {item.marksAwarded} / {item.maxMarks} Marks
                    </span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Correct</span>
                      </span>
                    ) : isAnswered ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3" />
                        <span>Incorrect</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        <span>Unanswered</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-sm font-bold text-slate-900 leading-snug mb-4">
                  {item.questionText}
                </h4>

                {/* Options Breakdown */}
                <div className="space-y-2 mb-4">
                  {item.options.map((opt, optIdx) => {
                    const isStudentPick = item.selectedOptionIndex === optIdx;
                    const isCorrectAnswer = item.correctOptionIndex === optIdx;

                    let optStyle = 'border-slate-200 bg-white text-slate-700';
                    if (isCorrectAnswer) {
                      optStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                    } else if (isStudentPick && !item.isCorrect) {
                      optStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs leading-relaxed ${optStyle}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCorrectAnswer
                                ? 'bg-emerald-600 text-white'
                                : isStudentPick
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letters[optIdx] || optIdx + 1}
                          </span>
                          <span>{opt}</span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {isStudentPick && (
                            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                              Your Pick
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md">
                              Correct Key ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {item.explanation && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700 flex items-start space-x-2.5">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-blue-950">Explanation: </span>
                      <span>{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
