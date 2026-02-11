import type {
  AuthResponse,
  StudiesResponse,
  StudyResponse,
  TodosResponse,
  TodoResponse,
  SchedulesResponse,
  ScheduleResponse,
  MessagesResponse,
  MessageResponse,
  HistoryListResponse,
  HistoryResponse,
  ProgressResponse,
  AttendanceStatus,
  Attendance,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    let response = await fetch(url, config);

    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        response = await fetch(url, config);
      } else {
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // --- Auth ---

  async signup(email: string, password: string, name: string) {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  async refreshToken(): Promise<boolean> {
    try {
      await this.request<{ message: string }>('/auth/refresh', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser() {
    return this.request<{ user: AuthResponse['user'] }>('/auth/me');
  }

  // --- Studies ---

  async getStudies() {
    return this.request<StudiesResponse>('/studies');
  }

  async createStudy(name: string) {
    return this.request<StudyResponse>('/studies', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getStudy(studyId: string) {
    return this.request<StudyResponse>(`/studies/${studyId}`);
  }

  async updateStudy(studyId: string, data: { currentGoal?: string; name?: string }) {
    return this.request<StudyResponse>(`/studies/${studyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async joinStudy(inviteCode: string) {
    return this.request<StudyResponse>('/studies/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async getProgress(studyId: string) {
    return this.request<ProgressResponse>(`/studies/${studyId}/progress`);
  }

  // --- Todos ---

  async getTodos(studyId: string) {
    return this.request<TodosResponse>(`/todos/${studyId}`);
  }

  async createTodo(studyId: string, title: string) {
    return this.request<TodoResponse>(`/todos/${studyId}`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateTodo(todoId: string, data: { title?: string; completed?: boolean }) {
    return this.request<TodoResponse>(`/todos/${todoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(todoId: string) {
    return this.request<{ message: string }>(`/todos/${todoId}`, { method: 'DELETE' });
  }

  // --- Schedules ---

  async getSchedules(studyId: string) {
    return this.request<SchedulesResponse>(`/schedules/${studyId}`);
  }

  async createSchedule(
    studyId: string,
    data: { title: string; date: string; time: string; location: string },
  ) {
    return this.request<ScheduleResponse>(`/schedules/${studyId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(
    scheduleId: string,
    data: { title?: string; date?: string; time?: string; location?: string },
  ) {
    return this.request<ScheduleResponse>(`/schedules/${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(scheduleId: string) {
    return this.request<{ message: string }>(`/schedules/${scheduleId}`, { method: 'DELETE' });
  }

  async updateAttendance(scheduleId: string, status: AttendanceStatus) {
    return this.request<{ attendance: Attendance }>(`/schedules/${scheduleId}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Messages ---

  async getMessages(studyId: string, limit = 100, offset = 0) {
    return this.request<MessagesResponse>(
      `/messages/${studyId}?limit=${limit}&offset=${offset}`,
    );
  }

  async sendMessage(studyId: string, content: string) {
    return this.request<MessageResponse>(`/messages/${studyId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // --- History ---

  async getHistory(studyId: string) {
    return this.request<HistoryListResponse>(`/history/${studyId}`);
  }

  async archiveWeek(studyId: string) {
    return this.request<HistoryResponse>(`/history/${studyId}/archive`, { method: 'POST' });
  }

  async deleteHistory(historyId: string) {
    return this.request<{ message: string }>(`/history/${historyId}`, { method: 'DELETE' });
  }
}

export const api = new APIClient(API_BASE_URL);
