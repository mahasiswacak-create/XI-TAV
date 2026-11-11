export type RouteId = 'home' | 'materi' | 'games' | 'battle' | 'lkpd' | 'quiz' | 'final' | 'guru';

export type BackgroundTheme = 'workbench' | 'audio-lab' | 'circuit' | 'noir';

export interface IdentityState {
  name: string;
  className: string;
  group: string;
}

export interface VacancyInfo {
  company: string;
  role: string;
  address: string;
  source: string;
  requirements: string[];
  instruction: string;
  note: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  key: number;
  why: string;
  topic: string;
}

export interface BattleQuestion {
  type: 'choice' | 'text' | 'order';
  category: string;
  prompt: string;
  options?: string[];
  items?: { id: string; label: string }[];
  order?: string[];
  answer: number | string[] | string;
  why: string;
}

export interface GroupState {
  id: number;
  name: string;
  pin: string;
  joined: boolean;
  score: number;
  members: string[];
  turn: number;
}

export interface CurrentAttempt {
  id: string;
  qIndex: number;
  groupId: number;
  respondent: string;
  openEpoch: string;
  acceptedAt: number;
  rebound: boolean;
  answer: any;
  oral?: boolean;
  answeredAt: number;
  judged: boolean;
  correct: boolean;
  reason: boolean;
  points: number;
}

export interface BattleHistoryItem {
  qIndex: number;
  groupId: number;
  respondent: string;
  points: number;
  correct: boolean;
  rebound: boolean;
  answer: string;
}

export type BattlePhase = 'lobby' | 'reading' | 'ready' | 'open' | 'answering' | 'review' | 'resolved' | 'finished';

export interface BattleRoomData {
  id?: string;
  code: string;
  phase: BattlePhase;
  qIndex: number;
  readSeconds: number;
  readDeadline: number;
  answerDeadline: number;
  openEpoch: string;
  rebound: boolean;
  tried: number[];
  groups: GroupState[];
  current: CurrentAttempt | null;
  history: BattleHistoryItem[];
  createdAt: number;
  updatedAt: number;
}

export interface SubmissionData {
  id?: string;
  studentName: string;
  className: string;
  groupId: string;
  kind: 'lkpd' | 'quiz' | 'final' | 'backup';
  answers: Record<string, string>;
  quizScore?: number;
  quizAnswers?: number[];
  letter?: string;
  arcade?: Record<string, any>;
  checks?: Record<number, boolean>;
  submittedAt: number;
}
