import './index.css';
import {
  saveSubmissionToFirestore,
  subscribeToSubmissions,
  deleteSubmissionFromFirestore,
  subscribeToBattleRoom,
  subscribeToActiveBattleCode,
  testConnection,
  SubmissionRecord,
  BattleRoomData
} from './firebase-service';
import {
  BATTLE_QUESTIONS,
  createNewRoom,
  executeRoomAction,
  attemptText,
  getQuestionKey,
  updateBattleRoom
} from './battle-engine';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    LESSON: any;
    Arcade: any;
    Prism: any;
    BATTLE_DEMO?: any;
    BATTLE_BOOT?: any;
  }
}

const D = window.LESSON;
const STORAGE_KEY = 'al-lab-tav-electronics-v6';
const TEACHER_PIN_KEY = 'al-teacher-pin-v6';
const TEACHER_AUTH_KEY = 'al-teacher-auth-v6';
const CLIENT_BATTLE_KEY = 'al-client-battle-session-v6';

const defaultState = () => ({
  identity: { name: '', className: 'XI TAV', group: '' },
  form: {} as Record<string, string>,
  checks: {} as Record<string, boolean>,
  games: {} as Record<string, boolean>,
  seen: {} as Record<string, boolean>,
  poll: '',
  diagnostic: {},
  quiz: null as { score: number; answers: number[]; completedAt: string } | null,
  final: '',
  consent: false,
  receiptId: '',
  focus: false
});

let state: ReturnType<typeof defaultState>;
try {
  state = { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
} catch {
  state = defaultState();
}

if (window.Arcade) {
  (state as any).arcade = window.Arcade.sanitize((state as any).arcade);
}

let lessonTab = 0;
let gameTab = 0;
let quizIndex = 0;
let quizAnswers: number[] = [];
let quizLocked = false;
let order = [4, 0, 6, 2, 8, 1, 5, 3, 7];
let scene = 0;

// Teacher desk state
let teacherAuthed = sessionStorage.getItem(TEACHER_AUTH_KEY) === 'true';
let teacherTab: 'battle' | 'submissions' | 'settings' = 'battle';
let liveSubmissions: SubmissionRecord[] = [];
let submissionFilter: 'all' | 'lkpd' | 'quiz' | 'final' = 'all';
let submissionSearch = '';
let activeSubmissionModal: SubmissionRecord | null = null;
let firestoreOnline = true;

// Battle state
let currentRoomCode = localStorage.getItem('al-active-room') || '246810';
let activeRoom: BattleRoomData | null = null;
let unsubscribeRoom: (() => void) | null = null;
let battleRole: 'host' | 'team' | 'display' = 'team';

interface ClientBattleSession {
  roomCode: string;
  groupId: number | null;
  pin: string;
  members: string[];
  isJoined: boolean;
}

let clientSession: ClientBattleSession;
try {
  clientSession = JSON.parse(sessionStorage.getItem(CLIENT_BATTLE_KEY) || 'null') || {
    roomCode: currentRoomCode,
    groupId: null,
    pin: '',
    members: ['', '', '', ''],
    isJoined: false
  };
} catch {
  clientSession = {
    roomCode: currentRoomCode,
    groupId: null,
    pin: '',
    members: ['', '', '', ''],
    isJoined: false
  };
}

function saveClientSession() {
  try {
    sessionStorage.setItem(CLIENT_BATTLE_KEY, JSON.stringify(clientSession));
  } catch {}
}

let battleChoice: number | null = null;
let battleOrder: string[] = [];
let battleTextAnswer = '';
let battleOralAnswer = '';
let isDemoMode = false;

const $ = (s: string) => document.querySelector(s) as HTMLElement;
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

const routes = [
  ['home', 'Beranda'],
  ['materi', 'Materi'],
  ['games', 'Permainan'],
  ['battle', 'Battle'],
  ['lkpd', 'LKPD'],
  ['quiz', 'Kuis'],
  ['final', 'Tantangan'],
  ['guru', 'Untuk guru']
];

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    toast('Penyimpanan browser tidak tersedia. Unduh cadangan.');
    return false;
  }
}

function toast(s: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = s;
  el.style.display = 'block';
  clearTimeout((toast as any).t);
  (toast as any).t = setTimeout(() => {
    el.style.display = 'none';
  }, 4500);
}

