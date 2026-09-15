import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Search,
  RefreshCw,
  Eye,
  BookOpen,
  Sliders,
  UserX,
  UserCheck,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  ArrowUpDown,
  Filter,
  Inbox
} from 'lucide-react';
import { QuizAttempt, AdminUserListItem, AdminQuiz, AdminMessage, EmailLog } from '../types';
import { api } from '../services/api';
import { QuizQuestionsEditorModal } from './admin/QuizQuestionsEditorModal';
import { QuizFormModal } from './admin/QuizFormModal';

interface AdminBoardProps {
  onSelectAttempt: (attemptId: string) => void;
}

export const AdminBoard: React.FC<AdminBoardProps> = ({ onSelectAttempt }) => {
  const [subTab, setSubTab] = useState<'submissions' | 'quizzes' | 'users' | 'messages' | 'emails'>('submissions');
  
  // Data States
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'passed' | 'failed'>('all');

  // Modals
  const [editingQuestionsQuiz, setEditingQuestionsQuiz] = useState<AdminQuiz | null>(null);
  const [editingFormQuiz, setEditingFormQuiz] = useState<AdminQuiz | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Fetch all admin data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [attemptsRes, usersRes, quizzesRes, messagesRes, emailsRes] = await Promise.all([
        api.getAllAttempts(),
        api.getAdminUsers(),
        api.getAdminQuizzes(),
        api.getAdminMessages(),
        api.getEmailLogs()
      ]);
      setAttempts(attemptsRes.attempts || []);
      setUsers(usersRes.users || []);
      setQuizzes(quizzesRes.quizzes || []);
      setMessages(messagesRes.messages || []);
      setEmailLogs(emailsRes.logs || []);
    } catch (err: any) {
      console.error('Failed fetching admin data:', err);
      showToast('Error loading admin records: ' + (err.message || 'Check connection'), true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Action: Toggle Block Candidate
  const handleToggleBlock = async (user: AdminUserListItem) => {
    try {
      const newStatus = !user.isBlocked;
      await api.toggleBlockUser(user.id, newStatus);
      showToast(`User ${user.name} has been ${newStatus ? 'blocked and session terminated' : 'unblocked'}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isBlocked: newStatus } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update user block status.', true);
    }
  };

  // Action: Force Logout User
  const handleForceLogout = async (user: AdminUserListItem) => {
    try {
      await api.forceLogoutUser(user.id);
      showToast(`Active token revoked for ${user.name}. They will be asked to sign in again.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, forceLoggedOutAt: new Date().toISOString() } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to force logout user.', true);
    }
  };

  // Action: Delete Quiz
  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    try {
      await api.deleteAdminQuiz(quizId);
      showToast(`Quiz "${quizTitle}" was deleted.`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete quiz.', true);
    }
  };

  // Filtered Submissions
  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (resultFilter === 'passed') return a.passed;
    if (resultFilter === 'failed') return !a.passed;
    return true;
  });

  // KPI Calculations
  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const failedCount = totalAttempts - passedCount;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-2 ${
            feedback.isError ? 'bg-rose-900 text-rose-100 border-rose-700' : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>EduQuiz Portal Central Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full management of quizzes, question sequences, candidate marks/status, user access, and incoming inquiries.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Attempts</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalAttempts}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across {quizzes.length} Quizzes</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Passing Candidates</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{passedCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{passRate}% Pass Rate</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Failing Candidates</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{failedCount}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">{100 - passRate}% Fail Rate</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Registered Users</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{users.filter((u) => u.isBlocked).length} Blocked</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            subTab === 'submissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Marks & Evaluation ({attempts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            subTab === 'quizzes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Quizzes & Rearrange ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            subTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Users & Control ({users.length})</span>
        </button>

        <button
          onClick={() => setSubTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            subTab === 'messages'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Student Inquiries ({messages.length})</span>
        </button>

        <button
          onClick={() => setSubTab('emails')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            subTab === 'emails'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Logs ({emailLogs.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. SUBMISSIONS & MARKS (PASS / FAIL CONDITION AUDIT)         */}
      {/* ============================================================ */}
      {subTab === 'submissions' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Pass / Fail Filters */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Condition:
              </span>
              <button
                onClick={() => setResultFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  resultFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({attempts.length})
              </button>
              <button
                onClick={() => setResultFilter('passed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  resultFilter === 'passed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Passed ({passedCount})
              </button>
              <button
                onClick={() => setResultFilter('failed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  resultFilter === 'failed'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                Failed ({failedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, email, or quiz..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Quiz Assessment</th>
                  <th className="px-5 py-3">Score / Total Marks</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Time Spent</th>
                  <th className="px-5 py-3">Submitted At</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No assessment submissions match the selected condition.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{att.userName}</div>
                        <div className="text-[11px] text-slate-400">{att.userEmail}</div>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {att.quizTitle}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">{att.score}</span>
                        <span className="text-slate-400"> / {att.totalMarks} marks</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-extrabold ${
                              att.passed ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {att.percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Cutoff: {att.passingPercentage}%)
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {att.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            FAILED
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(att.submittedAt).toLocaleDateString()} {new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onSelectAttempt(att.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. QUIZZES MANAGEMENT & QUESTION REARRANGING                */}
      {/* ============================================================ */}
      {subTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Quiz & Curriculum Repository</h3>
              <p className="text-xs text-slate-500">
                Create new assessments, configure passing cutoffs, or rearrange the sequential question order.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingQuiz(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Quiz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                          {q.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {q.difficulty}
                        </span>
                        {!q.isPublished && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{q.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Questions</div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {q.questions?.length || 0}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Limit</div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {q.timeLimitMinutes}m
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Cutoff</div>
                      <div className="text-sm font-extrabold text-emerald-600 mt-0.5">
                        {q.passingPercentage}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => setEditingQuestionsQuiz(q)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Rearrange & Edit Questions</span>
                  </button>

                  <button
                    onClick={() => setEditingFormQuiz(q)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                    title="Edit Quiz Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(q.id, q.title)}
                    className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CANDIDATE USERS & ACCESS CONTROL (BLOCK / FORCE LOGOUT)   */}
      {/* ============================================================ */}
      {subTab === 'users' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Registered Candidates & Security Controls
              </h3>
              <p className="text-xs text-slate-500">
                Empowered administrator privileges to revoke user credentials, terminate active sessions, or block access.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Users: {users.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Candidate Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Quizzes Attempted</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3">Member Since</th>
                  <th className="px-5 py-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {u.name}
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {u.email}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {u.attemptsCount} attempts
                    </td>

                    <td className="px-5 py-3.5">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <UserX className="w-3 h-3" />
                          SUSPENDED / BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          ACTIVE
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'admin' ? (
                        <div className="inline-flex items-center gap-2">
                          {/* Force Logout */}
                          <button
                            onClick={() => handleForceLogout(u)}
                            title="Force Logout / Revoke Active Session"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition"
                          >
                            <LogOut className="w-3.5 h-3.5 text-slate-500" />
                            <span>Force Logout</span>
                          </button>

                          {/* Block / Unblock */}
                          <button
                            onClick={() => handleToggleBlock(u)}
                            title={u.isBlocked ? 'Unblock User' : 'Block / Suspend User'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold rounded-lg transition ${
                              u.isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.isBlocked ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Protected Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. STUDENT INQUIRIES / CONTACT MESSAGES                      */}
      {/* ============================================================ */}
      {subTab === 'messages' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Direct Candidate Support Inquiries
              </h3>
              <p className="text-xs text-slate-500">
                Messages dispatched by candidates via the "Email Administrator" portal feature.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{messages.length} inquiries</span>
          </div>

          <div className="divide-y divide-slate-100">
            {messages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No student inquiries have been received yet.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-5 space-y-2 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{m.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        Inquiry
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    From: <strong className="text-slate-700">{m.senderName}</strong> &lt;{m.senderEmail}&gt;
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-800 font-medium whitespace-pre-wrap mt-2">
                    {m.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. EMAIL DISPATCH AUDIT LOGS                                 */}
      {/* ============================================================ */}
      {subTab === 'emails' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                SMTP Dispatch Audit Logs
              </h3>
              <p className="text-xs text-slate-500">
                Audit trail of all automated result scorecards and candidate notification emails.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{emailLogs.length} logged emails</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dispatched Timestamp</th>
                  <th className="px-5 py-3 text-right">Ethereal Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No email dispatches recorded yet.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {log.recipientEmail}
                        <span className="ml-1 text-[10px] text-slate-400">({log.recipientType})</span>
                      </td>

                      <td className="px-5 py-3 font-medium text-slate-900">
                        {log.subject}
                      </td>

                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {log.previewUrl ? (
                          <a
                            href={log.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline"
                          >
                            View Email &rarr;
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Arrangement Modal */}
      {editingQuestionsQuiz && (
        <QuizQuestionsEditorModal
          quiz={editingQuestionsQuiz}
          onClose={() => setEditingQuestionsQuiz(null)}
          onUpdated={(updated) => {
            setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
            setEditingQuestionsQuiz(null);
            showToast('Quiz questions updated successfully.');
          }}
        />
      )}

      {/* Quiz Form (Edit / Create) Modal */}
      {(editingFormQuiz || isCreatingQuiz) && (
        <QuizFormModal
          quiz={editingFormQuiz}
          onClose={() => {
            setEditingFormQuiz(null);
            setIsCreatingQuiz(false);
          }}
          onSaved={(saved) => {
            if (editingFormQuiz) {
              setQuizzes((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
              showToast('Quiz updated successfully.');
            } else {
              setQuizzes((prev) => [saved, ...prev]);
              showToast('New quiz created successfully.');
            }
            setEditingFormQuiz(null);
            setIsCreatingQuiz(false);
          }}
        />
      )}
    </div>
  );
};
