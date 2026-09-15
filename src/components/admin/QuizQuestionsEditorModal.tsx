import React, { useState } from 'react';
import {
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { AdminQuiz, FullQuestion } from '../../types';
import { api } from '../../services/api';

interface QuizQuestionsEditorModalProps {
  quiz: AdminQuiz;
  onClose: () => void;
  onUpdated: (updatedQuiz: AdminQuiz) => void;
}

export const QuizQuestionsEditorModal: React.FC<QuizQuestionsEditorModalProps> = ({
  quiz,
  onClose,
  onUpdated
}) => {
  const [questions, setQuestions] = useState<FullQuestion[]>(
    JSON.parse(JSON.stringify(quiz.questions || []))
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Move question up in order
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...questions];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setQuestions(next);
  };

  // Move question down in order
  const moveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const next = [...questions];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setQuestions(next);
  };

  // Update question text or property
  const updateQuestionField = (index: number, field: keyof FullQuestion, value: any) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    setQuestions(next);
  };

  // Update specific option text
  const updateOptionText = (qIndex: number, optIndex: number, val: string) => {
    const next = [...questions];
    const opts = [...next[qIndex].options];
    opts[optIndex] = val;
    next[qIndex] = { ...next[qIndex], options: opts };
    setQuestions(next);
  };

  // Add an option to a question
  const addOption = (qIndex: number) => {
    const next = [...questions];
    next[qIndex].options.push(`Option ${next[qIndex].options.length + 1}`);
    setQuestions(next);
  };

  // Remove an option from a question
  const removeOption = (qIndex: number, optIndex: number) => {
    const next = [...questions];
    if (next[qIndex].options.length <= 2) {
      alert('A multiple choice question must contain at least 2 options.');
      return;
    }
    const opts = next[qIndex].options.filter((_, idx) => idx !== optIndex);
    let correct = next[qIndex].correctOptionIndex;
    if (correct >= opts.length) correct = opts.length - 1;
    next[qIndex] = { ...next[qIndex], options: opts, correctOptionIndex: correct };
    setQuestions(next);
  };

  // Add a new question to the quiz
  const addNewQuestion = () => {
    const newQ: FullQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionText: 'Enter new question text here...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: 'Explanation for why Option A is the correct answer.',
      marks: 1
    };
    setQuestions([...questions, newQ]);
  };

  // Remove a question
  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      setFeedback('A quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  // Save updated questions & order
  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.updateAdminQuizQuestions(quiz.id, questions);
      setFeedback({ success: true, message: 'Questions and ordering saved successfully.' });
      onUpdated(res.quiz);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Failed to update questions.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Question Arrangement & Editor
              </span>
              <span className="text-xs text-slate-500">• {questions.length} Questions</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{quiz.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-3 text-sm flex items-center gap-2 ${
              feedback.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-600">
            <span>
              💡 <strong>Rearranging Tip:</strong> Use the <strong>Move Up (↑)</strong> and{' '}
              <strong>Move Down (↓)</strong> buttons on each question card to change the sequential presentation order for students.
            </span>
            <button
              onClick={addNewQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="bg-white rounded-xl border-2 border-slate-200 p-5 space-y-4 hover:border-slate-300 transition-all shadow-xs"
            >
              {/* Question Header & Order Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <span className="font-semibold text-sm text-slate-800">
                    Question #{qIdx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={qIdx === 0}
                    onClick={() => moveUp(qIdx)}
                    title="Move Question Up"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={qIdx === questions.length - 1}
                    onClick={() => moveDown(qIdx)}
                    title="Move Question Down"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Delete Question */}
                  <button
                    type="button"
                    onClick={() => deleteQuestion(qIdx)}
                    title="Delete Question"
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Question Prompt Text
                </label>
                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900"
                />
              </div>

              {/* Marks Allocated */}
              <div className="w-32">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marks Allocated
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={q.marks || 1}
                  onChange={(e) => updateQuestionField(qIdx, 'marks', Number(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600">
                    Options (Select radio button for correct answer)
                  </label>
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-opt-${q.id || qIdx}`}
                        checked={q.correctOptionIndex === optIdx}
                        onChange={() => updateQuestionField(qIdx, 'correctOptionIndex', optIdx)}
                        title="Mark as Correct Answer"
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                        className={`flex-1 px-3 py-1.5 text-sm border rounded-lg focus:border-blue-500 ${
                          q.correctOptionIndex === optIdx
                            ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-medium'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, optIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Answer Explanation (Revealed to student in post-evaluation review)
                </label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestionField(qIdx, 'explanation', e.target.value)}
                  placeholder="Explain why the selected option is correct..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={addNewQuestion}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Question</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Order & Questions'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
