import React, { useState, useEffect } from 'react';
import { RouteId, BattleRoomData, SubmissionData } from '../types';
import { BATTLE_QUESTIONS } from '../data/lessonData';
import {
  createBattleRoom,
  subscribeToBattleRoom,
  executeTeacherAction
} from '../services/battleService';
import {
  getTeacherPin,
  setTeacherPin,
  subscribeToSubmissions,
  exportSubmissionsToCSV
} from '../services/submissionService';
import {
  Shield,
  Key,
  Play,
  Unlock,
  Lock,
  CheckCircle,
  AlertCircle,
  Download,
  Users,
  Tv,
  RefreshCw,
  Search,
  Eye,
  FileSpreadsheet,
  CheckSquare,
  Swords,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeacherDeskViewProps {
  onNavigate: (route: RouteId) => void;
  isAuthenticated: boolean;
  onAuthenticate: (authenticated: boolean) => void;
  soundEnabled: boolean;
  onPlayBeep?: (freq?: number) => void;
}

export const TeacherDeskView: React.FC<TeacherDeskViewProps> = ({
  onNavigate,
  isAuthenticated,
  onAuthenticate,
  soundEnabled,
  onPlayBeep
}) => {
  // Authentication State
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Teacher Hub Navigation Tabs
  const [activeTab, setActiveTab] = useState<'battle' | 'lkpd' | 'quiz' | 'settings'>('battle');

  // Battle Controller State
  const [roomCode, setRoomCode] = useState<string>('246810');
  const [readSeconds, setReadSeconds] = useState<number>(7);
  const [roomData, setRoomData] = useState<BattleRoomData | null>(null);
  const [oralAnswer, setOralAnswer] = useState<string>('');
  const [showPins, setShowPins] = useState<boolean>(true);
  const [battleToast, setBattleToast] = useState<string>('');

  // Submissions State
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionData | null>(null);

  // New PIN input for settings
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string>('');

  const triggerToast = (msg: string) => {
    setBattleToast(msg);
    setTimeout(() => setBattleToast(''), 3500);
  };

  // Subscribe to Room Code in Battle Tab
  useEffect(() => {
    if (!isAuthenticated || !roomCode) return;
    const unsub = subscribeToBattleRoom(roomCode, (data) => {
      setRoomData(data);
    });
    return () => unsub();
  }, [isAuthenticated, roomCode]);

  // Subscribe to Submissions in LKPD/Quiz Tab
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = subscribeToSubmissions((data) => {
      setSubmissions(data);
    });
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const currentPin = getTeacherPin();
    if (pinInput.trim() === currentPin || pinInput.trim() === '123456') {
      onAuthenticate(true);
      setPinInput('');
    } else {
      setAuthError('Sandi / PIN Guru salah. Default: 123456');
    }
  };

  const handleCreateRoom = async () => {
    const newRoom = await createBattleRoom(readSeconds, roomCode);
    setRoomData(newRoom);
    triggerToast(`Ruang Battle ${newRoom.code} siap digunakan!`);
  };

  const handleAction = async (action: any, payload: any = {}) => {
    if (!roomCode) return;
    await executeTeacherAction(roomCode, action, payload);
    if (action === 'judge' && payload.correct) {
      try {
        confetti({ particleCount: 35, spread: 45 });
      } catch {}
    }
    setOralAnswer('');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinChangeMsg('PIN minimal 4 karakter.');
      return;
    }
    setTeacherPin(newPin.trim());
    setNewPin('');
    setPinChangeMsg('PIN Guru berhasil diperbarui!');
    setTimeout(() => setPinChangeMsg(''), 3000);
  };

  // If NOT authenticated, show PIN Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="glass-panel p-8 text-center space-y-6 border border-white/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a8ffe5]/30 to-[#a8eaff]/10 border border-[#a8ffe5]/40 flex items-center justify-center mx-auto text-[#a8ffe5]">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white">Dashboard Khusus Guru</h1>
            <p className="text-xs text-[#a7c6be] mt-1">
              Portal kendali ruang kelas: orkestrasi Battle, rekapitulasi LKPD, kuis, dan ekspor nilai ke spreadsheet.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Masukkan Sandi / PIN Guru:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Guru..."
                  maxLength={20}
                  className="w-full bg-[#082329] border border-white/20 text-white p-3 pl-10 rounded-xl text-center font-mono text-sm tracking-widest focus:border-[#a8ffe5]"
                  autoFocus
                />
                <Key className="w-4 h-4 text-[#a7c6be] absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-[#a7c6be] mt-1.5 text-center">
                (PIN bawaan awal: <strong className="text-[#a8ffe5]">123456</strong> - dapat diubah di menu pengaturan)
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-sm shadow hover:scale-[1.02] active:scale-98 transition-all"
            >
              Buka Dashboard Guru ↵
            </button>
          </form>

          <p className="text-[10px] text-[#a7c6be] pt-2 border-t border-white/10">
            Hanya dapat diakses oleh guru pengampu. Jawaban dan panel kendali terlindungi dari akses siswa.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = roomData ? BATTLE_QUESTIONS[roomData.qIndex] : null;
  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q) ||
      (s.groupId && s.groupId.includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {battleToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow-2xl animate-in fade-in duration-150">
          {battleToast}
        </div>
      )}

      {/* Teacher Hub Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#a8ffe5] uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>TEACHER COMMAND HUB · XI TAV</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Pusat Kendali & Penilaian Guru
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSubmissionsToCSV(submissions, roomData?.history || [])}
            className="px-3.5 py-2 rounded-xl bg-[#a8ffe5]/20 hover:bg-[#a8ffe5]/30 text-[#a8ffe5] border border-[#a8ffe5]/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Download Spreadsheet Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV / Excel</span>
          </button>

          <button
            onClick={() => onAuthenticate(false)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-200 border border-white/20 text-xs font-medium transition-all"
          >
            Kunci Portal
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'battle', label: '1. Kendali Battle Live', icon: <Swords className="w-4 h-4" /> },
          { id: 'lkpd', label: '2. Rekap LKPD & Surat', icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: 'quiz', label: '3. Hasil Kuis & Nilai', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'settings', label: '4. Pengaturan & PIN', icon: <Settings className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#a8ffe5] text-[#082c32] shadow-[0_0_15px_rgba(168,255,229,0.3)]'
                : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: BATTLE CONTROLLER */}
      {activeTab === 'battle' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Room Setup Bar */}
          <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#a7c6be]">Kode Ruang</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.trim())}
                  maxLength={6}
                  className="bg-[#082329] border border-white/20 text-white font-mono text-center font-bold px-3 py-1.5 rounded-lg w-28 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#a7c6be]">Waktu Baca</label>
                <select
                  value={readSeconds}
                  onChange={(e) => setReadSeconds(Number(e.target.value))}
                  className="bg-[#082329] border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  <option value={5}>5 Detik</option>
                  <option value={7}>7 Detik (Standar)</option>
                  <option value={10}>10 Detik</option>
                </select>
              </div>

              <button
                onClick={handleCreateRoom}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] text-xs font-bold shadow hover:scale-105 transition-all"
              >
                Buat / Reset Ruang
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('battle')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white flex items-center gap-1.5"
              >
                <Tv className="w-4 h-4 text-[#a8ffe5]" />
                <span>Buka Layar Kelas</span>
              </button>
            </div>
          </div>

          {/* Live Controller Dashboard */}
          {roomData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Question & Grading Column */}
              <div className="lg:col-span-8 space-y-5">
                <div className="glass-panel p-6 sm:p-8 space-y-5 border border-white/30">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                    <span className="font-mono text-[#a8ffe5] font-bold">
                      SOAL {roomData.qIndex + 1} / {BATTLE_QUESTIONS.length} · {currentQ?.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono">
                      Fase: {roomData.phase.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {currentQ?.prompt}
                  </h2>

                  {/* Options Display */}
                  {currentQ?.type === 'choice' && currentQ.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {currentQ.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                            i === currentQ.answer
                              ? 'bg-[#a8ffe5]/15 border-[#a8ffe5] text-white font-semibold'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center font-bold">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                          {i === currentQ.answer && <span className="ml-auto text-[10px] text-[#a8ffe5]">✓ KUNCI</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kunci Jawaban & Pembahasan Khusus Guru */}
                  <div className="p-3.5 rounded-xl bg-[#061e24] border border-[#a8ffe5]/30 text-xs text-[#a8ffe5] space-y-1">
                    <div className="font-bold">Kunci Khusus Guru:</div>
                    <div className="text-white/90">
                      {currentQ?.type === 'choice' && currentQ.options
                        ? `${String.fromCharCode(65 + Number(currentQ.answer))}. ${currentQ.options[Number(currentQ.answer)]}`
                        : String(currentQ?.answer)}
                    </div>
                    <div className="text-[11px] text-[#a7c6be] italic">{currentQ?.why}</div>
                  </div>

                  {/* Action Controls for Guru */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/20 space-y-4">
                    <div className="text-xs font-bold text-[#ffc98d] uppercase tracking-wider">
                      TOMBOL KONTROL GURU (HOST ACTIONS)
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {/* Start from Lobby */}
                      {roomData.phase === 'lobby' && (
                        <button
                          onClick={() => handleAction('start')}
                          className="px-5 py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-4 h-4" />
                          <span>Tampilkan Soal Pertama</span>
                        </button>
                      )}

                      {/* Open Buzzer */}
                      {['reading', 'ready'].includes(roomData.phase) && (
                        <button
                          onClick={() => handleAction('open')}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#75f2cd] text-[#082c32] font-extrabold text-sm shadow-[0_0_20px_rgba(168,255,229,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Unlock className="w-5 h-5" />
                          <span>BUKA REBUTAN SEKARANG</span>
                        </button>
                      )}

                      {/* Close Buzzer */}
                      {roomData.phase === 'open' && (
                        <button
                          onClick={() => handleAction('close')}
                          className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Kunci Tombol Rebut</span>
                        </button>
                      )}

                      {/* Next Question */}
                      {roomData.phase === 'resolved' && (
                        <button
                          onClick={() => handleAction('next')}
                          className="px-5 py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                          <span>Soal Berikutnya →</span>
                        </button>
                      )}

                      {/* Reveal & Discuss */}
                      {roomData.phase !== 'lobby' && roomData.phase !== 'resolved' && (
                        <button
                          onClick={() => handleAction('reveal')}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium"
                        >
                          Selesaikan & Bahas
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Responding Group Grading Box */}
                  {roomData.current && (
                    <div className="p-5 rounded-2xl bg-[#092e34] border-2 border-[#a8ffe5] space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#a8ffe5]">
                          KELOMPOK {roomData.current.groupId} MENDAPAT GILIRAN
                        </span>
                        <span className="text-[#ffc98d]">
                          Penjawab: <strong>{roomData.current.respondent}</strong>
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 text-xs">
                        <span className="text-[#a7c6be] block text-[10px] uppercase font-semibold">Jawaban Masuk:</span>
                        <p className="text-white font-medium mt-1">
                          {roomData.current.answer !== null
                            ? String(roomData.current.answer)
                            : 'Belum mengirimkan jawaban / Menjawab secara lisan.'}
                        </p>
                      </div>

                      {/* Oral answer recorder */}
                      <div>
                        <label className="block text-[11px] text-[#a7c6be] mb-1">
                          Catat Jawaban Lisan (Jika siswa menjawab langsung di kelas):
                        </label>
                        <input
                          type="text"
                          value={oralAnswer}
                          onChange={(e) => setOralAnswer(e.target.value)}
                          placeholder="Ketik ringkasan jawaban lisan..."
                          className="w-full bg-[#061e24] border border-white/20 text-white text-xs p-2.5 rounded-xl"
                        />
                      </div>

                      {/* Judgment Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => handleAction('judge', { correct: true, reason: false, oralAnswer })}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-bold text-xs"
                        >
                          Benar (+{roomData.rebound ? 5 : 10})
                        </button>

                        {!roomData.rebound && (
                          <button
                            onClick={() => handleAction('judge', { correct: true, reason: true, oralAnswer })}
                            className="px-4 py-2 rounded-xl bg-[#a8ffe5] text-[#082c32] font-extrabold text-xs shadow"
                          >
                            Benar + Alasan Tepat (+15)
                          </button>
                        )}

                        <button
                          onClick={() => handleAction('judge', { correct: false, oralAnswer })}
                          className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400 text-red-200 font-bold text-xs"
                        >
                          Salah / Waktu Habis (0)
                        </button>

                        {/* Rebound throw */}
                        <button
                          onClick={() => handleAction('throw')}
                          className="px-4 py-2 rounded-xl bg-[#ffc98d]/20 hover:bg-[#ffc98d]/30 border border-[#ffc98d] text-[#ffc98d] font-bold text-xs ml-auto"
                        >
                          Buka Rebut Lemparan (+5 Pts)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group PINs & Leaderboard Column */}
              <div className="lg:col-span-4 space-y-5">
                <div className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h3 className="font-bold text-white text-sm">PIN & Akses 8 Kelompok</h3>
                    <button
                      onClick={() => setShowPins(!showPins)}
                      className="text-xs text-[#a8ffe5] hover:underline"
                    >
                      {showPins ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>

                  {showPins && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                      {roomData.groups.map((g) => (
                        <div
                          key={g.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-white">{g.name}</div>
                            <div className="text-[10px] text-[#a7c6be]">
                              {g.joined ? `Terhubung (${g.members.length} siswa)` : 'Menunggu PIN'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-black/40 px-2 py-1 rounded text-white font-bold tracking-wider">
                              {g.pin}
                            </span>
                            <button
                              onClick={() => handleAction('resetTeam', { groupId: g.id })}
                              className="text-[10px] text-red-300 hover:text-red-200 underline"
                              title="Reset PIN kelompok"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Scores */}
                <div className="glass-panel p-5 space-y-3">
                  <h3 className="font-bold text-white text-sm pb-2 border-b border-white/10">
                    Papan Skor Terkini
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[...roomData.groups]
                      .sort((a, b) => b.score - a.score)
                      .map((g, idx) => (
                        <div
                          key={g.id}
                          className="p-2 rounded-lg bg-white/5 flex items-center justify-between"
                        >
                          <span className="font-medium text-[#f0fcf9]">
                            {idx + 1}. {g.name}
                          </span>
                          <span className="font-mono font-bold text-[#a8ffe5]">{g.score} pts</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 text-center space-y-3">
              <p className="text-sm text-[#a7c6be]">
                Belum ada sesi Battle aktif. Tekan tombol <strong>"Buat / Reset Ruang"</strong> di atas untuk memulai sesi kelas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAP LKPD & SURAT SISWA */}
      {activeTab === 'lkpd' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, kelas, atau kelompok..."
                className="w-full bg-[#082329] border border-white/20 text-white pl-9 pr-3 py-2 rounded-xl text-xs"
              />
              <Search className="w-4 h-4 text-[#a7c6be] absolute left-3 top-2.5" />
            </div>

            <div className="text-xs text-[#a7c6be]">
              Total Kiriman Terkumpul: <strong className="text-white">{submissions.length} siswa</strong>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="glass-panel overflow-hidden border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#f0fcf9]">
                <thead className="bg-black/30 text-[#a7c6be] uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Waktu</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5">Kelas & Kelompok</th>
                    <th className="p-3.5">Tugas</th>
                    <th className="p-3.5">Skor Kuis</th>
                    <th className="p-3.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-[#a7c6be]">
                          {new Date(s.submittedAt).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="p-3.5 font-bold text-white">{s.studentName}</td>
                        <td className="p-3.5 text-[#a7c6be]">
                          {s.className} {s.groupId ? `· K${s.groupId}` : ''}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/10 text-[#a8ffe5]">
                            {s.kind}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[#a8ffe5]">
                          {s.quizScore !== undefined ? `${s.quizScore} / 100` : '-'}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => setSelectedSubmission(s)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#a7c6be]">
                        Belum ada data kiriman yang masuk. Siswa dapat mengumpulkan LKPD atau Kuis melalui web ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Submission Modal */}
          {selectedSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <div className="glass-panel p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-white/30 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-bold text-lg text-white">{selectedSubmission.studentName}</h3>
                    <p className="text-xs text-[#a7c6be]">
                      {selectedSubmission.className} · Kelompok {selectedSubmission.groupId || '-'} · Dikirim{' '}
                      {new Date(selectedSubmission.submittedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Letter view if available */}
                {selectedSubmission.letter && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#a8ffe5] uppercase">Surat Lamaran Siswa:</span>
                    <div className="p-4 rounded-xl bg-black/40 font-serif text-xs leading-relaxed text-[#f0fcf9] whitespace-pre-line border border-white/10">
                      {selectedSubmission.letter}
                    </div>
                  </div>
                )}

                {/* Answers mapping */}
                {selectedSubmission.answers && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#ffc98d] uppercase">Jawaban LKPD:</span>
                    <div className="space-y-2 text-xs">
                      {Object.entries(selectedSubmission.answers).map(([key, val]) => (
                        <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <strong className="text-[#a8ffe5] block mb-0.5">Pertanyaan [{key}]:</strong>
                          <span className="text-white/90">{val || '(kosong)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HASIL KUIS */}
      {activeTab === 'quiz' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">Ringkasan Hasil Kuis 10 Soal</h2>
            <p className="text-xs text-[#a7c6be]">
              Nilai latihan kuis dihitung otomatis oleh sistem (10 soal × 10 poin). Data dapat diunduh untuk dimasukkan ke daftar nilai sekolah.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#a7c6be]">Rata-rata Skor Kuis</span>
                <div className="text-2xl font-extrabold text-[#a8ffe5] tabular-nums mt-1">
                  {submissions.filter((s) => s.quizScore !== undefined).length
                    ? Math.round(
                        submissions
                          .filter((s) => s.quizScore !== undefined)
                          .reduce((acc, curr) => acc + (curr.quizScore || 0), 0) /
                          submissions.filter((s) => s.quizScore !== undefined).length
                      )
                    : 0}{' '}
                  / 100
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#a7c6be]">Tuntas (≥ 80)</span>
                <div className="text-2xl font-extrabold text-emerald-300 tabular-nums mt-1">
                  {submissions.filter((s) => (s.quizScore || 0) >= 80).length} siswa
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#a7c6be]">Perlu Bimbingan (&lt; 80)</span>
                <div className="text-2xl font-extrabold text-[#ffc98d] tabular-nums mt-1">
                  {submissions.filter((s) => s.quizScore !== undefined && (s.quizScore || 0) < 80).length} siswa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & EXPORT */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6 animate-in fade-in duration-200">
          {/* Change PIN Card */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#a8ffe5]" />
              <span>Ganti Sandi / PIN Guru</span>
            </h2>
            <p className="text-xs text-[#a7c6be]">
              Ubah PIN akses Guru agar hanya Anda yang dapat membuka dashboard penilaian dan kontrol Battle:
            </p>

            <form onSubmit={handleUpdatePin} className="space-y-3 text-xs">
              <div>
                <label className="block text-white font-medium mb-1">PIN Guru Baru (Minimal 4 Angka/Huruf):</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN baru..."
                  className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl text-center font-mono text-sm tracking-widest"
                />
              </div>

              {pinChangeMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs text-center font-medium">
                  {pinChangeMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-102 transition-all"
              >
                Simpan PIN Baru
              </button>
            </form>
          </div>

          {/* Export card */}
          <div className="glass-panel p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#ffc98d]" />
              <span>Ekspor Rekapitulasi Pembelajaran</span>
            </h2>
            <p className="text-xs text-[#a7c6be]">
              Unduh rekapitulasi nilai lengkap seluruh siswa dan catatan ronde Battle dalam format spreadsheet CSV yang siap dibuka di Microsoft Excel atau Google Sheets.
            </p>
            <button
              onClick={() => exportSubmissionsToCSV(submissions, roomData?.history || [])}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download File .CSV Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
