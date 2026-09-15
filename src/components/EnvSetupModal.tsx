import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Database,
  Mail,
  Key,
  Layers,
  Terminal,
  Server,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { mongooseCodeExample } from '../../server/models/mongooseSchemas';

export const EnvSetupModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'env' | 'smtp' | 'mongoose' | 'prisma'>('env');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleEnv = `# ==============================================
# EduQuiz Portal - Production Environment Variables
# ==============================================

# 1. JWT Authentication Secret
JWT_SECRET="eduquiz_super_secret_jwt_key_2026_change_in_production"

# 2. SMTP Email Configuration (Nodemailer)
# Gmail Example: Enable 2-Step Verification and create an "App Password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="notifications@eduquizportal.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM='"EduQuiz Portal" <notifications@eduquizportal.com>'
ADMIN_EMAIL="admin@eduquizportal.com"

# 3. Database Connection URI (Optional: MongoDB via Mongoose)
# Default: File-backed persistent storage in ./data/portal_database.json
MONGODB_URI="mongodb+srv://username:password@cluster0.mongodb.net/eduquiz?retryWrites=true&w=majority"
`;

  const prismaSchemaCode = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  role         String    @default("student")
  createdAt    DateTime  @default(now())
  attempts     Attempt[]
}

model Quiz {
  id                String     @id @default(uuid())
  title             String
  description       String
  category          String
  difficulty        String     @default("Intermediate")
  timeLimitMinutes  Int        @default(10)
  totalMarks        Int        @default(100)
  passingPercentage Float      @default(60.0)
  questions         Question[]
  attempts          Attempt[]
}

model Question {
  id                 String   @id @default(uuid())
  quizId             String
  quiz               Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  questionText       String
  options            String[]
  correctOptionIndex Int
  explanation        String   @default("")
  marks              Int      @default(1)
}

model Attempt {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quizId              String
  quiz                Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  score               Int
  totalMarks          Int
  percentage          Float
  passed              Boolean
  correctAnswersCount Int
  incorrectAnswersCount Int
  unansweredCount     Int
  timeSpentSeconds    Int
  submittedAt         DateTime @default(now())
}`;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <FileCode2 className="w-4 h-4" />
          <span>Architecture & Deliverables</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Environment Variables & Database Schema Models
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
          Comprehensive step-by-step documentation for deploying EduQuiz Portal to production, including JWT security, Nodemailer SMTP configurations, and Mongoose / Prisma schema models.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('env')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'env' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-blue-600" />
          <span>1. Environment Variables (.env)</span>
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'smtp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-emerald-600" />
          <span>2. SMTP Setup Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('mongoose')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'mongoose' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-600" />
          <span>3. MongoDB (Mongoose) Schemas</span>
        </button>

        <button
          onClick={() => setActiveTab('prisma')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'prisma' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>4. PostgreSQL (Prisma) Schema</span>
        </button>
      </div>

      {/* Tab 1: .env File Configuration */}
      {activeTab === 'env' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step-by-Step .env Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env</code> file in the project root directory.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(sampleEnv, 'env')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
              >
                {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'env' ? 'Copied!' : 'Copy .env Content'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {sampleEnv}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                <div className="font-bold text-blue-900 mb-1">JWT Security</div>
                <p className="text-slate-600 leading-relaxed">
                  Generated tokens are signed using HMAC-SHA256. Passwords are hashed with salt rounds = 10 via bcryptjs before database insertion.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                <div className="font-bold text-emerald-900 mb-1">Dual Email Dispatch</div>
                <p className="text-slate-600 leading-relaxed">
                  On quiz submission, Nodemailer sends candidate score summary AND copies the administrator at <code className="font-mono">ADMIN_EMAIL</code>.
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                <div className="font-bold text-amber-900 mb-1">Zero-Config Fallback</div>
                <p className="text-slate-600 leading-relaxed">
                  When SMTP or MongoDB are omitted, EduQuiz automatically uses local embedded file storage and in-app email logging without crashing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SMTP Providers Guide */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                SMTP Provider Setup Instructions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your Nodemailer transport with your preferred email provider.
              </p>
            </div>

            <div className="space-y-4">
              {/* Gmail Guide */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">G</span>
                  <span>Option A: Google Gmail (App Passwords)</span>
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                  <li>Log in to your Google Account and navigate to <strong>Security</strong>.</li>
                  <li>Enable <strong>2-Step Verification</strong> if not already enabled.</li>
                  <li>Under 2-Step Verification, select <strong>App Passwords</strong>.</li>
                  <li>Generate an App Password for &quot;Mail&quot; and copy the 16-character key.</li>
                  <li>Set <code className="font-mono text-blue-600">SMTP_HOST=&quot;smtp.gmail.com&quot;</code>, <code className="font-mono text-blue-600">SMTP_PORT=&quot;587&quot;</code>, <code className="font-mono text-blue-600">SMTP_USER=&quot;your-gmail@gmail.com&quot;</code>, and <code className="font-mono text-blue-600">SMTP_PASS=&quot;your-16-char-key&quot;</code>.</li>
                </ol>
              </div>

              {/* Resend / SendGrid Guide */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">R</span>
                  <span>Option B: Resend / SendGrid / Brevo</span>
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                  <li>Create a free API Key on <strong>Resend</strong> (<code className="font-mono">smtp.resend.com</code>, Port 465 or 587) or <strong>SendGrid</strong> (<code className="font-mono">smtp.sendgrid.net</code>).</li>
                  <li>For Resend: Set <code className="font-mono text-blue-600">SMTP_USER=&quot;resend&quot;</code> and <code className="font-mono text-blue-600">SMTP_PASS=&quot;re_your_api_key&quot;</code>.</li>
                  <li>For SendGrid: Set <code className="font-mono text-blue-600">SMTP_USER=&quot;apikey&quot;</code> and <code className="font-mono text-blue-600">SMTP_PASS=&quot;SG.your_key&quot;</code>.</li>
                </ol>
              </div>

              {/* Ethereal Sandbox */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">E</span>
                  <span>Option C: Ethereal (Built-in Zero-Config Sandbox)</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  EduQuiz Portal automatically initializes an Ethereal SMTP test transporter when credentials are not supplied. All dispatched emails can be inspected inside the <strong>Email Center</strong> tab with complete HTML rendering!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mongoose Schemas */}
      {activeTab === 'mongoose' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  MongoDB Mongoose Database Schema Models
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Located in <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">server/models/mongooseSchemas.ts</code>
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(mongooseCodeExample, 'mongoose')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
              >
                {copiedKey === 'mongoose' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'mongoose' ? 'Copied!' : 'Copy Schemas'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
              {mongooseCodeExample}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Prisma Schema */}
      {activeTab === 'prisma' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  PostgreSQL Prisma Database Schema Models
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Located in <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">server/models/prismaSchema.prisma</code>
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(prismaSchemaCode, 'prisma')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
              >
                {copiedKey === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'prisma' ? 'Copied!' : 'Copy Prisma Schema'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
              {prismaSchemaCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
