import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  Search,
  ArrowUpDown,
  BookOpen,
  Filter,
  Mail
} from 'lucide-react';
import { QuizAttempt } from '../types';

interface AttemptHistoryProps {
  attempts: QuizAttempt[];
  onSelectAttemptForReview: (attemptId: string) => void;
  onGoToQuizzes: () => void;
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
  attempts,
  onSelectAttemptForReview,
  onGoToQuizzes
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttempts = attempts.filter((att) => {
    const matchFilter =
      filter === 'all' ? true : filter === 'passed' ? att.passed : !att.passed;
    const matchSearch =
      att.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Academic Performance Record</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Assessment History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your historical attempts, scores, timestamps, and question-by-question answer breakdowns.
          </p>
        </div>

        <button
          onClick={onGoToQuizzes}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Available Quizzes</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search quiz title or attempt ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 self-stretch sm:self-auto bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({attempts.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-3 py-1 rounded-md transition ${
              filter === 'passed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Passed ({attempts.filter((a) => a.passed).length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded-md transition ${
              filter === 'failed' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Retake ({attempts.filter((a) => !a.passed).length})
          </button>
        </div>
      </div>

      {/* Attempts Table / List */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No assessment records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {attempts.length === 0
              ? "You haven't attempted any assessments yet. Choose a quiz from the dashboard to get started!"
              : 'No attempts matched the current filter conditions.'}
          </p>
          {attempts.length === 0 && (
            <button
              onClick={onGoToQuizzes}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition"
            >
              Start First Assessment
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Assessment Details</th>
                  <th className="px-4 py-3.5">Score / Marks</th>
                  <th className="px-4 py-3.5">Result Status</th>
                  <th className="px-4 py-3.5">Time Spent</th>
                  <th className="px-4 py-3.5">Submission Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{attempt.quizTitle}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>ID: {attempt.id}</span>
                        {attempt.emailNotification?.sentToUser && (
                          <span className="inline-flex items-center text-emerald-600 font-sans gap-0.5">
                            <Mail className="w-3 h-3" />
                            <span>Email Notified</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-900">{attempt.percentage}%</div>
                      <div className="text-[11px] text-slate-500">
                        {attempt.score} / {attempt.totalMarks} Marks
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {attempt.passed ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>NEEDS RETAKE</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDuration(attempt.timeSpentSeconds)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <div className="flex items-center space-x-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => onSelectAttemptForReview(attempt.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-lg border border-slate-200 hover:border-blue-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