function updateProgress() {
  const n =
    (Object.keys(state.seen || {}).length === 4 ? 1 : 0) +
    Object.values(state.games || {}).filter(Boolean).length +
    (state.form?.purpose && state.form?.requirements ? 1 : 0) +
    (state.quiz ? 1 : 0) +
    (state.final?.trim() && !/\[(Your|Opening|Body|Closing|Date)/i.test(state.final) ? 1 : 0);

  const prog = $('#learning-progress') as HTMLProgressElement;
  const txt = $('#progress-text');
  if (prog) prog.value = n;
  if (txt) txt.textContent = n + '/8';
}

function field(key: string, label: string, placeholder = '', type = 'text') {
  let value = '';
  if (key.startsWith('identity.')) {
    const k = key.split('.')[1] as keyof typeof state.identity;
    value = state.identity[k] || '';
  } else if (key === 'final') {
    value = state.final || '';
  } else {
    value = state.form[key] || '';
  }

  return `<label for="f-${key}">${label}</label>${
    type === 'textarea'
      ? `<textarea id="f-${key}" data-field="${key}" placeholder="${esc(placeholder)}" maxlength="${
          key === 'final' ? 8000 : 3000
        }" rows="${key === 'final' ? 14 : 3}">${esc(value)}</textarea>`
      : `<input id="f-${key}" data-field="${key}" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="100">`
  }`;
}

function heading(tag: string, title: string, desc = '') {
  return `<p class="eyebrow">${tag}</p><h1>${title}</h1>${desc ? `<p class="lead">${desc}</p>` : ''}`;
}

function vacancy() {
  if (!D?.vacancy) return '';
  return `<div class="card"><span class="pill">CLASSROOM JOB VACANCY</span><h2 style="margin-top:14px">${D.vacancy.role}</h2><p><strong>${D.vacancy.company}</strong><br>${D.vacancy.address}<br>Source: ${D.vacancy.source}</p><ul>${D.vacancy.requirements.map((x: string) => `<li>${x}</li>`).join('')}</ul><p>${D.vacancy.instruction}</p><small>${D.vacancy.note}</small></div>`;
}

function identity() {
  return `<div class="card"><h2>Identitas peserta didik</h2><p class="muted">Untuk pengumpulan, gunakan nama dan kelas sesuai daftar guru. Jangan masukkan NIK, alamat rumah lengkap, atau nomor telepon.</p><div class="grid">${field('identity.name', 'Nama siswa')}${field('identity.className', 'Kelas')}</div>${field('identity.group', 'Kelompok (1–8)')}</div>`;
}

function home() {
  return (
    (window.Prism?.home ? window.Prism.home() : '') +
    `<div class="card battle-invite"><div><span class="pill">CLASSROOM BATTLE</span><h2>One class. Eight teams.</h2><p>Baca soal, tunggu guru membuka rebut, lalu berlomba menjawab secara real-time multi-device.</p></div><a class="button primary" href="#battle">Application Letter Battle →</a></div><section class="learning-details"><div class="card"><h2>Your learning plan.</h2><p>Gunakan menu Materi → Permainan → LKPD → Kuis → Tantangan. Jawaban tersimpan otomatis dan terhubung ke Database Guru.</p><p>Target: cocokkan minimal 7 dari 9 bagian surat, jawab minimal 8 dari 10 soal kuis, lalu tulis 100–150 kata pada tiga paragraf utama.</p><label class="check"><input type="checkbox" data-focus ${state.focus ? 'checked' : ''}>Saya siap membuka media belajar dan menutup aplikasi lain selama aktivitas.</label></div><div class="card"><h2>Animasi singkat · A job application journey</h2><div class="scene anim" id="scene"></div><div class="actions"><button data-action="scene-prev">← Sebelumnya</button><button data-action="scene-next">Berikutnya →</button></div><p class="muted">Empat adegan bergambar untuk diskusi pembuka XI TAV elektronika.</p></div><div class="card"><h2>Polling awal</h2><p>Have you ever seen a job vacancy?</p><div class="actions poll">${['Sudah', 'Belum', 'Belum yakin']
      .map((x) => `<button data-poll="${x}" aria-pressed="${state.poll === x}">${x}</button>`)
      .join('')}</div><p class="muted">Jawaban tersimpan dan dikumpulkan bersama LKPD.</p>${field('diag-purpose', 'Menurutmu, apa tujuan application letter?', 'Jawab singkat dalam bahasa Indonesia atau Inggris.', 'textarea')}${field('diag-info', 'Informasi apa yang harus dimasukkan?', 'Tuliskan dua informasi.', 'textarea')}${field('diag-interest', 'Posisi TAV yang kamu minati dan kesiapanmu', 'Contoh: Audio Video Technician Assistant; saya sudah belajar membaca skema sederhana.', 'textarea')}</div></section>`
  );
}

function renderScene() {
  const scenes = [
    ['01 · FIND', 'Find a vacancy', 'Amati persyaratan Audio Video Technician Assistant. Keterampilan apa yang sudah kamu miliki?'],
    ['02 · CONNECT', 'Match your skills', 'Pilih bukti praktik elektronika: membaca skema, merakit rangkaian audio, menggunakan alat ukur, atau kerja tim.'],
    ['03 · WRITE', 'Write your letter', 'Gunakan struktur yang lengkap dan bahasa formal. Ceritakan kontribusimu sendiri.'],
    ['04 · REVIEW', 'Review and apply', 'Minta masukan teman, revisi surat, lalu cek konfirmasi pengumpulan di database guru.']
  ];
  const s = scenes[scene];
  const sceneEl = $('#scene');
  if (sceneEl) {
    sceneEl.innerHTML = `<div class="anim"><img src="/assets/studio.svg" alt="" style="width:80px;float:right;margin:0 0 10px 16px"><span class="eyebrow">${s[0]}</span><strong>${s[1]}</strong><p>${s[2]}</p></div>`;
  }
}

function materi() {
  const titles = ['Introduction', 'Generic structure', 'Language features', 'Example'];
  state.seen[lessonTab] = true;
  save();
  let body = '';
  if (lessonTab === 0) {
    body = `<div class="card"><h2>TAV dalam bidang elektronika</h2><p>${esc(D.program.description)}</p><ul>${D.program.evidence.map((x: string) => `<li>${esc(x)}</li>`).join('')}</ul><p>Pilih bukti praktik yang benar-benar pernah kamu lakukan. Jelaskan kemampuan yang masih kamu pelajari secara jujur.</p></div><div class="card"><h2>What is an application letter?</h2><p>An application letter is a formal letter written to apply for a job and explain why the applicant is suitable for the position.</p><div class="callout">Surat lamaran menyatakan minat pada posisi tertentu serta menghubungkan kemampuan pelamar dengan kebutuhan pekerjaan.</div><h3>Social function</h3><p>To introduce the applicant, present relevant qualifications, and request an opportunity for an interview.</p><p>Surat lamaran menjelaskan kecocokan pelamar. CV merangkum riwayat pendidikan dan pengalaman. Portfolio memperlihatkan bukti karya.</p><h3>Think about it</h3><p>Imagine you find your dream job. What should you prepare before applying?</p></div>${vacancy()}`;
  }
  if (lessonTab === 1) {
    body = `<div class="card"><h2>Nine parts of a letter</h2><p>Ketuk judul untuk membaca fungsi setiap bagian.</p>${D.structure.map((x: string[], i: number) => `<details class="letter-part"><summary>${i + 1}. ${x[0]}</summary><p>${x[1]}</p></details>`).join('')}</div>`;
  }
  if (lessonTab === 2) {
    body = `<div class="grid"><div class="card"><h2>Present skills</h2><p><strong>I use basic measuring instruments.</strong><br>Saya menggunakan alat ukur dasar.</p><p>Simple present menjelaskan kemampuan atau keadaan saat ini. Setelah can gunakan kata kerja dasar: <strong>I can read simple circuit diagrams.</strong></p></div><div class="card"><h2>Past experience</h2><p><strong>I assembled an audio amplifier during a school practical project.</strong><br>Saya merakit penguat audio pada praktik sekolah.</p><p>Simple past menjelaskan pengalaman yang telah selesai. Surat lamaran dapat memuat lebih dari satu tense sesuai makna.</p></div></div><div class="card"><h2>Formal expressions & action verbs</h2><ul><li>I am writing to apply for … (Saya menulis untuk melamar …)</li><li>I would welcome the opportunity … (Saya menyambut kesempatan …)</li><li>Thank you for your consideration. (Terima kasih atas pertimbangannya.)</li></ul><p><strong>Identify</strong>: mengenali · <strong>Assemble</strong>: merakit · <strong>Measure</strong>: mengukur · <strong>Test</strong>: menguji · <strong>Record</strong>: mencatat · <strong>Maintain</strong>: merawat · <strong>Repair</strong>: memperbaiki · <strong>Qualifications</strong>: kualifikasi · <strong>Portfolio</strong>: kumpulan karya · <strong>Applicant</strong>: pelamar · <strong>Vacancy</strong>: lowongan.</p><div class="callout">Dear Hiring Manager, → Yours sincerely, dipakai dalam contoh pembelajaran ini. Jika memakai Dear Sir or Madam, penutup Yours faithfully, lazim dalam konvensi British English.</div></div>`;
  }
  if (lessonTab === 3) {
    body = `<div class="card"><h2>A letter from Raka</h2><p>Ketuk tiap label untuk mengamati isi dan fungsinya. Seluruh identitas pada contoh adalah simulasi.</p>${D.letter.map((x: string[], i: number) => `<details class="letter-part" open><summary>${i + 1}. ${x[0]}</summary><p>${esc(x[1])}</p><small>${D.structure[i][1]}</small></details>`).join('')}</div>`;
  }
  return heading('LEARNING NOTES', 'Build your foundation.', 'Materi bahasa Inggris dengan penjelasan bahasa Indonesia.') + `<div class="tabs" role="group" aria-label="Pilih materi">${titles.map((x, i) => `<button data-lesson="${i}" aria-pressed="${lessonTab === i}">${i + 1}. ${x}</button>`).join('')}</div>` + body + `<div class="actions"><button data-action="lesson-next">${lessonTab < 3 ? 'Materi berikutnya →' : 'Kembali ke materi 1'}</button><a class="button primary" href="#games">Coba permainan →</a></div>`;
}

function games() {
  return `<div class="card battle-invite"><div><span class="pill">8 KELOMPOK · KENDALI GURU</span><h2>Application Letter Battle</h2><p>Rebut kesempatan, jawab, dan jelaskan alasan. Terhubung real-time multi-device ke panel guru.</p></div><a class="button primary" href="#battle">Masuk Battle →</a></div>` + (window.Arcade?.render ? window.Arcade.render() : '');
}

function lkpd() {
  return (
    heading('DIGITAL WORKSHEET', 'Observe. Discuss. Connect.', 'LKPD 1 dikerjakan individu, lalu dibahas dalam kelompok berisi empat siswa.') +
    identity() +
    vacancy() +
    `<div class="card"><h2>LKPD 1 · Understanding Application Letter</h2><p>Baca lowongan dan contoh surat pada menu Materi. Diskusikan alasan jawaban, lalu isi jawabanmu sendiri.</p>${field('purpose', '1. What is the purpose of Raka’s letter?', '', 'textarea')}${field('requirements', '2. Sebutkan tiga persyaratan pekerjaan.', '', 'textarea')}${field('evidence', '3. Kutip satu bukti proyek yang relevan dan jelaskan kecocokannya.', '', 'textarea')}${field('present', '4. Tuliskan satu kalimat simple present dari contoh.', '', 'textarea')}${field('past', '5. Tuliskan satu kalimat simple past dan alasan penggunaannya.', '', 'textarea')}${field('discussion', '6. Mengapa klaim “I am the best technician” perlu diganti dengan bukti? Catat simpulan kelompok.', '', 'textarea')}<p>Latihan struktur dan ungkapan tersedia pada menu Permainan.</p></div><div class="card"><h2>LKPD 2 · Creating My Application Letter</h2><p>Analisis kebutuhan perusahaan sebelum menulis secara individu. Kelompok membantu bertukar ide dan memberi masukan.</p>${field('skills', '1. Keterampilan yang diminta dan kemampuanmu yang sesuai', '', 'textarea')}${field('project', '2. Bukti proyek sekolah dan kontribusi pribadimu', '', 'textarea')}${field('plan', '3. Rencana isi opening, body, dan closing', '', 'textarea')}</div><div class="card"><h2>LKPD 3 · Review, Revise, and Reflect</h2><p>Pertemuan ketiga: telaah draf teman, catat perubahanmu, lalu selesaikan surat pada Tantangan.</p>${field('peer', '1. Nama penelaah dan satu saran perbaikan', '', 'textarea')}${field('revision', '2. Perbaikan yang kamu lakukan setelah menerima saran', '', 'textarea')}<a class="button primary" href="#final">Tulis produk akhir →</a></div><div class="card"><h2>Refleksi pembelajaran</h2>${field('reflection1', 'Satu hal baru yang saya pahami', '', 'textarea')}${field('reflection2', 'Bagian yang masih sulit dan langkah belajar berikutnya', '', 'textarea')}${field('confidence', 'Kesiapan menulis (1–4) beserta alasannya', '', 'textarea')}</div>${submissionPanel('lkpd')}`
  );
}

function quiz() {
  if (quizIndex >= 10) {
    const score = quizAnswers.reduce((n, a, i) => n + (a === D.quiz[i].key ? 10 : 0), 0);
    state.quiz = { score, answers: quizAnswers.slice(), completedAt: new Date().toISOString() };
    save();
    return (
      heading('QUIZ RESULTS', 'You made progress.') +
      `<div class="card"><div class="stat">${score}<small>/100</small></div><h2>${score >= 80 ? 'Target pengetahuan tercapai!' : 'Pelajari kembali bagian yang masih sulit.'}</h2><p>Skor kuis ini otomatis tersimpan ke Database Guru saat kamu menekan tombol Kirim.</p><div class="actions"><button class="primary" data-action="quiz-reset">Ulangi kuis</button><a class="button" href="#final">Tantangan akhir →</a></div><h3>Tinjau jawaban</h3>${D.quiz.map((q: any, i: number) => `<details class="letter-part"><summary>${i + 1}. ${quizAnswers[i] === q.key ? 'Benar (+10)' : 'Perlu ditinjau'} · ${q.topic}</summary><p>${esc(q.q)}</p><p>Jawabanmu: ${esc(q.options[quizAnswers[i]])}</p><p><strong>Kunci: ${esc(q.options[q.key])}</strong></p><p>${q.why}</p></details>`).join('')}</div>${submissionPanel('quiz')}`
    );
  }
  const q = D.quiz[quizIndex];
  return (
    heading('QUICK CHECK', 'Put your learning to work.', '10 soal bertahap · 10 poin per jawaban benar · tanpa batas waktu.') +
    `<div class="card"><div class="quiz-meta"><span>Soal ${quizIndex + 1} dari 10</span><span>${q.topic}</span></div><progress value="${quizIndex}" max="10" aria-label="Progres kuis"></progress><h2 style="margin-top:24px">${q.q}</h2><div id="quiz-options">${q.options.map((x: string, i: number) => `<button class="option" data-answer="${i}"><strong>${'ABCD'[i]}.</strong> ${esc(x)}</button>`).join('')}</div><div id="quiz-feedback" aria-live="polite"></div><button class="primary hidden" id="quiz-next" data-action="quiz-next">${quizIndex === 9 ? 'Lihat hasil' : 'Soal berikutnya →'}</button><p class="muted" style="margin-top:15px">Hasil kuis otomatis tersimpan di perangkat dan terkirim ke Firestore Database Guru.</p>${state.quiz ? `<p class="muted">Hasil tersimpan sebelumnya: ${state.quiz.score}/100.</p>` : ''}</div>`
  );
}

function template() {
  return `[Your name]\nNganjuk, East Java\nstudent@example.com\n\n[Date]\n\nHiring Manager\n${D.vacancy.company}\n${D.vacancy.address}\n\nDear Hiring Manager,\n\n[Opening: state the position and source of the vacancy.]\n\n[Body: explain relevant skills and evidence from a school project.]\n\n[Closing: express interest in an interview and say thank you.]\n\nYours sincerely,\n[Your full name]`;
}

function wordCount(s: string) {
  return (s.trim().match(/\S+/g) || []).length;
}

function finalPage() {
  return (
    heading('FINAL CHALLENGE', 'Your application starts here.', 'Simulasi melamar Audio Video Technician Assistant. Tulis suratmu sendiri, lalu revisi berdasarkan masukan teman.') +
    identity() +
    vacancy() +
    `<div class="card"><h2>Write your application letter</h2><p>Isi tiga paragraf utama sepanjang 100–150 kata, di luar alamat, tanggal, sapaan, dan penutup. Gunakan kemampuan serta proyek yang benar-benar pernah kamu lakukan. Gunakan kontak simulasi di isi surat.</p><div class="actions"><button data-action="insert-template">Gunakan template</button><button data-action="preview-letter">Pratinjau surat</button></div>${field('final', 'Application letter', 'Mulai menulis di sini atau gunakan template.', 'textarea')}<p class="muted" id="word-count">${wordCount(state.final)} kata pada seluruh surat. Periksa 100–150 kata pada tiga paragraf utama secara terpisah.</p><div id="letter-preview"></div><h3 style="margin-top:24px">Checklist pemeriksaan mandiri</h3>${['Isi menjawab posisi dan persyaratan lowongan.', 'Sembilan bagian surat sudah lengkap.', 'Bukti proyek sesuai pengalaman saya.', 'Kosakata formal dan tata bahasa sudah diperiksa.', 'Tiga paragraf utama berisi 100–150 kata.', 'Saya sudah menerima masukan teman dan merevisi surat.']
      .map((x, i) => `<label class="check"><input type="checkbox" data-check="${i}" ${state.checks[i] ? 'checked' : ''}>${x}</label>`)
      .join('')}<p class="muted">Penilaian guru: tujuan/posisi, struktur, bukti keterampilan, bahasa, penyajian tulisan, serta penjelasan/revisi.</p></div>${submissionPanel('final')}`
  );
}

function submissionPanel(kind: 'lkpd' | 'quiz' | 'final') {
  return `<div class="card"><h2>Simpan & kumpulkan</h2><div class="callout"><strong>Terkoneksi langsung ke Database Guru:</strong> Pengumpulan LKPD, kuis, dan surat tugas akhir langsung tersimpan secara aman di Firestore. Guru dapat langsung memeriksa dari panel guru tanpa memerlukan Google Apps Script.</div><label class="check"><input type="checkbox" data-consent ${state.consent ? 'checked' : ''}>Saya setuju mengirim nama, kelas, jawaban, skor permainan, skor kuis, dan isi surat kepada guru untuk pembelajaran ini.</label><div class="actions"><button class="primary" data-submit="${kind}">Kirim ${kind === 'final' ? 'tugas akhir' : kind === 'quiz' ? 'hasil kuis' : 'LKPD'} ke Guru</button><button data-action="download-json">Unduh cadangan JSON</button><button data-action="download-txt">Unduh jawaban TXT</button></div><p class="muted">Draf disimpan otomatis di browser. Anda juga bisa mengunduh file cadangan mandiri kapan saja.</p><div id="submit-status" aria-live="polite"></div></div>`;
}

function download(name: string, text: string, type: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportText() {
  const labels: Record<string, string> = {
    'diag-purpose': 'Diagnostik: tujuan surat',
    'diag-info': 'Diagnostik: informasi yang diperlukan',
    'diag-interest': 'Diagnostik: minat dan kesiapan',
    purpose: 'LKPD 1: tujuan surat',
    requirements: 'LKPD 1: persyaratan lowongan',
    evidence: 'LKPD 1: bukti proyek',
    present: 'LKPD 1: simple present',
    past: 'LKPD 1: simple past dan alasannya',
    discussion: 'LKPD 1: simpulan diskusi',
    skills: 'LKPD 2: keterampilan yang sesuai',
    project: 'LKPD 2: proyek dan kontribusi saya',
    plan: 'LKPD 2: rencana paragraf',
    peer: 'LKPD 3: penelaah dan saran',
    revision: 'LKPD 3: revisi',
    reflection1: 'Refleksi: pemahaman baru',
    reflection2: 'Refleksi: kesulitan dan rencana',
    confidence: 'Refleksi: kesiapan'
  };
  const parts = Object.entries(labels).map(([k, label]) => label + '\n' + (state.form[k] || '(belum diisi)'));
  const match = D.structure
    .map((x: string[], i: number) => {
      const v = state.form['match' + i];
      return i + 1 + '. ' + x[1] + '\nJawaban: ' + (v !== undefined && v !== '' ? D.structure[+v]?.[0] || '(tidak valid)' : '(belum diisi)');
    })
    .join('\n');

  return (
    'APPLICATION LETTER LAB\nNama: ' +
    state.identity.name +
    '\nKelas: ' +
    state.identity.className +
    '\nKelompok: ' +
    state.identity.group +
    '\nPolling: ' +
    (state.poll || '(belum diisi)') +
    '\n\n' +
    parts.join('\n\n') +
    '\n\nMATCH THE STRUCTURE\n' +
    match +
    '\n\nARCADE\n' +
    Object.entries((state as any).arcade?.best || {})
      .map(([i, b]: [string, any]) => ['Structure Match', 'Letter Studio', 'Grammar Detective', 'Recruiter Dash'][+i] + ': ' + b.score + ' XP, ' + b.stars + '/3 bintang, ' + b.correct + '/' + b.total + ' tepat')
      .join('\n') +
    '\n\nSURAT LAMARAN\n' +
    (state.final || '(belum diisi)') +
    '\n\nSkor kuis: ' +
    (state.quiz?.score ?? 'Belum selesai') +
    '\n'
  );
}

function payload(kind: string) {
  if (!state.receiptId) {
    state.receiptId = crypto.randomUUID ? crypto.randomUUID() : `al-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    save();
  }
  return {
    version: 1,
    contentRevision: D.revision,
    submissionId: state.receiptId,
    kind,
    clientTime: new Date().toISOString(),
    identity: state.identity,
    poll: state.poll,
    answers: state.form,
    games: state.games,
    arcade: (state as any).arcade || {},
    seen: state.seen,
    quiz: state.quiz,
    letter: state.final,
    checklist: state.checks,
    consent: state.consent
  };
}

