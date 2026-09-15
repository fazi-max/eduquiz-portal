import React from 'react';
import {
  GraduationCap,
  History,
  Mail,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Send
} from 'lucide-react';
import { User, SystemInfo } from '../types';

interface NavbarProps {
  activeTab: 'quizzes' | 'history' | 'admin' | 'contact-admin';
  setActiveTab: (tab: 'quizzes' | 'history' | 'admin' | 'contact-admin') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  systemInfo: SystemInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('quizzes')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">EduQuiz Portal</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Examination & Assessment Engine</p>
            </div>
          </div>

          {/* Navigation Items (Strictly separated per user request) */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* 1. Quizzes (Accessible to all) */}
            <button
              id="nav-tab-quizzes"
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'quizzes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Quizzes</span>
            </button>

            {/* 2. My History (Standard Users & Students) */}
            {currentUser && currentUser.role !== 'admin' && (
              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>My History</span>
              </button>
            )}

            {/* 3. Help / Support inquiry */}
            {currentUser && currentUser.role !== 'admin' && (
              <button
                id="nav-tab-contact-admin"
                onClick={() => setActiveTab('contact-admin')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'contact-admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            )}

            {/* 4. Admin Board (STRICT: Accessible ONLY by authenticated Admin Muhammad Faizan) */}
            {currentUser?.role === 'admin' && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="font-bold">Admin Control Panel</span>
              </button>
            )}
          </nav>

          {/* User Profile & Sign In */}
          <div className="flex items-center space-x-2.5">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center space-x-1.5 justify-end">
                    <span className="text-sm font-medium text-white">{currentUser.name}</span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        STUDENT
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 truncate max-w-[160px]">{currentUser.email}</span>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-open-login"
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              activeTab === 'quizzes' ? 'text-blue-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Quizzes</span>
          </button>

          {currentUser && currentUser.role !== 'admin' && (
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center py-1 px-2 rounded ${
                activeTab === 'history' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <History className="w-4 h-4 mb-0.5" />
              <span>History</span>
            </button>
          )}

          {currentUser && currentUser.role !== 'admin' && (
            <button
              onClick={() => setActiveTab('contact-admin')}
              className={`flex flex-col items-center py-1 px-2 rounded ${
                activeTab === 'contact-admin' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Send className="w-4 h-4 mb-0.5" />
              <span>Support</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center py-1 px-2 rounded ${
                activeTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-0.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
