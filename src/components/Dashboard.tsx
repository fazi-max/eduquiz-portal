import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { QuizListItem, QuizAttempt, User } from '../types';

interface DashboardProps {
  quizzes: QuizListItem[];
  userAttempts: QuizAttempt[];
  currentUser: User | null;
  onSelectQuiz: (quizId: string) => void;
  onRequireAuth: () => void;
  onViewHistory: () => void;
  onGoToAdmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  quizzes,
  userAttempts,
  currentUser,
  onSelectQuiz,
  onRequireAuth,
  onViewHistory,
  onGoToAdmin
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(quizzes.map((q) => q.category));
    return ['All', ...Array.from(set)];
  }, [quizzes]);

  // Compute user statistics
  const userStats = useMemo(() => {
    if (!currentUser || userAttempts.length === 0) {
      return { attemptsCount: 0, avgScore: 0, passedCount: 0, bestScore: 0 };
    }
    const attemptsCount = userAttempts.length;
    const totalPercentage = userAttempts.reduce((acc, a) => acc + a.percentage, 0);
    const avgScore = Math.round(totalPercentage / attemptsCount);
    const passedCount = userAttempts.filter((a) => a.passed).length;
    const bestScore = Math.max(...userAttempts.map((a) => a.percentage));
    return { attemptsCount, avgScore, passedCount, bestScore };
  }, [currentUser, userAttempts]);

  // Attempt lookup for quick badge on quiz card
  const quizAttemptsMap = useMemo(() => {
    const map = new Map<string, QuizAttempt[]>();
    userAttempts.forEach((a) => {
      const existing = map.get(a.quizId) || [];
      existing.push(a);
      map.set(a.quizId, existing);
    });
    return map;
  }, [userAttempts]);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      const matchQuery =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchDiff && matchQuery;
    });
  }, [quizzes, selectedCategory, selectedDifficulty, searchQuery]);

  const handleStartQuiz = (quizId: string) => {
    if (!currentUser) {
      onRequireAuth();
    } else {
      onSelectQuiz(quizId);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 sm:p-10 shadow-xl border border-slate-700/60">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduQuiz Portal Assessment Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {currentUser ? `Welcome back, ${currentUser.name}` : 'Test Your Knowledge & Validate Skills'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Engage with timed technical assessments, automated instant grading, and instant SMTP score dispatch to both your registered inbox and administrator records.
          </p>

          {!currentUser && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="banner-signin-btn"
                onClick={onRequireAuth}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
              >
                Sign In to Start Taking Quizzes
              </button>
              <span className="text-xs text-slate-400">or use 1-click demo accounts above</span>
            </div>
          )}
        </div>

        {/* Decorative background blur glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      {currentUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{quizzes.length}</div>
              <div className="text-xs font-medium text-slate-500">Available Quizzes</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{userStats.attemptsCount}</div>
              <div className="text-xs font-medium text-slate-500">Completed Attempts</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{userStats.avgScore}%</div>
              <div className="text-xs font-medium text-slate-500">Average Performance</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{userStats.bestScore}%</div>
              <div className="text-xs font-medium text-slate-500">Highest Score</div>
            </div>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        /* Pristine Empty State when no quizzes exist */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Assessments Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            There are currently no active quizzes or tests scheduled. Assessments published by the administrator will appear here.
          </p>
          {currentUser?.role === 'admin' && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>Open Admin Panel to Create Assessments</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="quiz-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assessment titles, categories, or keywords..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Difficulty Dropdown */}
              <div className="flex items-center space-x-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Difficulty:</span>
                <select
                  id="difficulty-filter-select"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Category Pills (rendered only when more than 1 category exists) */}
            {categories.length > 2 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quizzes Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Available Assessments ({filteredQuizzes.length})
              </h2>
              {userAttempts.length > 0 && (
                <button
                  onClick={onViewHistory}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>View Past Attempt History →</span>
                </button>
              )}
            </div>

            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No matching quizzes found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms or clearing the filter.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedDifficulty('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => {
              const attempts = quizAttemptsMap.get(quiz.id) || [];
              const highestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;
              const hasPassed = attempts.some((a) => a.passed);

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Tags / Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {quiz.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          quiz.difficulty === 'Beginner'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : quiz.difficulty === 'Intermediate'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {quiz.difficulty}
                        </span>

                        {highestScore !== null && (
                          <span className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            hasPassed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Best: {highestScore}%</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {quiz.description}
                    </p>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50 rounded-xl text-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{quiz.questionsCount} Qs</div>
                        <div className="text-[10px] text-slate-500 font-medium">Questions</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{quiz.timeLimitMinutes}m</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Time Limit</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{quiz.totalMarks} Pts</div>
                        <div className="text-[10px] text-slate-500 font-medium">Total Marks</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 font-medium">
                      Pass requirement: <strong className="text-slate-700">{quiz.passingPercentage}%</strong>
                    </div>

                    <button
                      id={`btn-start-${quiz.id}`}
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition"
                    >
                      {highestScore !== null ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Assessment</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Assessment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};
