import {
  BattleRoomData,
  updateBattleRoom,
  getBattleRoom,
  subscribeToBattleRoom
} from './firebase-service';

export interface BattleQuestion {
  type: 'choice' | 'text' | 'order';
  category: string;
  prompt: string;
  options?: string[];
  items?: { id: string; label: string }[];
  order?: string[];
  answer: any;
  why: string;
}

export const BATTLE_QUESTIONS: BattleQuestion[] = [
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“I am writing to apply for the Audio Video Technician Assistant position.” Kalimat ini termasuk bagian apa?',
    options: ['Opening paragraph', 'Body paragraph', 'Closing paragraph', 'Signature'],
    answer: 0,
    why: 'Opening menyebut posisi yang dilamar dan tujuan penulisan surat.'
  },
  {
    type: 'text',
    category: 'Perbaiki kalimat',
    prompt: 'Perbaiki: “I can identifies electronic components.”',
    answer: ['I can identify electronic components.'],
    why: 'Setelah can, gunakan kata kerja dasar identify.'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Lowongan meminta kemampuan membaca skema. Bukti mana yang paling sesuai?',
    options: [
      'I enjoy watching television.',
      'I read a circuit diagram to assemble an audio amplifier in a supervised school project.',
      'I live near the workshop.',
      'I am the best person in town.'
    ],
    answer: 1,
    why: 'Kalimat tersebut menyebut tindakan membaca skema dan konteks praktik yang relevan.'
  },
  {
    type: 'order',
    category: 'Susun surat',
    prompt: 'Susun empat bagian pembuka berikut sesuai model surat yang dipelajari.',
    items: [
      { id: 'd', label: 'Date' },
      { id: 'e', label: 'Employer’s address' },
      { id: 's', label: 'Salutation' },
      { id: 'o', label: 'Opening paragraph' }
    ],
    order: ['s', 'o', 'd', 'e'],
    answer: ['d', 'e', 's', 'o'],
    why: 'Setelah kontak pelamar, urutannya adalah tanggal, alamat penerima, sapaan, lalu opening.'
  },
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“During a school project, I assembled an audio amplifier and recorded the test results.” Bukti ini ditempatkan di bagian apa?',
    options: ['Date', 'Salutation', 'Body paragraph', 'Complimentary close'],
    answer: 2,
    why: 'Body menghubungkan keterampilan dengan bukti pengalaman yang relevan.'
  },
  {
    type: 'text',
    category: 'Perbaiki kalimat',
    prompt: 'Perbaiki kata kerja: “Last month, I assemble an audio amplifier.”',
    answer: ['Last month, I assembled an audio amplifier.'],
    why: 'Last month menandai kegiatan yang sudah selesai, sehingga digunakan assembled.'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Lowongan meminta kerja sama dan pencatatan hasil. Pilih bukti yang menjawab keduanya.',
    options: [
      'I worked with three classmates to test an amplifier and record the measurement results.',
      'I prefer working alone without records.',
      'I like loud music.',
      'My house has a television.'
    ],
    answer: 0,
    why: 'Bekerja bersama menunjukkan teamwork, sedangkan pencatatan pengukuran menunjukkan dokumentasi praktik.'
  },
  {
    type: 'order',
    category: 'Susun surat',
    prompt: 'Susun bagian isi dan penutup surat ini.',
    items: [
      { id: 'o', label: 'Opening paragraph' },
      { id: 'b', label: 'Body paragraph' },
      { id: 'c', label: 'Closing paragraph' },
      { id: 'f', label: 'Complimentary close' },
      { id: 's', label: 'Signature' }
    ],
    order: ['c', 's', 'o', 'f', 'b'],
    answer: ['o', 'b', 'c', 'f', 's'],
    why: 'Tujuan dan posisi diperkenalkan dahulu, dilanjutkan bukti, permintaan wawancara, penutup formal, lalu nama.'
  },
  {
    type: 'choice',
    category: 'Tebak bagian surat',
    prompt: '“I would welcome an interview. Thank you for your time and consideration.” Termasuk bagian apa?',
    options: ['Employer’s address', 'Signature', 'Body paragraph', 'Closing paragraph'],
    answer: 3,
    why: 'Kesediaan wawancara dan ucapan terima kasih merupakan isi closing paragraph.'
  },
  {
    type: 'text',
    category: 'Perbaiki kalimat',
    prompt: 'Perbaiki: “I uses a multimeter in supervised practical lessons.”',
    answer: ['I use a multimeter in supervised practical lessons.'],
    why: 'Subjek I menggunakan bentuk use pada simple present.'
  },
  {
    type: 'choice',
    category: 'Pilih bukti keterampilan',
    prompt: 'Siswa baru berlatih di sekolah dan belum pernah bekerja di perusahaan servis. Pilih kalimat yang dapat dipakai dengan jujur.',
    options: [
      'I have repaired customers’ equipment professionally for ten years.',
      'I hold every electronics certificate.',
      'I checked circuit connections with a multimeter under my teacher’s supervision.',
      'I have mastered every repair procedure.'
    ],
    answer: 2,
    why: 'Kalimat ini menjelaskan pengalaman praktik yang tersedia tanpa mengarang pekerjaan atau sertifikasi.'
  },
  {
    type: 'order',
    category: 'Susun surat',
    prompt: 'Urutkan tiga fungsi paragraf utama surat.',
    items: [
      { id: 'p', label: 'Sebutkan posisi dan sumber lowongan' },
      { id: 'b', label: 'Jelaskan keterampilan beserta bukti praktik' },
      { id: 'w', label: 'Sampaikan kesediaan wawancara dan terima kasih' }
    ],
    order: ['w', 'p', 'b'],
    answer: ['p', 'b', 'w'],
    why: 'Opening menyebut posisi; body menjelaskan bukti; closing menyampaikan kesediaan wawancara dan terima kasih.'
  }
];

