import { collection, doc, setDoc, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SubmissionData } from '../types';

const LOCAL_SUBMISSIONS_KEY = 'al_local_submissions_v2';
const TEACHER_PIN_KEY = 'al_teacher_pin_v2';
const DEFAULT_TEACHER_PIN = '123456';

export function getTeacherPin(): string {
  try {
    return localStorage.getItem(TEACHER_PIN_KEY) || DEFAULT_TEACHER_PIN;
  } catch {
    return DEFAULT_TEACHER_PIN;
  }
}

export function setTeacherPin(newPin: string): void {
  try {
    localStorage.setItem(TEACHER_PIN_KEY, newPin.trim());
  } catch (e) {
    console.warn(e);
  }
}

export async function saveSubmission(data: Omit<SubmissionData, 'submittedAt'>): Promise<string> {
  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const submission: SubmissionData = {
    ...data,
    id: submissionId,
    submittedAt: Date.now()
  };

  // 1. Save to local storage
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
    existing.unshift(submission);
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(existing.slice(0, 500)));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  // 2. Save to Firestore
  try {
    const subRef = doc(db, 'submissions', submissionId);
    await setDoc(subRef, submission);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `submissions/${submissionId}`);
  }

  return submissionId;
}

export function subscribeToSubmissions(
  callback: (submissions: SubmissionData[]) => void
): () => void {
  const subCollection = collection(db, 'submissions');
  const q = query(subCollection, orderBy('submittedAt', 'desc'));

  let unsubscribe = () => {};

  try {
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SubmissionData[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as SubmissionData) });
        });

        // Merge with local if any missing
        try {
          const local: SubmissionData[] = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
          const map = new Map<string, SubmissionData>();
          list.forEach((item) => item.id && map.set(item.id, item));
          local.forEach((item) => item.id && !map.has(item.id) && map.set(item.id, item));
          const merged = Array.from(map.values()).sort((a, b) => b.submittedAt - a.submittedAt);
          callback(merged);
        } catch {
          callback(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
        // Fallback to local
        try {
          const local: SubmissionData[] = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
          callback(local);
        } catch {
          callback([]);
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'submissions');
    try {
      const local: SubmissionData[] = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
      callback(local);
    } catch {
      callback([]);
    }
  }

  return unsubscribe;
}

export function exportSubmissionsToCSV(submissions: SubmissionData[], battleHistory: any[] = []): void {
  const clean = (val: any) => {
    let s = String(val ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows: string[][] = [
    ['--- REKAPITULASI PEMBELAJARAN APPLICATION LETTER (XI TAV) ---'],
    ['Waktu Ekspor', new Date().toLocaleString('id-ID')],
    [],
    ['ID Kiriman', 'Nama Siswa', 'Kelas', 'Kelompok', 'Jenis Tugas', 'Skor Kuis (0-100)', 'Waktu Kirim', 'Isi Surat / Jawaban Utama'],
    ...submissions.map((s) => [
      s.id || '',
      s.studentName,
      s.className,
      s.groupId ? `Kelompok ${s.groupId}` : '-',
      s.kind.toUpperCase(),
      s.quizScore !== undefined ? String(s.quizScore) : '-',
      new Date(s.submittedAt).toLocaleString('id-ID'),
      s.letter ? s.letter.replace(/\n/g, ' ') : (s.answers ? JSON.stringify(s.answers) : '-')
    ]),
    [],
    ['--- RIWAYAT PEROLEHAN SKOR BATTLE KELAS ---'],
    ['Soal Ke', 'Kelompok', 'Penjawab', 'Poin Didapat', 'Status Jawaban', 'Jawaban Terkirim'],
    ...battleHistory.map((h, i) => [
      String(h.qIndex + 1),
      `Kelompok ${h.groupId}`,
      h.respondent || '-',
      String(h.points),
      h.correct ? (h.rebound ? 'Benar (Lemparan)' : 'Benar') : 'Salah / Terlewat',
      String(h.answer || '')
    ])
  ];

  const csvContent = '\ufeff' + rows.map((r) => r.map(clean).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Nilai_XI_TAV_Application_Letter_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
