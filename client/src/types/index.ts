// ============================================================
// Shared TypeScript types for the StudyHub client application
// ============================================================

// --- User ---
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

// --- Study ---
export interface StudyMember {
  user: User;
  role: 'owner' | 'member';
}

export interface Study {
  id: string;
  name: string;
  inviteCode: string;
  currentGoal: string;
  currentWeek: number;
  members: StudyMember[];
  todos?: Todo[];
  schedules?: Schedule[];
  messages?: Message[];
  createdBy?: Pick<User, 'id' | 'name' | 'email'>;
  _count?: {
    todos: number;
    messages: number;
    schedules: number;
  };
}

// --- Todo ---
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

// --- Schedule ---
export type AttendanceStatus = 'attending' | 'not-attending' | 'pending';

export interface Attendance {
  id: string;
  status: AttendanceStatus;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendances: Attendance[];
}

// --- Message ---
export interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

// --- History ---
export interface HistoryTodo {
  id: string;
  title: string;
  completed: boolean;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface WeeklyHistory {
  id: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  goal: string;
  todos: HistoryTodo[];
}

// --- API Responses ---
export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface StudiesResponse {
  studies: Study[];
}

export interface StudyResponse {
  study: Study;
}

export interface TodosResponse {
  todos: Todo[];
}

export interface TodoResponse {
  todo: Todo;
}

export interface SchedulesResponse {
  schedules: Schedule[];
}

export interface ScheduleResponse {
  schedule: Schedule;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface MessageResponse {
  message: Message;
}

export interface HistoryListResponse {
  history: WeeklyHistory[];
}

export interface HistoryResponse {
  history: WeeklyHistory;
}

export interface ProgressResponse {
  total: number;
  completed: number;
  progress: number;
}

// --- Schedule Form ---
export interface ScheduleFormData {
  title: string;
  date: string;
  time: string;
  location: string;
}