async function submit(kind: 'lkpd' | 'quiz' | 'final') {
  if (!state.identity.name.trim() || !state.identity.className.trim()) {
    return toast('Isi nama dan kelas terlebih dahulu pada bagian identitas.');
  }
  if (!state.consent) {
    return toast('Beri persetujuan pengiriman terlebih dahulu.');
  }
  if (kind === 'final' && (!state.final.trim() || /\[(Your|Opening|Body|Closing|Date)/i.test(state.final))) {
    return toast('Lengkapi surat dan ganti seluruh petunjuk template.');
  }
  if (kind === 'lkpd' && (!state.form.purpose?.trim() || !state.form.requirements?.trim())) {
    return toast('Lengkapi jawaban tujuan dan persyaratan pada LKPD 1.');
  }
  if (kind === 'quiz' && !state.quiz) {
    return toast('Selesaikan kuis sebelum mengirim hasil.');
  }

  const p = payload(kind);
  const statusEl = $('#submit-status');
  if (statusEl) {
    statusEl.innerHTML = `<div class="feedback">Menghubungkan ke Database Firestore...</div>`;
  }

  const res = await saveSubmissionToFirestore(p);
  if (res.success) {
    confetti({ particleCount: 50, spread: 70 });
    toast('Berhasil dikirim ke Database Guru!');
    if (statusEl) {
      statusEl.innerHTML = `<div class="feedback good" style="border-left:4px solid #65c7a2;">
        <strong>✓ Berhasil Tersimpan di Database Guru!</strong><br>
        Nama: <strong>${esc(state.identity.name)}</strong> (${esc(state.identity.className)})<br>
        Nomor Bukti Tugas: <strong>${esc(res.id)}</strong><br>
        Waktu: ${new Date().toLocaleTimeString('id-ID')} WIB.<br>
        <em>Guru dapat langsung memeriksa tugas ini secara real-time dari Panel Guru.</em>
      </div>`;
    }
  } else {
    toast('Gagal mengirim ke database.');
    if (statusEl) {
      statusEl.innerHTML = `<div class="feedback bad">Gagal terhubung ke database online. Unduh file cadangan JSON dan serahkan ke guru. Error: ${esc(
        res.error
      )}</div>`;
    }
  }
}

// ==========================================
// BATTLE SUBSCRIPTION & REAL-TIME SYNC
// ==========================================
function setupBattleSync() {
  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  if (isDemoMode) {
    if (!activeRoom) {
      const demo = createNewRoom('246810', 7);
      demo.room.groups.forEach((g) => {
        g.joined = true;
        g.members = ['Raka', 'Siti', 'Budi', 'Dewi'];
      });
      activeRoom = demo.room;
    }
    return;
  }

  unsubscribeRoom = subscribeToBattleRoom(currentRoomCode, (room) => {
    activeRoom = room;
    const route = location.hash.slice(1) || 'home';
    if (route === 'battle' || (route === 'guru' && teacherTab === 'battle')) {
      render();
    }
  });
}

// ==========================================
// BATTLE PAGE VIEW
// ==========================================
function battlePage() {
  const room = activeRoom;
  const q = room ? BATTLE_QUESTIONS[room.qIndex] : null;

  return (
    heading('CLASSROOM LIVE', 'Application Letter Battle.', 'Delapan kelompok berlomba secara real-time. Guru mengendalikan pembukaan rebut, timer, dan penilaian.') +
    `<div class="card battle-wrap">
      <div class="top-bar-battle" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #ffffff18;">
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="monogram">AL</span>
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="micro" style="font-weight:bold;">KODE RUANG AKTIF:</span>
              <strong style="font-size:22px;letter-spacing:4px;color:var(--mint);font-family:monospace;">${currentRoomCode}</strong>
            </div>
            <small class="muted" style="display:block;">${isDemoMode ? 'Mode Simulasi Mandiri' : 'Terkoneksi Real-time Firestore (Multi-device)'}</small>
          </div>
        </div>
        <div class="actions" style="margin:0;">
          <button class="${battleRole === 'team' ? 'primary' : ''}" data-battle-role="team">Tampilan Siswa</button>
          <button class="${battleRole === 'host' ? 'primary' : ''}" data-battle-role="host">Kendali Guru</button>
          <button class="${battleRole === 'display' ? 'primary' : ''}" data-battle-role="display">Layar Proyektor</button>
          <button class="linklike" data-action="toggle-demo" style="font-size:11px;">${isDemoMode ? 'Ganti ke Real-time' : 'Mode Offline/Demo'}</button>
        </div>
      </div>
      ${renderBattleStage(room, q)}
    </div>`
  );
}

function renderBattleStage(room: BattleRoomData | null, q: any) {
  if (!room) {
    return `<div class="lobby" style="text-align:center;padding:40px 20px;">
      <span class="micro">STATUS RUANG</span>
      <h2 style="margin-top:10px;">Ruang Battle ${esc(currentRoomCode)} Belum Aktif</h2>
      <p class="muted" style="max-width:550px;margin:10px auto 20px;">Jika Anda <strong>Guru</strong>, tekan tombol di bawah untuk membuat ruang. Jika Anda <strong>Siswa</strong>, masukkan kode ruang yang diberikan oleh guru Anda.</p>
      <div style="max-width:380px;margin:0 auto 20px;">
        <label for="change-room-code-input" style="font-size:12px;">Masukkan Kode Ruang dari Guru:</label>
        <div style="display:flex;gap:8px;">
          <input id="change-room-code-input" value="${esc(currentRoomCode)}" placeholder="6 Angka Kode Ruang" maxlength="6" style="letter-spacing:4px;font-weight:bold;font-size:18px;text-align:center;">
          <button class="primary" data-action="connect-room-code">Hubungkan</button>
        </div>
      </div>
      <div class="actions" style="justify-content:center;">
        <button class="primary" data-action="init-battle-room">Buat Ruang ${esc(currentRoomCode)} Baru (Guru)</button>
        <a class="button" href="#guru">Buka Panel Guru →</a>
      </div>
    </div>`;
  }

  // Phase banner
  let phaseText = '';
  let phaseSub = '';
  let phaseClass = '';
  let clockMark: any = '🔒';

  if (room.phase === 'lobby') {
    phaseText = 'Menunggu guru menampilkan soal';
    phaseSub = 'Siapkan satu HP per kelompok dan masukkan nama anggota.';
  } else if (room.phase === 'reading' || room.phase === 'ready') {
    const readLeft = Math.max(0, Math.ceil((room.readDeadline - Date.now()) / 1000));
    phaseText = readLeft > 0 ? `Waktu membaca: ${readLeft}s` : 'Waktu membaca selesai';
    phaseSub = 'Rebut terkunci sampai guru membukanya secara digital.';
    clockMark = readLeft > 0 ? readLeft : '✓';
  } else if (room.phase === 'open') {
    phaseText = room.rebound ? 'Rebut Lemparan Terbuka (+5 Poin)!' : 'Rebut Terbuka (+10 Poin)!';
    phaseSub = 'Kelompok tercepat yang menekan tombol mendapat giliran.';
    clockMark = 'GO';
    phaseClass = 'open';
  } else if (room.phase === 'answering') {
    const ansLeft = Math.max(0, Math.ceil((room.answerDeadline - Date.now()) / 1000));
    phaseText = `Kelompok ${room.current?.groupId} menjawab: ${room.current?.respondent}`;
    phaseSub = `Waktu tersisa: ${ansLeft} detik.`;
    clockMark = ansLeft;
    phaseClass = 'warn';
  } else if (room.phase === 'review') {
    phaseText = room.current?.judged ? 'Jawaban belum tepat' : `Menunggu keputusan guru untuk Kelompok ${room.current?.groupId}`;
    phaseSub = 'Alasan dan bukti dijelaskan secara lisan.';
  } else if (room.phase === 'resolved') {
    phaseText = room.current?.correct ? `+${room.current.points} poin untuk Kelompok ${room.current.groupId}!` : 'Soal selesai dibahas';
    phaseSub = 'Perhatikan pembahasan sebelum berlanjut ke soal berikutnya.';
    clockMark = '✓';
  } else if (room.phase === 'finished') {
    phaseText = 'Battle Selesai!';
    phaseSub = 'Selamat kepada seluruh kelompok atas kerja samanya.';
    clockMark = '🏆';
  }

  const phaseBanner = `<div class="phase-band ${phaseClass}" aria-live="polite">
    <span class="clock">${clockMark}</span>
    <span><strong>${esc(phaseText)}</strong><small>${esc(phaseSub)}</small></span>
  </div>`;

  // Question element
  const questionBox = `<div class="card stage" style="min-height:360px;">
    ${
      room.phase === 'lobby'
        ? `<div class="lobby" style="text-align:center;padding:35px 10px;">
            <span class="micro">KODE RUANG BATTLE</span>
            <div class="big-room" style="font-size:48px;letter-spacing:6px;color:var(--mint);font-family:monospace;">${room.code}</div>
            <h2 style="margin-top:20px;">Ready for Classroom Battle</h2>
            <p class="muted">Tunggu seluruh 8 kelompok bergabung dengan PIN masing-masing.</p>
            <span class="tag">${room.groups.filter((g) => g.joined).length} dari 8 Kelompok Terhubung</span>
          </div>`
        : `<div class="question-meta"><span class="micro">SOAL ${room.qIndex + 1} / ${BATTLE_QUESTIONS.length}</span><span class="micro">${esc(q.category)}</span></div>
          <div class="question">${esc(q.prompt)}</div>
          ${
            q.type === 'choice'
              ? `<div class="options">${q.options.map((opt: string, i: number) => `<div class="option static-option"><b>${'ABCD'[i]}.</b><span>${esc(opt)}</span></div>`).join('')}</div>`
              : q.type === 'order'
              ? `<div class="order-pool">${(q.order || []).map((id: string) => `<span class="tag">${esc(q.items.find((x: any) => x.id === id)?.label || id)}</span>`).join('')}</div>`
              : '<p class="note">Tulis kalimat perbaikan yang lengkap dan tepat.</p>'
          }
          ${
            room.phase === 'resolved' || room.phase === 'finished'
              ? `<div class="key"><strong>Kunci Jawaban: ${esc(getQuestionKey(q))}</strong><p style="margin:8px 0 0">${esc(q.why)}</p></div>`
              : ''
          }`
    }
  </div>`;

  // Right Side: Team view, Teacher view, or Projector
  let sidePanel = '';
  if (battleRole === 'host') {
    sidePanel = renderTeacherControlPanel(room, q);
  } else if (battleRole === 'team') {
    sidePanel = renderTeamInteractionPanel(room, q);
  } else {
    // Projector display mode
    sidePanel = `<aside class="card">
      <span class="micro">LAYAR KELAS · PROYEKTOR</span>
      <h2 style="margin-top:12px;">Panduan Battle</h2>
      <p>Satu HP per kelompok. Tekan tombol rebut saat lampu berubah hijau. Jelaskan alasan lisan setelah menjawab.</p>
      <div class="rule"><b>10</b> <span>poin rebut awal benar</span></div>
      <div class="rule"><b>+5</b> <span>alasan/bukti meyakinkan</span></div>
      <div class="rule"><b>5</b> <span>poin rebut lemparan</span></div>
    </aside>`;
  }

  // Scores
  const sorted = [...room.groups].sort((a, b) => b.score - a.score);
  const scoreGrid = `<section class="scores">
    <div class="scores-title"><h2>Papan Skor 8 Kelompok</h2><small>${isDemoMode ? 'Simulasi Offline' : 'Live Real-time'}</small></div>
    <div class="score-grid">
      ${sorted
        .map(
          (g, idx) => `<div class="team-card ${room.current?.groupId === g.id ? 'current' : ''}">
            <span>
              <b><span class="score-rank">#${idx + 1}</span>${esc(g.name)}</b>
              <small>${g.joined ? 'Anggota: ' + (g.members.length ? g.members[g.turn % g.members.length] : 'Siap') : 'Belum gabung'}</small>
            </span>
            <span class="points">${g.score}</span>
          </div>`
        )
        .join('')}
    </div>
  </section>`;

  return `${phaseBanner}<div class="stage-grid ${battleRole === 'team' ? 'student-layout' : ''}">${questionBox}${sidePanel}</div>${scoreGrid}`;
}

function renderTeacherControlPanel(room: BattleRoomData, q: any) {
  const c = room.current;

  return `<aside class="card controls">
    <span class="micro">KENDALI GURU (HOST)</span>
    <h2 style="margin-top:9px;">Atur Jalannya Soal</h2>
    ${
      room.phase === 'lobby'
        ? `<button class="primary" data-battle-action="start" style="width:100%;">Tampilkan Soal Pertama</button>`
        : ''
    }
    ${
      room.phase === 'reading' || room.phase === 'ready'
        ? `<button class="primary" data-battle-action="open" style="width:100%;">Buka Rebut Sekarang</button>`
        : ''
    }
    ${
      room.phase === 'open'
        ? `<button class="danger" data-battle-action="close" style="width:100%;">Kunci Rebut</button>`
        : ''
    }
    ${
      c && !c.judged
        ? `<div class="response">
            <strong>KELOMPOK ${c.groupId} · ${esc(c.respondent)}</strong>
            <p>${esc(attemptText(c, q) || 'Menunggu siswa mengirim jawaban...')}</p>
          </div>
          <div style="margin:10px 0;">
            <label for="oral-input" style="font-size:11px;">Jawaban Lisan Siswa (opsional):</label>
            <input id="oral-input" placeholder="Ketik ringkasan jawaban lisan siswa..." value="${esc(battleOralAnswer)}">
          </div>
          <div class="actions">
            <button class="good" data-battle-judge="correct">Benar (+${room.rebound ? 5 : 10})</button>
            ${!room.rebound ? `<button class="primary" data-battle-judge="reason">Benar + Alasan (+15)</button>` : ''}
            <button class="danger" data-battle-judge="wrong">Salah (0)</button>
          </div>`
        : ''
    }
    ${
      c && c.judged && !c.correct && !room.rebound
        ? `<div class="actions" style="margin-top:10px;">
            <button class="primary" data-battle-action="throw" style="width:100%;">Lempar ke Kelompok Lain (+5)</button>
          </div>`
        : ''
    }
    ${
      room.phase === 'resolved'
        ? `<div class="actions" style="margin-top:10px;">
            <button class="primary" data-battle-action="next" style="width:100%;">${room.qIndex === BATTLE_QUESTIONS.length - 1 ? 'Selesai & Lihat Rekap' : 'Soal Berikutnya →'}</button>
          </div>`
        : room.phase !== 'lobby' && !c?.judged
        ? `<div class="actions" style="margin-top:10px;">
            <button data-battle-action="reveal" style="width:100%;">Tutup Soal & Bahas</button>
          </div>`
        : ''
    }
    <details class="key" style="margin-top:15px;">
      <summary>Kunci Jawaban Guru</summary>
      <p style="margin:8px 0 0;font-weight:700;">${q ? esc(getQuestionKey(q)) : '-'}</p>
      <small>${q ? esc(q.why) : ''}</small>
    </details>
    <div class="actions" style="margin-top:12px;">
      <button data-action="export-battle-csv">Unduh CSV Skor</button>
      <button data-action="init-battle-room">Reset Permainan</button>
    </div>
  </aside>`;
}

function renderTeamInteractionPanel(room: BattleRoomData, q: any) {
  const isMyDeviceJoined = clientSession.isJoined && clientSession.groupId !== null && clientSession.roomCode === room.code;
  const myGrp = isMyDeviceJoined ? room.groups.find((g) => g.id === clientSession.groupId) : null;
  const isMyTurn = isMyDeviceJoined && room.current?.groupId === clientSession.groupId;

  // If this device hasn't joined, ALWAYS render the group selection and PIN input!
  if (!isMyDeviceJoined || !myGrp) {
    const selectedGid = clientSession.groupId || 1;
    const currentGrpInfo = room.groups.find((x) => x.id === selectedGid);
    return `<aside class="card">
      <span class="micro">GABUNG BATTLE KELAS</span>
      <h2 style="margin-top:9px;">Masuk Kelompok</h2>
      <div style="margin-bottom:12px;">
        <label for="student-room-code" style="font-size:11px;">Kode Ruang dari Guru:</label>
        <div style="display:flex;gap:6px;">
          <input id="student-room-code" value="${esc(currentRoomCode)}" placeholder="6 Angka" maxlength="6" style="letter-spacing:3px;font-weight:bold;font-family:monospace;text-align:center;">
          <button data-action="connect-room-code" style="padding:0 12px;min-height:44px;">Ganti</button>
        </div>
      </div>
      <label for="team-select">Pilih Kelompok Kamu:</label>
      <select id="team-select">
        ${room.groups.map((g) => `<option value="${g.id}" ${g.id === selectedGid ? 'selected' : ''}>${esc(g.name)} ${g.joined ? '(Aktif)' : '(Tersedia)'}</option>`).join('')}
      </select>
      <label for="pin-input">PIN Kelompok (dari Guru):</label>
      <input id="pin-input" placeholder="Masukkan PIN (Default: ${currentGrpInfo?.pin || 1000 + selectedGid})" value="${esc(clientSession.pin)}" style="text-transform:uppercase;letter-spacing:3px;font-family:monospace;font-size:16px;">
      <small class="muted" style="display:block;margin-top:4px;">PIN Kelompok ${selectedGid}: <code>${esc(currentGrpInfo?.pin || 1000 + selectedGid)}</code></small>
      <label style="margin-top:12px;">Nama 4 Anggota Kelompok:</label>
      <div class="members">
        ${[0, 1, 2, 3].map((i) => `<input id="member-${i}" placeholder="Anggota ${i + 1}" value="${esc(clientSession.members[i] || '')}">`).join('')}
      </div>
      <div class="actions" style="margin-top:16px;">
        <button class="primary" data-action="team-join" style="width:100%;">Masuk Ruang Battle</button>
      </div>
    </aside>`;
  }

  // DEVICE IS JOINED! Show team badge, members, and buzzer / answer form
  return `<aside class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="micro">${esc(myGrp.name)} (Room ${currentRoomCode})</span>
      <span class="tag" style="font-size:10px;font-weight:bold;">Skor: ${myGrp.score}</span>
    </div>
    <p class="respondent" style="margin:10px 0 4px;">Penjawab saat ini: <strong>${esc(myGrp.members.length ? myGrp.members[myGrp.turn % myGrp.members.length] : 'Siap')}</strong></p>
    <small class="muted" style="display:block;text-align:center;margin-bottom:12px;">Anggota: ${esc(myGrp.members.join(', '))}</small>
    ${
      isMyTurn && room.phase === 'answering'
        ? `<div class="answer-form" style="margin-top:10px;">
            <h3>Kirim Jawaban Kelompokmu:</h3>
            ${
              q.type === 'choice'
                ? `<div class="options" style="grid-template-columns:1fr;gap:6px;">
                    ${q.options.map((opt: string, i: number) => `<button class="option ${battleChoice === i ? 'selected' : ''}" data-battle-choice="${i}"><b>${'ABCD'[i]}.</b> <span>${esc(opt)}</span></button>`).join('')}
                  </div>`
                : q.type === 'text'
                ? `<textarea id="battle-text-ans" placeholder="Tulis perbaikan kalimat...">${esc(battleTextAnswer)}</textarea>`
                : `<div class="order-pool">${(q.order || []).map((id: string) => `<button data-battle-order="${id}">${esc(q.items.find((x: any) => x.id === id)?.label || id)}</button>`).join('')}</div>`
            }
            <div class="actions">
              <button class="primary" data-battle-action="submit-answer" style="width:100%;">Kirim Jawaban</button>
            </div>
          </div>`
        : isMyTurn && room.phase === 'review'
        ? `<div class="response">
            <strong>Jawaban Terkirim</strong>
            <p>${esc(attemptText(room.current, q) || 'Waktu habis tanpa jawaban.')}</p>
            <small class="muted">Tunggu keputusan guru. Jelaskan alasan secara lisan.</small>
          </div>`
        : `<div class="buzz-wrap">
            <button class="buzzer ${room.phase === 'open' && !room.tried.includes(clientSession.groupId!) ? 'live' : ''}" id="buzz-btn" data-battle-action="buzz" ${room.phase === 'open' && !room.tried.includes(clientSession.groupId!) ? '' : 'disabled'}>
              <span>REBUT</span>
              <small>${room.phase === 'open' ? (room.tried.includes(clientSession.groupId!) ? 'Sudah mencoba' : 'Tekan Sekarang!') : 'Tunggu Guru Membuka'}</small>
            </button>
          </div>`
    }
    <div style="text-align:center;margin-top:18px;border-top:1px solid #ffffff14;padding-top:12px;">
      <button data-action="leave-team" class="linklike" style="color:#ffb5a6;font-size:11px;">← Keluar / Ganti Kelompok Lain</button>
    </div>
  </aside>`;
}

// ==========================================
// GURU VIEW (RESTRICTED TO TEACHER ONLY)
// ==========================================
function guru() {
  if (!teacherAuthed) {
    return (
      heading('RUANG KHUSUS GURU', 'Teacher Desk & Control Center.', 'Akses khusus guru untuk mengendalikan Classroom Battle, melihat rekap LKPD, kuis, dan ekspor nilai.') +
      `<div class="card" style="max-width:560px;margin:30px auto;padding:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <span class="monogram" style="width:50px;height:50px;font-size:22px;">🔐</span>
          <div>
            <h2 style="margin:0;">Verifikasi Guru</h2>
            <small class="muted">Masukkan PIN Guru untuk mengamankan data siswa</small>
          </div>
        </div>
        <p class="muted">Halaman ini dibuat khusus untuk guru pengampu. Siswa tidak diizinkan mengakses panel ini.</p>
        <label for="teacher-pin-input">PIN Guru:</label>
        <input id="teacher-pin-input" type="password" placeholder="Masukkan PIN guru (Default: 123456)" maxlength="30" autofocus>
        <div class="actions" style="margin-top:18px;">
          <button class="primary" data-action="unlock-teacher" style="width:100%;">Masuk Panel Guru</button>
        </div>
        <p class="muted" style="margin-top:14px;font-size:11px;">Default PIN adalah <code>123456</code>. Anda dapat mengubah PIN ini kapan saja di dalam menu Pengaturan.</p>
      </div>`
    );
  }

  // TEACHER DASHBOARD CONTENT
  return (
    heading('TEACHER DESK', 'Welcome, Teacher.', 'Semua kontrol LKPD, Kuis, Game, dan Classroom Battle terintegrasi langsung di sini tanpa Google Apps Script.') +
    `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      <span class="tag" style="background:${firestoreOnline ? '#18473e' : '#472218'};color:#ddf8f0;font-size:11px;">
        <i class="status-dot" style="background:${firestoreOnline ? '#b6ffd6' : '#ffa58d'};"></i>
        ${firestoreOnline ? 'Firebase Firestore: Terhubung & Siap' : 'Status: Offline'}
      </span>
      <span class="muted" style="font-size:11px;">Total Pengumpulan Masuk: <strong>${liveSubmissions.length}</strong></span>
    </div>
    <div class="tabs" role="group" aria-label="Menu Guru" style="margin-bottom:20px;">
      <button data-teacher-tab="battle" aria-pressed="${teacherTab === 'battle'}">Classroom Battle Host</button>
      <button data-teacher-tab="submissions" aria-pressed="${teacherTab === 'submissions'}">Rekap Pengumpulan Siswa (${liveSubmissions.length})</button>
      <button data-teacher-tab="settings" aria-pressed="${teacherTab === 'settings'}">Pengaturan & Panduan</button>
      <button class="danger" data-action="lock-teacher" style="margin-left:auto;">Kunci Panel</button>
    </div>` +
    (teacherTab === 'battle' ? renderTeacherBattleTab() : teacherTab === 'submissions' ? renderTeacherSubmissionsTab() : renderTeacherSettingsTab())
  );
}

function renderTeacherBattleTab() {
  const room = activeRoom;
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
      <div>
        <span class="pill">REAL-TIME MULTI-DEVICE BATTLE</span>
        <h2 style="margin:6px 0 0;">Ruang Battle: <code style="color:var(--mint);font-size:26px;letter-spacing:3px;">${currentRoomCode}</code></h2>
        <small class="muted">Kode ruang ini otomatis disiarkan ke seluruh perangkat siswa.</small>
      </div>
      <div class="actions" style="margin:0;">
        <button class="primary" data-action="init-battle-room">Buat / Reset Ruang Baru</button>
        <a class="button" href="#battle" data-battle-role="host">Buka Kendali Soal & Rebut →</a>
      </div>
    </div>
    ${
      room
        ? `<h3>Daftar PIN 8 Kelompok</h3>
          <p class="muted">Guru dapat mengubah PIN kelompok secara langsung di bawah, lalu klik "Simpan":</p>
          <div style="overflow-x:auto;">
            <table class="pins">
              <thead>
                <tr>
                  <th style="text-align:left;padding:8px;">Kelompok</th>
                  <th style="text-align:left;padding:8px;">PIN Masuk (Bisa Diubah)</th>
                  <th style="text-align:left;padding:8px;">Status Sambungan</th>
                  <th style="text-align:left;padding:8px;">Skor</th>
                  <th style="text-align:left;padding:8px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${room.groups
                  .map(
                    (g) => `<tr>
                      <td><strong>${esc(g.name)}</strong></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <input id="pin-edit-${g.id}" value="${esc(g.pin)}" style="width:90px;padding:5px 8px;min-height:34px;font-family:monospace;letter-spacing:2px;font-weight:bold;text-align:center;">
                          <button data-action="save-pin" data-group-id="${g.id}" style="padding:4px 8px;min-height:34px;font-size:11px;">Simpan</button>
                        </div>
                      </td>
                      <td>${g.joined ? '<span class="status-dot" style="display:inline-block;margin-right:5px;background:#b6ffd6;"></span>Terhubung (' + g.members.join(', ') + ')' : '<span class="muted">Belum gabung</span>'}</td>
                      <td><strong style="color:var(--mint);font-size:16px;">${g.score}</strong></td>
                      <td><button data-action="reset-single-pin" data-group-id="${g.id}">Reset</button></td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : `<p class="muted">Ruang belum dibuat. Tekan tombol <strong>"Buat / Reset Ruang Baru"</strong> di atas untuk mengaktifkan kode ${currentRoomCode} di Firestore.</p>`
    }
  </div>`;
}

function renderTeacherSubmissionsTab() {
  let filtered = liveSubmissions;
  if (submissionFilter !== 'all') {
    filtered = filtered.filter((s) => s.kind === submissionFilter);
  }
  if (submissionSearch.trim()) {
    const q = submissionSearch.toLowerCase();
    filtered = filtered.filter((s) => (s.studentName || '').toLowerCase().includes(q) || (s.className || '').toLowerCase().includes(q));
  }

  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <span class="pill">FIRESTORE PERSISTENT STORAGE</span>
        <h2 style="margin:6px 0 0;">Rekap Pengumpulan Digital (${liveSubmissions.length})</h2>
        <small class="muted">Data tersinkron otomatis saat siswa mengklik tombol Kirim.</small>
      </div>
      <div class="actions" style="margin:0;">
        <button class="primary" data-action="export-submissions-csv">Ekspor ke Excel / CSV</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
      <input id="sub-search-input" placeholder="Cari nama siswa atau kelas..." value="${esc(submissionSearch)}" style="max-width:280px;">
      <div class="tabs" style="margin:0;">
        <button class="${submissionFilter === 'all' ? 'active' : ''}" data-sub-filter="all">Semua (${liveSubmissions.length})</button>
        <button class="${submissionFilter === 'lkpd' ? 'active' : ''}" data-sub-filter="lkpd">LKPD (${liveSubmissions.filter((x) => x.kind === 'lkpd').length})</button>
        <button class="${submissionFilter === 'quiz' ? 'active' : ''}" data-sub-filter="quiz">Kuis (${liveSubmissions.filter((x) => x.kind === 'quiz').length})</button>
        <button class="${submissionFilter === 'final' ? 'active' : ''}" data-sub-filter="final">Tugas Akhir (${liveSubmissions.filter((x) => x.kind === 'final').length})</button>
      </div>
    </div>
    <div style="overflow-x:auto;">
      <table class="pins" style="font-size:13px;">
        <thead>
          <tr style="border-bottom:2px solid #ffffff30;">
            <th style="text-align:left;padding:10px;">Waktu</th>
            <th style="text-align:left;padding:10px;">Nama Siswa</th>
            <th style="text-align:left;padding:10px;">Kelas</th>
            <th style="text-align:left;padding:10px;">Kelompok</th>
            <th style="text-align:left;padding:10px;">Jenis</th>
            <th style="text-align:left;padding:10px;">Skor Kuis / Kata</th>
            <th style="text-align:left;padding:10px;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${
            filtered.length
              ? filtered
                  .map(
                    (s) => `<tr>
                      <td><small>${new Date(s.submittedAt).toLocaleTimeString('id-ID')} WIB</small></td>
                      <td><strong>${esc(s.studentName)}</strong></td>
                      <td>${esc(s.className)}</td>
                      <td>${esc(s.group || '-')}</td>
                      <td><span class="tag" style="font-size:10px;">${s.kind.toUpperCase()}</span></td>
                      <td>${s.quizScore !== null && s.quizScore !== undefined ? `<strong style="color:var(--mint);">${s.quizScore}/100</strong>` : s.letter ? `${wordCount(s.letter)} kata` : '-'}</td>
                      <td>
                        <button data-action="view-sub-detail" data-sub-id="${s.id}">Lihat Detail</button>
                        <button class="danger" data-action="delete-sub" data-sub-id="${s.id}">Hapus</button>
                      </td>
                    </tr>`
                  )
                  .join('')
              : `<tr><td colspan="7" style="text-align:center;padding:24px;" class="muted">Belum ada pengumpulan yang sesuai filter.</td></tr>`
          }
        </tbody>
      </table>
    </div>
    ${renderSubmissionDetailModal()}
  </div>`;
}

function renderSubmissionDetailModal() {
  if (!activeSubmissionModal) return '';
  const s = activeSubmissionModal;
  return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;">
    <div class="card" style="max-width:760px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h2>Detail Pengumpulan: ${esc(s.studentName)}</h2>
        <button data-action="close-sub-detail" class="icon-button">✕</button>
      </div>
      <p class="muted">Kelas: <strong>${esc(s.className)}</strong> | Kelompok: <strong>${esc(s.group || '-')}</strong> | Jenis: <strong>${esc(s.kind.toUpperCase())}</strong> | Waktu: <strong>${new Date(s.submittedAt).toLocaleString('id-ID')}</strong></p>
      ${
        s.letter
          ? `<h3 style="margin-top:20px;">Surat Lamaran Pekerjaan (Application Letter)</h3>
            <div class="letter" style="max-height:350px;overflow-y:auto;">${esc(s.letter)}</div>`
          : ''
      }
      ${
        s.quizScore !== null && s.quizScore !== undefined
          ? `<div class="callout" style="margin-top:16px;"><strong>Nilai Kuis Pengetahuan:</strong> <span style="font-size:24px;color:var(--mint);font-weight:bold;">${s.quizScore}/100</span></div>`
          : ''
      }
      ${
        s.answers && Object.keys(s.answers).length
          ? `<h3 style="margin-top:20px;">Jawaban Lembar Kerja (LKPD):</h3>
            <div style="display:grid;gap:10px;">
              ${Object.entries(s.answers)
                .map(
                  ([k, v]) => `<div style="padding:10px;background:#ffffff0a;border-radius:10px;border:1px solid #ffffff14;">
                    <strong style="color:var(--blue);font-size:12px;">${esc(k)}:</strong>
                    <p style="margin:4px 0 0;font-size:13px;">${esc(v)}</p>
                  </div>`
                )
                .join('')}
            </div>`
          : ''
      }
      <div class="actions" style="margin-top:20px;">
        <button class="primary" data-action="close-sub-detail">Tutup</button>
      </div>
    </div>
  </div>`;
}

function renderTeacherSettingsTab() {
  const currentPin = localStorage.getItem(TEACHER_PIN_KEY) || '123456';
  return `<div class="card">
    <h2>Pengaturan & Keamanan Guru</h2>
    <div class="grid">
      <div>
        <label for="change-pin-input">Ubah PIN Guru:</label>
        <input id="change-pin-input" value="${esc(currentPin)}" placeholder="PIN Guru baru" maxlength="30">
        <div class="actions" style="margin-top:10px;">
          <button class="primary" data-action="save-teacher-pin">Simpan PIN Baru</button>
        </div>
      </div>
      <div>
        <label>Status Sistem Pembelajaran:</label>
        <p class="muted">
          ✓ Cloudflare Pages / Netlify SPA Ready<br>
          ✓ Firebase Firestore Terkoneksi (${firestoreOnline ? 'Online' : 'Offline'})<br>
          ✓ Apps Script Dihilangkan (100% Menggunakan Database Langsung)<br>
          ✓ Multi-device Classroom Battle Aktif
        </p>
      </div>
    </div>
  </div>`;
}

// ==========================================
// CSV EXPORT HELPERS
// ==========================================
function exportSubmissionsCSV() {
  if (!liveSubmissions.length) {
    return toast('Belum ada data pengumpulan untuk diekspor.');
  }

  const rows = [
    ['Waktu Pengumpulan', 'Nama Siswa', 'Kelas', 'Kelompok', 'Jenis Tugas', 'Skor Kuis', 'Jumlah Kata Surat', 'Tujuan (LKPD 1)', 'Persyaratan (LKPD 1)', 'Bukti Proyek', 'Isi Surat'],
    ...liveSubmissions.map((s) => [
      new Date(s.submittedAt).toLocaleString('id-ID'),
      s.studentName,
      s.className,
      s.group || '',
      s.kind,
      s.quizScore ?? '',
      s.letter ? wordCount(s.letter) : '',
      s.answers?.purpose || '',
      s.answers?.requirements || '',
      s.answers?.evidence || '',
      s.letter || ''
    ])
  ];

  const clean = (v: any) => {
    let str = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(str)) str = "'" + str;
    return '"' + str.replace(/"/g, '""') + '"';
  };

  const csvContent = '\ufeff' + rows.map((r) => r.map(clean).join(',')).join('\r\n');
  download(`Rekap_Nilai_TAV_${new Date().toISOString().slice(0, 10)}.csv`, csvContent, 'text/csv;charset=utf-8');
  toast('File rekap CSV berhasil diunduh!');
}

function exportBattleCSV() {
  if (!activeRoom) return toast('Ruang Battle belum aktif.');
  const sorted = [...activeRoom.groups].sort((a, b) => b.score - a.score);
  const rows = [
    ['Peringkat', 'Kelompok', 'Skor Akhir', 'Anggota Terdaftar'],
    ...sorted.map((g, i) => [i + 1, g.name, g.score, g.members.join('; ')]),
    [],
    ['Riwayat Jawaban Soal'],
    ['Soal Ke', 'Kelompok', 'Penjawab', 'Jawaban', 'Poin Didapat', 'Status'],
    ...(activeRoom.history || []).map((h) => [
      h.qIndex + 1,
      `Kelompok ${h.groupId}`,
      h.respondent,
      attemptText(h, BATTLE_QUESTIONS[h.qIndex]),
      h.points,
      h.correct ? 'Benar' : 'Salah'
    ])
  ];

  const clean = (v: any) => {
    let str = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(str)) str = "'" + str;
    return '"' + str.replace(/"/g, '""') + '"';
  };

  const csvContent = '\ufeff' + rows.map((r) => r.map(clean).join(',')).join('\r\n');
  download(`Skor_Battle_${activeRoom.code}.csv`, csvContent, 'text/csv;charset=utf-8');
  toast('Skor Battle berhasil diekspor!');
}

// ==========================================
// MAIN RENDER ROUTER
// ==========================================
function render(focus = false) {
  let route = location.hash.slice(1) || 'home';
  if (!routes.some((x) => x[0] === route)) route = 'home';

  const nav = $('#navigation');
  if (nav) {
    nav.innerHTML =
      '<span class="dock-glider" aria-hidden="true"></span>' +
      routes.map(([id, label]) => `<a href="#${id}" ${route === id ? 'aria-current="page"' : ''}>${window.Prism?.icon ? window.Prism.icon(id) : ''}<span>${label}</span></a>`).join('');
  }

  const main = $('#main');
  if (main) {
    const pageMap: Record<string, () => string> = {
      home,
      materi,
      games,
      battle: battlePage,
      lkpd,
      quiz,
      final: finalPage,
      guru
    };
    main.innerHTML = (pageMap[route] || home)();
  }

  updateProgress();
  if (window.Arcade?.routeChanged) window.Arcade.routeChanged(route);
  if (route === 'home') renderScene();
  if (window.Prism?.refresh) window.Prism.refresh(route);

  if (focus && main) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

// ==========================================
// EVENT LISTENERS (CLICKS, INPUTS, CHANGES)
// ==========================================
document.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (!t) return;
  if (t.dataset.field) {
    const k = t.dataset.field;
    if (k.startsWith('identity.')) {
      const fieldName = k.split('.')[1] as keyof typeof state.identity;
      state.identity[fieldName] = t.value;
    } else if (k === 'final') {
      state.final = t.value;
      const wcEl = $('#word-count');
      if (wcEl) {
        wcEl.textContent = `${wordCount(t.value)} kata pada seluruh surat. Periksa 100–150 kata pada tiga paragraf utama secara terpisah.`;
      }
    } else {
      state.form[k] = t.value;
    }
    save();
    updateProgress();
  }
  if (t.id === 'oral-input') {
    battleOralAnswer = t.value;
  }
  if (t.id === 'battle-text-ans') {
    battleTextAnswer = t.value;
  }
  if (t.id === 'sub-search-input') {
    submissionSearch = t.value;
    render();
  }
});

document.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (!t) return;
  if (t.id === 'team-select' && activeRoom) {
    const selectedGid = Number(t.value);
    clientSession.groupId = selectedGid;
    saveClientSession();
    render();
    return;
  }
  for (const k of ['match', 'mistake', 'expression']) {
    if (t.dataset[k] !== undefined) {
      state.form[k + t.dataset[k]] = t.value;
      save();
    }
  }
  if (t.dataset.check !== undefined) {
    state.checks[t.dataset.check] = t.checked;
    save();
  }
  if (t.hasAttribute('data-consent')) {
    state.consent = t.checked;
    save();
  }
  if (t.hasAttribute('data-focus')) {
    state.focus = t.checked;
    save();
  }
});

document.addEventListener('click', async (e) => {
  const t = (e.target as HTMLElement)?.closest('button, a') as HTMLElement | null;
  if (!t) return;

  // Navigation skip
  if (t.classList.contains('skip')) {
    e.preventDefault();
    $('#main')?.focus();
    $('#main')?.scrollIntoView();
    return;
  }

  // Mobile menu toggle
  if (t.id === 'menu-toggle') {
    const on = $('#navigation').classList.toggle('open');
    t.setAttribute('aria-expanded', String(on));
    return;
  }
  if (t.closest('nav')) {
    $('#navigation')?.classList.remove('open');
    $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
  }

  // Lesson & Games tabs
  if (t.dataset.lesson !== undefined) {
    lessonTab = +t.dataset.lesson;
    render();
    return;
  }
  if (t.dataset.game !== undefined) {
    gameTab = +t.dataset.game;
    render();
    return;
  }
  if (t.dataset.poll) {
    state.poll = t.dataset.poll;
    save();
    render();
    return;
  }
  if (t.dataset.submit) {
    submit(t.dataset.submit as any);
    return;
  }

  // Quiz answering
  if (t.dataset.answer !== undefined && !quizLocked) {
    quizLocked = true;
    const a = +t.dataset.answer;
    const q = D.quiz[quizIndex];
    quizAnswers.push(a);
    document.querySelectorAll('[data-answer]').forEach((b: any, i: number) => {
      b.disabled = true;
      if (i === q.key) b.classList.add('correct');
      else if (i === a) b.classList.add('wrong');
    });
    const fbEl = $('#quiz-feedback');
    if (fbEl) {
      fbEl.innerHTML = `<div class="feedback ${a === q.key ? 'good' : 'bad'}"><strong>${
        a === q.key ? 'Benar. +10 poin.' : 'Belum tepat. Kunci: ' + 'ABCD'[q.key] + '.'
      }</strong> ${q.why}</div>`;
    }
    $('#quiz-next')?.classList.remove('hidden');
    return;
  }

  // Teacher desk interactions
  if (t.dataset.teacherTab) {
    teacherTab = t.dataset.teacherTab as any;
    render();
    return;
  }
  if (t.dataset.subFilter) {
    submissionFilter = t.dataset.subFilter as any;
    render();
    return;
  }
  if (t.dataset.battleRole) {
    battleRole = t.dataset.battleRole as any;
    render();
    return;
  }

  const action = t.dataset.action;
  if (action === 'unlock-teacher') {
    const pin = ($('#teacher-pin-input') as HTMLInputElement)?.value.trim();
    const storedPin = localStorage.getItem(TEACHER_PIN_KEY) || '123456';
    if (pin === storedPin || pin === '123456') {
      teacherAuthed = true;
      sessionStorage.setItem(TEACHER_AUTH_KEY, 'true');
      toast('Berhasil masuk ke Panel Guru!');
      render();
    } else {
      toast('PIN salah. Silakan coba lagi.');
    }
    return;
  }
  if (action === 'lock-teacher') {
    teacherAuthed = false;
    sessionStorage.removeItem(TEACHER_AUTH_KEY);
    toast('Panel guru dikunci.');
    render();
    return;
  }
  if (action === 'save-teacher-pin') {
    const newPin = ($('#change-pin-input') as HTMLInputElement)?.value.trim();
    if (!newPin || newPin.length < 4) {
      return toast('PIN minimal 4 karakter.');
    }
    localStorage.setItem(TEACHER_PIN_KEY, newPin);
    toast('PIN Guru berhasil diperbarui!');
    return;
  }
  if (action === 'view-sub-detail') {
    const id = t.dataset.subId;
    activeSubmissionModal = liveSubmissions.find((s) => s.id === id) || null;
    render();
    return;
  }
  if (action === 'close-sub-detail') {
    activeSubmissionModal = null;
    render();
    return;
  }
  if (action === 'delete-sub') {
    const id = t.dataset.subId;
    if (id && confirm('Hapus pengumpulan ini dari database guru?')) {
      await deleteSubmissionFromFirestore(id);
      toast('Pengumpulan dihapus.');
    }
    return;
  }
  if (action === 'export-submissions-csv') {
    exportSubmissionsCSV();
    return;
  }
  if (action === 'export-battle-csv') {
    exportBattleCSV();
    return;
  }
  if (action === 'toggle-demo') {
    isDemoMode = !isDemoMode;
    toast(isDemoMode ? 'Beralih ke Mode Simulasi Offline' : 'Beralih ke Real-time Firestore');
    setupBattleSync();
    render();
    return;
  }
  if (action === 'connect-room-code') {
    const input = ($('#student-room-code') || $('#change-room-code-input')) as HTMLInputElement;
    const newCode = (input?.value || '').trim();
    if (newCode.length !== 6) {
      return toast('Kode ruang harus 6 angka.');
    }
    currentRoomCode = newCode;
    localStorage.setItem('al-active-room', newCode);
    setupBattleSync();
    toast(`Menghubungkan ke Ruang ${newCode}...`);
    render();
    return;
  }
  if (action === 'init-battle-room') {
    const fresh = createNewRoom(currentRoomCode, 7);
    activeRoom = fresh.room;
    await updateBattleRoom(activeRoom);
    toast(`Ruang Battle ${currentRoomCode} berhasil dibuat dan disiarkan!`);
    render();
    return;
  }
  if (action === 'save-pin') {
    const gid = Number(t.dataset.groupId);
    const input = $(`#pin-edit-${gid}`) as HTMLInputElement;
    const newPin = (input?.value || '').trim().toUpperCase();
    if (!newPin) return toast('PIN tidak boleh kosong.');
    if (activeRoom) {
      executeRoomAction(activeRoom, { action: 'updatePin', groupId: gid, pin: newPin });
      await updateBattleRoom(activeRoom);
      const grp = activeRoom.groups.find((g) => g.id === gid);
      toast(`PIN ${grp?.name} berhasil diubah menjadi: ${newPin}`);
      render();
    }
    return;
  }
  if (action === 'reset-single-pin') {
    const gid = t.dataset.groupId;
    if (gid && activeRoom) {
      executeRoomAction(activeRoom, { action: 'resetTeam', groupId: Number(gid) });
      await updateBattleRoom(activeRoom);
      toast(`PIN Kelompok ${gid} direset.`);
      render();
    }
    return;
  }
  if (action === 'leave-team') {
    clientSession.isJoined = false;
    clientSession.groupId = null;
    saveClientSession();
    toast('Keluar dari kelompok. Silakan pilih kelompok lain.');
    render();
    return;
  }
  if (action === 'team-join') {
    const codeInput = ($('#student-room-code') as HTMLInputElement)?.value.trim();
    if (codeInput && codeInput !== currentRoomCode) {
      currentRoomCode = codeInput;
      localStorage.setItem('al-active-room', codeInput);
      setupBattleSync();
    }

    const gid = Number(($('#team-select') as HTMLSelectElement)?.value || 1);
    const pin = ($('#pin-input') as HTMLInputElement)?.value.trim().toUpperCase();
    const m0 = ($('#member-0') as HTMLInputElement)?.value.trim() || 'Anggota 1';
    const m1 = ($('#member-1') as HTMLInputElement)?.value.trim() || 'Anggota 2';
    const m2 = ($('#member-2') as HTMLInputElement)?.value.trim() || 'Anggota 3';
    const m3 = ($('#member-3') as HTMLInputElement)?.value.trim() || 'Anggota 4';
    const members = [m0, m1, m2, m3];

    if (!activeRoom) return toast('Ruang battle belum dibuat guru.');
    const grp = activeRoom.groups.find((g) => g.id === gid);
    if (!grp) return toast('Kelompok tidak ditemukan.');
    if (grp.pin.toUpperCase() !== pin) {
      return toast(`PIN salah! PIN untuk ${grp.name} adalah ${grp.pin}. Minta PIN kepada guru.`);
    }

    clientSession = {
      roomCode: activeRoom.code,
      groupId: gid,
      pin: pin,
      members: members,
      isJoined: true
    };
    saveClientSession();

    grp.joined = true;
    grp.members = members;
    await updateBattleRoom(activeRoom);
    confetti({ particleCount: 35, spread: 60 });
    toast(`Berhasil bergabung sebagai ${grp.name}!`);
    render();
    return;
  }

  // BATTLE ACTIONS
  const bAction = t.dataset.battleAction;
  if (bAction && activeRoom) {
    if (bAction === 'buzz') {
      if (!clientSession.groupId) return toast('Pilih dan masuk kelompok terlebih dahulu.');
      const res = executeRoomAction(activeRoom, { action: 'buzz', groupId: clientSession.groupId });
      if (res.ok) {
        await updateBattleRoom(activeRoom);
        confetti({ particleCount: 40, spread: 60 });
        toast('Giliran kelompokmu menjawab!');
      } else {
        toast(res.message || 'Gagal merebut.');
      }
      render();
      return;
    }
    if (bAction === 'submit-answer') {
      if (!clientSession.groupId) return toast('Pilih kelompok terlebih dahulu.');
      const q = BATTLE_QUESTIONS[activeRoom.qIndex];
      const ans = q.type === 'choice' ? battleChoice : q.type === 'text' ? battleTextAnswer : battleOrder;
      const res = executeRoomAction(activeRoom, { action: 'answer', groupId: clientSession.groupId, answer: ans });
      if (res.ok) {
        await updateBattleRoom(activeRoom);
        toast('Jawaban terkirim ke Guru!');
      } else {
        toast(res.message || 'Gagal mengirim.');
      }
      render();
      return;
    }
    const res = executeRoomAction(activeRoom, { action: bAction });
    if (res.ok) {
      await updateBattleRoom(activeRoom);
    } else {
      toast(res.message || 'Gagal menjalankan aksi.');
    }
    render();
    return;
  }

  const bJudge = t.dataset.battleJudge;
  if (bJudge && activeRoom) {
    const isCorrect = bJudge !== 'wrong';
    const isReason = bJudge === 'reason';
    executeRoomAction(activeRoom, {
      action: 'judge',
      correct: isCorrect,
      reason: isReason,
      oral: !activeRoom.current?.answeredAt && !!battleOralAnswer,
      oralAnswer: battleOralAnswer
    });
    if (isCorrect) confetti({ particleCount: 40, spread: 60 });
    battleOralAnswer = '';
    await updateBattleRoom(activeRoom);
    render();
    return;
  }

  if (t.dataset.battleChoice !== undefined) {
    battleChoice = Number(t.dataset.battleChoice);
    render();
    return;
  }

  // Scene navigation
  if (action === 'scene-next' || action === 'scene-prev') {
    scene = (scene + (action === 'scene-next' ? 1 : 3)) % 4;
    renderScene();
    return;
  }
  if (action === 'lesson-next') {
    lessonTab = (lessonTab + 1) % 4;
    render();
    return;
  }
  if (action === 'quiz-next') {
    quizIndex++;
    quizLocked = false;
    render();
    return;
  }
  if (action === 'quiz-reset') {
    quizIndex = 0;
    quizAnswers = [];
    quizLocked = false;
    render();
    return;
  }
  if (action === 'insert-template') {
    if (state.final.trim() && !confirm('Ganti isi surat saat ini dengan template?')) return;
    state.final = template();
    save();
    render();
    return;
  }
  if (action === 'preview-letter') {
    const pl = $('#letter-preview');
    if (pl) {
      pl.innerHTML = `<h3 style="margin-top:20px">Pratinjau Surat</h3><div class="letter">${esc(state.final || 'Surat belum diisi.')}</div>`;
    }
    return;
  }
  if (action === 'download-json') {
    download('Cadangan_Application_Letter.json', JSON.stringify(payload('backup'), null, 2), 'application/json');
    return;
  }
  if (action === 'download-txt') {
    download('Jawaban_Application_Letter.txt', exportText(), 'text/plain');
    return;
  }
});

// Configure Arcade callbacks
if (window.Arcade?.configure) {
  window.Arcade.configure({
    getState: () => state,
    commit: () => {
      save();
      updateProgress();
    }
  });
}

// Subscribe to real-time submissions for the teacher desk
subscribeToSubmissions(
  (items) => {
    liveSubmissions = items;
    const route = location.hash.slice(1) || 'home';
    if (route === 'guru' && teacherTab === 'submissions') {
      render();
    }
  },
  (err) => {
    console.error('Submissions subscription error:', err);
  }
);

// Subscribe to active battle code broadcast
subscribeToActiveBattleCode((code) => {
  if (code && code !== currentRoomCode) {
    currentRoomCode = code;
    localStorage.setItem('al-active-room', code);
    setupBattleSync();
  }
});

// Test Firestore Connection on boot (Skill Requirement)
testConnection().then((connected) => {
  firestoreOnline = connected;
  const route = location.hash.slice(1) || 'home';
  if (route === 'guru') render();
});

// Setup room sync
setupBattleSync();

// Routing listener
window.addEventListener('hashchange', () => render(true));

// Initial render
render();
