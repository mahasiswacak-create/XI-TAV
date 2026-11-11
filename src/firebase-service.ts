import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  limit
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "fluted-tenure-63kqt",
  appId: "1:938001708098:web:1e4716830cb0b0706de9db",
  apiKey: "AIzaSyB2aLPGIkqavP9ma-puBCsfdFcp0V4oRbs",
  authDomain: "fluted-tenure-63kqt.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-618ddaa0-9929-4091-b595-20edb0fbef5a",
  storageBucket: "fluted-tenure-63kqt.firebasestorage.app",
  messagingSenderId: "938001708098"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface SubmissionRecord {
  id: string;
  studentName: string;
  className: string;
  group?: string;
  kind: 'lkpd' | 'quiz' | 'final' | 'backup';
  submittedAt: number;
  quizScore?: number | null;
  letter?: string;
  answers?: Record<string, string>;
  poll?: string;
  games?: Record<string, boolean>;
  arcade?: any;
  checklist?: Record<string, boolean>;
  clientTime?: string;
}

/**
 * Save student submission directly into Firestore (no Google Apps Script needed)
 */
export async function saveSubmissionToFirestore(p: any): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const rawId = p.submissionId || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Clean id to match Firestore rules ^[a-zA-Z0-9_\-]+$
    const cleanId = rawId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 100);
    const subRef = doc(db, 'submissions', cleanId);

    const data: SubmissionRecord = {
      id: cleanId,
      studentName: String(p.identity?.name || 'Anonim').slice(0, 100),
      className: String(p.identity?.className || 'XI TAV').slice(0, 50),
      group: String(p.identity?.group || '').slice(0, 20),
      kind: p.kind || 'lkpd',
      submittedAt: Date.now(),
      quizScore: p.quiz?.score !== undefined ? Number(p.quiz.score) : null,
      letter: String(p.letter || '').slice(0, 8000),
      answers: p.answers || {},
      poll: String(p.poll || ''),
      games: p.games || {},
      arcade: p.arcade || {},
      checklist: p.checklist || {},
      clientTime: p.clientTime || new Date().toISOString()
    };

    await setDoc(subRef, data, { merge: true });
    return { success: true, id: cleanId };
  } catch (err: any) {
    console.error('Firestore submission error:', err);
    return { success: false, id: '', error: err.message || 'Gagal menyimpan ke database' };
  }
}

/**
 * Listen to real-time student submissions for the teacher desk
 */
export function subscribeToSubmissions(
  callback: (submissions: SubmissionRecord[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'submissions');
  const q = query(colRef, limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SubmissionRecord[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as SubmissionRecord;
        items.push({ ...item, id: d.id });
      });
      // Sort newest first
      items.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      callback(items);
    },
    (err) => {
      console.warn('Submissions listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Delete a submission (teacher only)
 */
export async function deleteSubmissionFromFirestore(id: string) {
  try {
    const subRef = doc(db, 'submissions', id);
    await deleteDoc(subRef);
    return true;
  } catch (err) {
    console.error('Failed to delete submission:', err);
    return false;
  }
}

/**
 * Battle Room State Types
 */
export interface BattleGroup {
  id: number;
  name: string;
  pin: string;
  tokenHash: string;
  joined: boolean;
  members: string[];
  turn: number;
  score: number;
}

export interface BattleCurrentAttempt {
  id: string;
  qIndex: number;
  groupId: number;
  respondent: string;
  openEpoch: string;
  acceptedAt: number;
  rebound: boolean;
  answer: any;
  answeredAt: number;
  judged: boolean;
  correct: boolean;
  reason: boolean;
  points: number;
  oral?: boolean;
  oralAnswer?: string;
}

export interface BattleRoomData {
  code: string;
  phase: 'lobby' | 'reading' | 'ready' | 'open' | 'answering' | 'review' | 'resolved' | 'finished';
  qIndex: number;
  readSeconds: number;
  readDeadline: number;
  openEpoch: string;
  answerDeadline: number;
  rebound: boolean;
  current: BattleCurrentAttempt | null;
  tried: number[];
  history: any[];
  groups: BattleGroup[];
  hostToken: string;
  displayToken: string;
  createdAt: number;
  updatedAt: number;
  rev: number;
}

/**
 * Save/update room in Firestore
 */
export async function updateBattleRoom(room: BattleRoomData) {
  const roomRef = doc(db, 'battle_rooms', room.code);
  await setDoc(roomRef, {
    ...room,
    updatedAt: Date.now(),
    rev: (room.rev || 0) + 1
  }, { merge: true });
}

/**
 * Get room from Firestore
 */
export async function getBattleRoom(roomCode: string): Promise<BattleRoomData | null> {
  try {
    const roomRef = doc(db, 'battle_rooms', roomCode);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      return snap.data() as BattleRoomData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching room:', err);
    return null;
  }
}

/**
 * Real-time listener for a battle room
 */
export function subscribeToBattleRoom(
  roomCode: string,
  onUpdate: (room: BattleRoomData | null) => void
) {
  const roomRef = doc(db, 'battle_rooms', roomCode);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as BattleRoomData);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('Battle room listener error:', err);
  });
}
