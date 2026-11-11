import { doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { BattleRoomData, GroupState, CurrentAttempt, BattlePhase } from '../types';
import { BATTLE_QUESTIONS } from '../data/lessonData';

const LOCAL_STORAGE_KEY_PREFIX = 'al_battle_room_';

function randomCode(len = 6): string {
  const chars = '0123456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function randomPin(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function generateInitialGroups(): GroupState[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Kelompok ${i + 1}`,
    pin: randomPin(),
    joined: false,
    score: 0,
    members: [],
    turn: 0
  }));
}

export function createInitialRoom(code: string, readSeconds = 7): BattleRoomData {
  return {
    code,
    phase: 'lobby',
    qIndex: 0,
    readSeconds: [5, 7, 10].includes(readSeconds) ? readSeconds : 7,
    readDeadline: 0,
    answerDeadline: 0,
    openEpoch: '',
    rebound: false,
    tried: [],
    groups: generateInitialGroups(),
    current: null,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export async function createBattleRoom(readSeconds = 7, customCode?: string): Promise<BattleRoomData> {
  const code = customCode?.trim() || randomCode();
  const roomData = createInitialRoom(code, readSeconds);

  // Save to Firestore
  try {
    const roomRef = doc(db, 'battle_rooms', code);
    await setDoc(roomRef, roomData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `battle_rooms/${code}`);
  }

  // Backup to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(roomData));
  } catch (e) {
    console.warn(e);
  }

  return roomData;
}

export function subscribeToBattleRoom(
  code: string,
  onUpdate: (room: BattleRoomData | null) => void
): () => void {
  const path = `battle_rooms/${code}`;
  const roomRef = doc(db, 'battle_rooms', code);

  let unsubscribe = () => {};

  try {
    unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BattleRoomData;
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(data));
          onUpdate(data);
        } else {
          // Check local fallback
          const local = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + code);
          if (local) {
            try {
              onUpdate(JSON.parse(local));
            } catch {
              onUpdate(null);
            }
          } else {
            onUpdate(null);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        // Fallback to local storage
        const local = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + code);
        if (local) {
          try {
            onUpdate(JSON.parse(local));
          } catch {
            onUpdate(null);
          }
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  return unsubscribe;
}

export async function joinBattleRoom(
  code: string,
  groupId: number,
  pin: string,
  members: string[]
): Promise<{ ok: boolean; message: string }> {
  try {
    const roomRef = doc(db, 'battle_rooms', code);
    const snap = await getDoc(roomRef);
    let room: BattleRoomData;

    if (snap.exists()) {
      room = snap.data() as BattleRoomData;
    } else {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + code);
      if (!local) return { ok: false, message: 'Ruang Battle tidak ditemukan.' };
      room = JSON.parse(local);
    }

    const group = room.groups.find((g) => g.id === groupId);
    if (!group) return { ok: false, message: 'Kelompok tidak valid.' };
    if (group.pin.toUpperCase() !== pin.trim().toUpperCase()) {
      return { ok: false, message: 'PIN kelompok salah. Minta PIN kepada guru.' };
    }

    const cleanMembers = members.map((m) => m.trim().slice(0, 32)).filter(Boolean);
    if (cleanMembers.length !== 4) {
      return { ok: false, message: 'Harap isi 4 nama anggota kelompok.' };
    }

    group.joined = true;
    group.members = cleanMembers;
    room.updatedAt = Date.now();

    await setDoc(roomRef, room, { merge: true });
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(room));

    return { ok: true, message: 'Berhasil bergabung ke kelompok!' };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `battle_rooms/${code}`);
    return { ok: false, message: 'Terjadi kesalahan saat menyambung ke ruang.' };
  }
}

