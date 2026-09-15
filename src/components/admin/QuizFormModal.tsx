import React, { useState } from 'react';
import { X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminQuiz } from '../../types';
import { api } from '../../services/api';

interface QuizFormModalProps {
  quiz: AdminQuiz | null; // null means create new
  onClose: () => void;
  onSaved: (quiz: AdminQuiz) => void;
}

export const QuizFormModal: React.FC<QuizFormModalProps> = ({ quiz, onClose, onSaved }) => {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [category, setCategory] = useState(quiz?.category || 'Computer Science');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    quiz?.difficulty || 'Intermediate'
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(quiz?.timeLimitMinutes || 10);
  const [passingPercentage, setPassingPercentage] = useState(quiz?.passingPercentage || 60);
  const [isPublished, setIsPublished] = useState(quiz ? quiz.isPublished : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and description.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (quiz) {
        // Update existing
        const res = await api.updateAdminQuiz(quiz.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          difficulty,
          timeLimitMinutes: Number(timeLimitMinutes),
          passingPercentage: Number(passingPercentage),
          isPublished
        });
        onSaved(res.quiz);
      } else {
        // Create new
        const defaultQuestions = [
          {
            id: `q-${Date.now()}-1`,
            questionText: 'What is the primary function of this module?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOptionIndex: 0,
            explanation: 'Option A provides the optimal approach.',
            marks: 1
          }
        ];
        const res = await api.createAdminQuiz({
          title: title.trim(),
          description: description.trim(),
          category,
          difficulty,
          timeLimitMinutes: Number(timeLimitMinutes),
          passingPercentage: Number(passingPercentage),
          isPublished,
          questions: defaultQuestions
        });
        onSaved(res.quiz);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {quiz ? 'Edit Quiz Parameters' : 'Create New Assessment Quiz'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quiz Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced JavaScript & TypeScript Patterns"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of topics, skills evaluated, and criteria..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Passing Cutoff (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="quiz-publish-chk"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm"
            />
            <label htmlFor="quiz-publish-chk" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Publish Quiz (Visible to candidates for examination)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : quiz ? 'Save Changes' : 'Create Quiz'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