function randomStr(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

export function createNewRoom(code?: string, readSeconds = 7): { room: BattleRoomData; hostToken: string } {
  const roomCode = code || String(Math.floor(100000 + Math.random() * 900000));
  const hostToken = 'host_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const displayToken = 'disp_' + Math.random().toString(36).slice(2);

  const groups = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Kelompok ${i + 1}`,
    pin: String(1000 + (i + 1)),
    tokenHash: '',
    joined: false,
    members: [],
    turn: 0,
    score: 0
  }));

  const now = Date.now();
  const room: BattleRoomData = {
    code: roomCode,
    phase: 'lobby',
    qIndex: 0,
    readSeconds: [5, 7, 10].includes(readSeconds) ? readSeconds : 7,
    readDeadline: 0,
    openEpoch: '',
    answerDeadline: 0,
    rebound: false,
    current: null,
    tried: [],
    history: [],
    groups,
    hostToken,
    displayToken,
    createdAt: now,
    updatedAt: now,
    rev: 1
  };

  return { room, hostToken };
}

function normal(s: string) {
  return String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
}

export function attemptText(a: any, q: BattleQuestion): string {
  if (!a) return '';
  if (a.oral) return String(a.answer || a.oralAnswer || '');
  if (q.type === 'choice') return q.options?.[Number(a.answer)] || '';
  if (q.type === 'order') {
    return (a.answer || []).map((id: string) => q.items?.find((x) => x.id === id)?.label || id).join(' → ');
  }
  return String(a.answer || '');
}

export function checkAnswerMatch(a: any, q: BattleQuestion): boolean | null {
  if (a.oral) return null;
  if (q.type === 'choice') return Number(a.answer) === q.answer;
  if (q.type === 'order') return JSON.stringify(a.answer) === JSON.stringify(q.answer);
  if (Array.isArray(q.answer)) {
    return q.answer.some((x: string) => normal(x) === normal(a.answer));
  }
  return normal(q.answer) === normal(a.answer);
}

export function getQuestionKey(q: BattleQuestion): string {
  if (q.type === 'choice') return q.options?.[q.answer] || '';
  if (q.type === 'order') return (q.answer || []).map((id: string) => q.items?.find((x) => x.id === id)?.label || id).join(' → ');
  return Array.isArray(q.answer) ? q.answer[0] : String(q.answer);
}

/**
 * Execute action on room data
 */
export function executeRoomAction(room: BattleRoomData, p: any): { ok: boolean; message?: string } {
  const action = p.action;
  const now = Date.now();
  const q = BATTLE_QUESTIONS[room.qIndex];

  if (room.phase === 'finished' && action !== 'get') {
    return { ok: false, message: 'Permainan sudah selesai.' };
  }

  if (action === 'start') {
    room.phase = 'reading';
    room.readDeadline = now + (room.readSeconds || 7) * 1000;
    room.current = null;
    room.answerDeadline = 0;
    room.openEpoch = '';
    room.rebound = false;
    room.tried = [];
  } else if (action === 'open') {
    room.phase = 'open';
    room.openEpoch = 'epoch_' + Math.random().toString(36).slice(2, 8);
  } else if (action === 'close') {
    room.phase = 'ready';
    room.openEpoch = '';
  } else if (action === 'buzz') {
    if (room.phase !== 'open') {
      return { ok: false, message: 'Rebut terkunci. Tunggu guru membukanya.' };
    }
    const groupId = Number(p.groupId);
    const grp = room.groups.find((g) => g.id === groupId);
    if (!grp) return { ok: false, message: 'Kelompok tidak ditemukan.' };
    if (room.tried.includes(groupId)) {
      return { ok: false, message: 'Kelompok ini sudah mendapat kesempatan pada soal ini.' };
    }

    const respondent = grp.members.length ? grp.members[grp.turn % grp.members.length] : 'Anggota';
    room.current = {
      id: 'att_' + Math.random().toString(36).slice(2, 8),
      qIndex: room.qIndex,
      groupId,
      respondent,
      openEpoch: room.openEpoch,
      acceptedAt: now,
      rebound: room.rebound,
      answer: null,
      answeredAt: 0,
      judged: false,
      correct: false,
      reason: false,
      points: 0
    };
    grp.turn++;
    room.tried.push(groupId);
    room.phase = 'answering';
    room.answerDeadline = now + 15000;
  } else if (action === 'answer') {
    if (!room.current || room.current.groupId !== Number(p.groupId)) {
      return { ok: false, message: 'Hanya kelompok pemenang rebut yang dapat menjawab.' };
    }
    if (room.current.answeredAt) return { ok: true };
    room.current.answer = p.answer;
    room.current.answeredAt = now;
    room.phase = 'review';
  } else if (action === 'judge') {
    if (!room.current) return { ok: false, message: 'Tidak ada jawaban untuk dinilai.' };
    if (room.current.judged) return { ok: false, message: 'Kesempatan ini sudah dinilai.' };

    if (!room.current.answeredAt) {
      if (p.oral === true && p.oralAnswer) {
        room.current.answer = String(p.oralAnswer).trim().slice(0, 240);
        room.current.oral = true;
        room.current.answeredAt = now;
      }
    }

    const correct = p.correct === true;
    const reason = correct && !room.current.rebound && p.reason === true;
    const points = correct ? (room.current.rebound ? 5 : 10 + (reason ? 5 : 0)) : 0;

    room.current.judged = true;
    room.current.correct = correct;
    room.current.reason = reason;
    room.current.points = points;

    const grp = room.groups.find((g) => g.id === room.current!.groupId);
    if (grp) grp.score += points;

    room.history.push({ ...room.current });
    room.phase = correct ? 'resolved' : 'review';
  } else if (action === 'throw') {
    if (!room.current) return { ok: false, message: 'Belum ada kesempatan yang dapat dilempar.' };
    const eligible = room.groups.filter((g) => g.joined && !room.tried.includes(g.id));
    if (!eligible.length) {
      return { ok: false, message: 'Semua kelompok sudah mencoba. Akhiri soal.' };
    }
    room.current = null;
    room.rebound = true;
    room.phase = 'open';
    room.openEpoch = 'epoch_' + Math.random().toString(36).slice(2, 8);
  } else if (action === 'reveal') {
    if (room.current && !room.current.judged) {
      room.current.judged = true;
      room.history.push({ ...room.current });
    }
    room.phase = 'resolved';
    room.openEpoch = '';
  } else if (action === 'next') {
    if (room.qIndex >= BATTLE_QUESTIONS.length - 1) {
      room.phase = 'finished';
    } else {
      room.qIndex++;
      room.phase = 'reading';
      room.readDeadline = now + (room.readSeconds || 7) * 1000;
      room.current = null;
      room.answerDeadline = 0;
      room.openEpoch = '';
      room.rebound = false;
      room.tried = [];
    }
  } else if (action === 'finish') {
    if (room.current && !room.current.judged) {
      room.current.judged = true;
      room.history.push({ ...room.current });
    }
    room.phase = 'finished';
    room.openEpoch = '';
  } else if (action === 'resetTeam') {
    const target = room.groups.find((g) => g.id === Number(p.groupId));
    if (target) {
      target.pin = String(1000 + target.id);
      target.joined = false;
      target.tokenHash = '';
    }
  } else if (action === 'updatePin') {
    const target = room.groups.find((g) => g.id === Number(p.groupId));
    if (target && p.pin) {
      target.pin = String(p.pin).trim().toUpperCase().slice(0, 8);
    }
  }

  room.updatedAt = now;
  room.rev = (room.rev || 0) + 1;
  return { ok: true };
}

export {
  updateBattleRoom,
  getBattleRoom,
  subscribeToBattleRoom
};