export async function executeTeacherAction(
  code: string,
  action: 'start' | 'open' | 'close' | 'judge' | 'throw' | 'reveal' | 'next' | 'finish' | 'resetTeam',
  payload: any = {}
): Promise<void> {
  const roomRef = doc(db, 'battle_rooms', code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as BattleRoomData;
  const now = Date.now();
  const q = BATTLE_QUESTIONS[room.qIndex];

  if (action === 'start') {
    room.phase = 'reading';
    room.readDeadline = now + room.readSeconds * 1000;
    room.current = null;
    room.answerDeadline = 0;
    room.openEpoch = '';
    room.rebound = false;
    room.tried = [];
  } else if (action === 'open') {
    room.phase = 'open';
    room.openEpoch = Math.random().toString(36).substring(2, 9);
  } else if (action === 'close') {
    room.phase = 'ready';
    room.openEpoch = '';
  } else if (action === 'judge') {
    if (room.current) {
      const c = room.current;
      c.judged = true;
      c.correct = payload.correct === true;
      c.reason = payload.correct === true && !room.rebound && payload.reason === true;
      if (payload.oralAnswer && !c.answeredAt) {
        c.answer = String(payload.oralAnswer).trim();
        c.oral = true;
        c.answeredAt = now;
      }
      c.points = c.correct ? (room.rebound ? 5 : 10 + (c.reason ? 5 : 0)) : 0;

      const g = room.groups.find((x) => x.id === c.groupId);
      if (g) g.score += c.points;

      room.history.push({
        qIndex: room.qIndex,
        groupId: c.groupId,
        respondent: c.respondent,
        points: c.points,
        correct: c.correct,
        rebound: room.rebound,
        answer: String(c.answer || '')
      });

      room.phase = c.correct ? 'resolved' : 'review';
    }
  } else if (action === 'throw') {
    room.current = null;
    room.rebound = true;
    room.phase = 'open';
    room.openEpoch = Math.random().toString(36).substring(2, 9);
  } else if (action === 'reveal') {
    room.phase = 'resolved';
    room.openEpoch = '';
  } else if (action === 'next') {
    if (room.qIndex >= BATTLE_QUESTIONS.length - 1) {
      room.phase = 'finished';
    } else {
      room.qIndex += 1;
      room.phase = 'reading';
      room.readDeadline = now + room.readSeconds * 1000;
      room.current = null;
      room.answerDeadline = 0;
      room.openEpoch = '';
      room.rebound = false;
      room.tried = [];
    }
  } else if (action === 'finish') {
    room.phase = 'finished';
  } else if (action === 'resetTeam') {
    const target = room.groups.find((g) => g.id === payload.groupId);
    if (target) {
      target.pin = randomPin();
      target.joined = false;
      target.members = [];
    }
  }

  room.updatedAt = now;
  await setDoc(roomRef, room);
  localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(room));
}

export async function submitGroupBuzz(
  code: string,
  groupId: number,
  epoch: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const roomRef = doc(db, 'battle_rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return { ok: false, message: 'Ruang tidak ditemukan.' };

    const room = snap.data() as BattleRoomData;
    if (room.phase !== 'open') {
      return { ok: false, message: 'Rebut belum dibuka oleh guru.' };
    }
    if (room.openEpoch !== epoch) {
      return { ok: false, message: 'Jendela rebut sudah kedaluwarsa.' };
    }
    if (room.tried.includes(groupId)) {
      return { ok: false, message: 'Kelompok sudah mendapat kesempatan di soal ini.' };
    }

    const g = room.groups.find((x) => x.id === groupId);
    if (!g) return { ok: false, message: 'Kelompok tidak valid.' };

    const respondent = g.members.length ? g.members[g.turn % g.members.length] : `Anggota ${(g.turn % 4) + 1}`;
    g.turn += 1;
    room.tried.push(groupId);

    const now = Date.now();
    room.current = {
      id: Math.random().toString(36).substring(2, 9),
      qIndex: room.qIndex,
      groupId: g.id,
      respondent,
      openEpoch: epoch,
      acceptedAt: now,
      rebound: room.rebound,
      answer: null,
      answeredAt: 0,
      judged: false,
      correct: false,
      reason: false,
      points: 0
    };

    room.phase = 'answering';
    room.answerDeadline = now + 15000;
    room.updatedAt = now;

    await setDoc(roomRef, room);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(room));

    return { ok: true, message: 'Kelompokmu tercepat merebut!' };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `battle_rooms/${code}`);
    return { ok: false, message: 'Gagal mengirim sinyal rebut.' };
  }
}

export async function submitGroupAnswer(
  code: string,
  groupId: number,
  attemptId: string,
  answer: any
): Promise<{ ok: boolean; message: string }> {
  try {
    const roomRef = doc(db, 'battle_rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return { ok: false, message: 'Ruang tidak ditemukan.' };

    const room = snap.data() as BattleRoomData;
    if (!room.current || room.current.groupId !== groupId || room.current.id !== attemptId) {
      return { ok: false, message: 'Kesempatan menjawab tidak aktif.' };
    }

    room.current.answer = answer;
    room.current.answeredAt = Date.now();
    room.phase = 'review';
    room.updatedAt = Date.now();

    await setDoc(roomRef, room);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + code, JSON.stringify(room));

    return { ok: true, message: 'Jawaban berhasil dikirim ke guru!' };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `battle_rooms/${code}`);
    return { ok: false, message: 'Gagal mengirim jawaban.' };
  }
}
