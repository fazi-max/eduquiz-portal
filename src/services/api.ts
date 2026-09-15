import {
  AuthResponse,
  QuizListItem,
  ActiveQuiz,
  QuizResult,
  QuizAttempt,
  EmailLog,
  SystemInfo,
  User,
  AdminUserListItem,
  AdminQuiz,
  AdminMessage,
  FullQuestion
} from '../types';

const TOKEN_KEY = 'eduquiz_auth_token';
const USER_KEY = 'eduquiz_auth_user';

export const tokenStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed saving token', e);
    }
  },
  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed saving user', e);
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed clearing auth storage', e);
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // If token invalid/expired, remove it
    tokenStorage.clear();
  }

  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  async register(name: string, email: string, password: string, role: 'student' | 'admin' = 'student'): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    if (res.token && res.user) {
      tokenStorage.setToken(res.token);
      tokenStorage.setUser(res.user);
    }
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token && res.user) {
      tokenStorage.setToken(res.token);
      tokenStorage.setUser(res.user);
    }
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  logout(): void {
    tokenStorage.clear();
  },

  // Quizzes
  async getQuizzes(): Promise<{ quizzes: QuizListItem[] }> {
    return request<{ quizzes: QuizListItem[] }>('/api/quizzes');
  },

  async getQuiz(id: string): Promise<{ quiz: ActiveQuiz }> {
    return request<{ quiz: ActiveQuiz }>(`/api/quizzes/${id}`);
  },

  async submitQuiz(id: string, answers: Record<string, number>, timeSpentSeconds: number): Promise<{ message: string; result: QuizResult }> {
    return request<{ message: string; result: QuizResult }>(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpentSeconds })
    });
  },

  // Attempts
  async getMyAttempts(): Promise<{ attempts: QuizAttempt[] }> {
    return request<{ attempts: QuizAttempt[] }>('/api/attempts/my');
  },

  async getAttemptDetails(id: string): Promise<{ attempt: QuizAttempt }> {
    return request<{ attempt: QuizAttempt }>(`/api/attempts/${id}`);
  },

  async getAllAttempts(): Promise<{ attempts: QuizAttempt[] }> {
    return request<{ attempts: QuizAttempt[] }>('/api/admin/attempts');
  },

  // Student Inquiries to Admin
  async contactAdmin(data: { subject: string; message: string }): Promise<{ success: boolean; message: string; previewUrl?: string; inquiryId?: string }> {
    return request<{ success: boolean; message: string; previewUrl?: string; inquiryId?: string }>('/api/contact-admin', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Admin User Management
  async getAdminUsers(): Promise<{ users: AdminUserListItem[] }> {
    return request<{ users: AdminUserListItem[] }>('/api/admin/users');
  },

  async toggleBlockUser(userId: string, isBlocked: boolean): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ isBlocked })
    });
  },

  async forceLogoutUser(userId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/force-logout`, {
      method: 'POST'
    });
  },

  // Admin Quiz Management
  async getAdminQuizzes(): Promise<{ quizzes: AdminQuiz[] }> {
    return request<{ quizzes: AdminQuiz[] }>('/api/admin/quizzes');
  },

  async createAdminQuiz(quizData: Partial<AdminQuiz>): Promise<{ success: boolean; quiz: AdminQuiz }> {
    return request<{ success: boolean; quiz: AdminQuiz }>('/api/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
  },

  async updateAdminQuiz(quizId: string, quizData: Partial<AdminQuiz>): Promise<{ success: boolean; quiz: AdminQuiz }> {
    return request<{ success: boolean; quiz: AdminQuiz }>(`/api/admin/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(quizData)
    });
  },

  async updateAdminQuizQuestions(quizId: string, questions: FullQuestion[]): Promise<{ success: boolean; quiz: AdminQuiz }> {
    return request<{ success: boolean; quiz: AdminQuiz }>(`/api/admin/quizzes/${quizId}/questions`, {
      method: 'PUT',
      body: JSON.stringify({ questions })
    });
  },

  async deleteAdminQuiz(quizId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/quizzes/${quizId}`, {
      method: 'DELETE'
    });
  },

  // Admin Messages
  async getAdminMessages(): Promise<{ messages: AdminMessage[] }> {
    return request<{ messages: AdminMessage[] }>('/api/admin/messages');
  },

  // Email Logs & Verification
  async getEmailLogs(): Promise<{ logs: EmailLog[] }> {
    return request<{ logs: EmailLog[] }>('/api/email-logs');
  },

  async sendTestEmail(targetEmail: string): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    return request<{ success: boolean; message: string; previewUrl?: string }>('/api/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ targetEmail })
    });
  },

  // System status
  async getSystemInfo(): Promise<SystemInfo> {
    return request<SystemInfo>('/api/system/info');
  }
};
