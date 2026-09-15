import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Eye,
  Shield,
  Clock,
  User,
  X,
  Sparkles
} from 'lucide-react';
import { EmailLog, SystemInfo } from '../types';
import { api } from '../services/api';

interface EmailLogViewerProps {
  logs: EmailLog[];
  systemInfo: SystemInfo | null;
  onRefresh: () => void;
}

export const EmailLogViewer: React.FC<EmailLogViewerProps> = ({
  logs,
  systemInfo,
  onRefresh
}) => {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false
  });

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) return;

    setTestStatus({ loading: true });
    try {
      const res = await api.sendTestEmail(testEmail);
      setTestStatus({
        loading: false,
        success: res.success,
        message: res.message
      });
      onRefresh();
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Failed to dispatch test verification email.'
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Mail className="w-4 h-4" />
            <span>Nodemailer & SMTP Dispatch Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Email Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Audit outbound transactional emails triggered upon quiz completion. Both student score summaries and admin notifications are logged and rendered here.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* SMTP Environment Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">SMTP Engine Mode</div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${systemInfo?.smtp.configured ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <span>{systemInfo?.smtp.mode || 'Sandbox Mode (In-App Previews)'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Host: {systemInfo?.smtp.host || 'smtp.ethereal.email'} (Port {systemInfo?.smtp.port || 587})
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Administrator CC Recipient</div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <span className="truncate">{systemInfo?.smtp.adminEmail || 'admin@eduquizportal.com'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Receives instant submission notices</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Emails Dispatched</div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {logs.length} Messages
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Full audit trail preserved</div>
        </div>
      </div>

      {/* Quick Test SMTP Tool */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 shrink-0">
            <Send className="w-4 h-4 text-blue-600" />
            <span>Test SMTP Dispatch:</span>
          </div>

          <div className="relative flex-1">
            <input
              type="email"
              placeholder="Enter recipient email address (e.g., your-email@gmail.com)..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={testStatus.loading || !testEmail}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            {testStatus.loading ? 'Sending Test...' : 'Send Verification Ping'}
          </button>
        </form>

        {testStatus.message && (
          <div className={`mt-2 text-xs p-2.5 rounded-lg flex items-center space-x-2 ${
            testStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{testStatus.message}</span>
          </div>
        )}
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Dispatched Email Audit Trail ({logs.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Click &apos;View HTML&apos; to preview exact email layout
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No email dispatches yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Emails are automatically sent when a candidate submits an assessment. Complete any quiz or trigger a test email above!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Recipient & Type</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Dispatched At</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{log.recipientEmail}</div>
                      <div className="text-[11px] mt-0.5">
                        {log.recipientType === 'user' ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                            <User className="w-3 h-3" />
                            <span>Candidate Copy</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                            <Shield className="w-3 h-3" />
                            <span>Admin Notification</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{log.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{log.snippet}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'simulated'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="uppercase">{log.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View HTML</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HTML Email Preview Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  Rendered Email Preview ({selectedLog.recipientType.toUpperCase()})
                </div>
                <h3 className="text-sm font-bold text-white truncate max-w-xl">
                  {selectedLog.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>To:</strong> {selectedLog.recipientEmail}</div>
              <div><strong>Subject:</strong> {selectedLog.subject}</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toUTCString()}</div>
              {selectedLog.previewUrl && (
                <div>
                  <strong>Ethereal Web Preview:</strong>{' '}
                  <a href={selectedLog.previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {selectedLog.previewUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Rendered HTML Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
