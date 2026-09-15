import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Clock, Shield } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface ContactAdminProps {
  currentUser: User | null;
  onRequireAuth: () => void;
  onGoToQuizzes: () => void;
}

export const ContactAdmin: React.FC<ContactAdminProps> = ({
  currentUser,
  onRequireAuth,
  onGoToQuizzes
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string; previewUrl?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!subject.trim() || !message.trim()) {
      alert('Please fill out both the subject and message.');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await api.contactAdmin({
        subject: subject.trim(),
        message: message.trim()
      });

      setResult({
        success: true,
        text: res.message || 'Your inquiry was sent to the portal administrator.',
        previewUrl: res.previewUrl
      });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setResult({
        success: false,
        text: err.message || 'Failed to dispatch email. Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Mail className="w-3.5 h-3.5" />
              <span>Direct Candidate Support</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Email Administrator
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Have questions about your quiz score, need an assessment retake reset, or encountering technical issues? Send a direct message to the portal administrator.
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Contact Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {!currentUser ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">Sign in to contact administrator</h3>
              <p className="text-sm text-slate-500">You must be logged in as a candidate to send an inquiry.</p>
            </div>
            <button
              id="contact-admin-signin-btn"
              onClick={onRequireAuth}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow transition-all"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {result && (
              <div
                className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                  result.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <p className="font-semibold">{result.text}</p>
                  {result.previewUrl && (
                    <p className="text-xs">
                      <a
                        href={result.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Click here to view the simulated SMTP email dispatch preview &rarr;
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Your Registered Email
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inquiry-subject" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Inquiry Subject *
              </label>
              <input
                id="inquiry-subject"
                type="text"
                required
                placeholder="e.g. Assessment Score Clarification / Request Retake"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm text-slate-800 transition-all"
              />
            </div>

            <div>
              <label htmlFor="inquiry-message" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Message to Administrator *
              </label>
              <textarea
                id="inquiry-message"
                rows={5}
                required
                placeholder="Write your message here. Provide any details regarding the quiz or issue you are experiencing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm text-slate-800 transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onGoToQuizzes}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back to Quizzes
              </button>

              <button
                id="submit-inquiry-btn"
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Dispatching...' : 'Send Message to Admin'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
