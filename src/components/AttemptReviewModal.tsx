import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Award,
  Info,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { QuizAttempt } from '../types';
import { api } from '../services/api';

interface AttemptReviewModalProps {
  attemptId: string | null;
  onClose: () => void;
}

export const AttemptReviewModal: React.FC<AttemptReviewModalProps> = ({
  attemptId,
  onClose
}) => {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getAttemptDetails(attemptId)
      .then((res) => {
        if (isMounted) setAttempt(res.attempt);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Could not load attempt details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (!attemptId) return null;

  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
              Candidate Answer Audit Sheet
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {attempt ? attempt.quizTitle : 'Loading assessment details...'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Retrieving submission breakdown from database...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
              {error}
            </div>
          ) : attempt ? (
            <>
              {/* Summary KPIs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Candidate</div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>{attempt.userName}</span>
                    <span className="text-slate-400 text-xs font-normal">({attempt.userEmail})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-xs text-slate-500">Score & Marks</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {attempt.percentage}% ({attempt.score}/{attempt.totalMarks})
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="mt-0.5">
                      {attempt.passed ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {attempt.answers.map((ans, idx) => {
                  const isAnswered = ans.selectedOptionIndex !== null && ans.selectedOptionIndex >= 0;

                  return (
                    <div
                      key={ans.questionId || idx}
                      className={`p-5 rounded-2xl border bg-white ${
                        ans.isCorrect ? 'border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        {ans.isCorrect ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Correct (+{ans.marksAwarded} marks)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>{isAnswered ? 'Incorrect' : 'Skipped'}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                        {ans.questionText || `Question Reference ${ans.questionId}`}
                      </h4>

                      {ans.options && ans.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {ans.options.map((opt, optIdx) => {
                            const isPicked = ans.selectedOptionIndex === optIdx;
                            const isCorrect = ans.correctOptionIndex === optIdx;

                            let style = 'border-slate-200 bg-slate-50/50 text-slate-700';
                            if (isCorrect) {
                              style = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold';
                            } else if (isPicked && !ans.isCorrect) {
                              style = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${style}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                    {letters[optIdx] || optIdx + 1}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-[10px] uppercase font-bold">
                                  {isPicked && <span className="text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">Selected</span>}
                                  {isCorrect && <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Correct Key ✓</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {ans.explanation && (
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700 flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-950">Explanation: </span>
                            <span>{ans.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
