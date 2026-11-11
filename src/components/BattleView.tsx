import React, { useState, useEffect } from 'react';
import { RouteId, BattleRoomData, GroupState } from '../types';
import { BATTLE_QUESTIONS } from '../data/lessonData';
import {
  subscribeToBattleRoom,
  joinBattleRoom,
  submitGroupBuzz,
  submitGroupAnswer
} from '../services/battleService';
import { Swords, Users, Shield, Tv, Clock, Trophy, CheckCircle, AlertTriangle, ArrowRight, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BattleViewProps {
  onNavigate: (route: RouteId) => void;
  soundEnabled: boolean;
  onPlayBeep?: (freq?: number) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({ onNavigate, soundEnabled, onPlayBeep }) => {
  // Session state
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      return localStorage.getItem('al_last_room_code') || '246810';
    } catch {
      return '246810';
    }
  });
  const [groupId, setGroupId] = useState<number>(1);
  const [pin, setPin] = useState<string>('');
  const [members, setMembers] = useState<string[]>(['', '', '', '']);
  const [joined, setJoined] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<BattleRoomData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Answering state
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [orderAnswers, setOrderAnswers] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Auto-subscribe to room code
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToBattleRoom(roomCode, (data) => {
      setRoomData(data);
      if (data) {
        // Sound cue when buzz is opened
        if (data.phase === 'open' && soundEnabled && onPlayBeep) {
          onPlayBeep(880);
        }
      }
    });
    return () => unsub();
  }, [roomCode, soundEnabled, onPlayBeep]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!roomCode.trim()) {
      setErrorMsg('Masukkan kode ruang 6 angka dari guru.');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('Masukkan PIN kelompok.');
      return;
    }
    if (members.some((m) => !m.trim())) {
      setErrorMsg('Harap isi 4 nama anggota kelompok.');
      return;
    }

    const res = await joinBattleRoom(roomCode, groupId, pin, members);
    if (res.ok) {
      setJoined(true);
      try {
        localStorage.setItem('al_last_room_code', roomCode);
      } catch {}
      showToast('Berhasil terhubung ke ruang kelas!');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleBuzz = async () => {
    if (!roomData || roomData.phase !== 'open') return;
    if (soundEnabled && onPlayBeep) {
      onPlayBeep(520);
    }
    const res = await submitGroupBuzz(roomCode, groupId, roomData.openEpoch);
    if (!res.ok) {
      showToast(res.message);
    } else {
      showToast('⚡ REBUTAN BERHASIL DITERIMA!');
    }
  };

  const handleSendAnswer = async () => {
    if (!roomData || !roomData.current || roomData.current.groupId !== groupId) return;
    const q = BATTLE_QUESTIONS[roomData.qIndex];
    let answerPayload: any = null;

    if (q.type === 'choice') {
      if (selectedChoice === null) return showToast('Pilih salah satu jawaban.');
      answerPayload = selectedChoice;
    } else if (q.type === 'text') {
      if (!textAnswer.trim()) return showToast('Tulis kalimat jawaban Anda.');
      answerPayload = textAnswer.trim();
    } else if (q.type === 'order') {
      if (orderAnswers.length !== (q.items?.length || 0)) return showToast('Urutkan seluruh bagian.');
      answerPayload = orderAnswers;
    }

    const res = await submitGroupAnswer(roomCode, groupId, roomData.current.id, answerPayload);
    if (res.ok) {
      showToast('Jawaban berhasil dikirim ke guru!');
      setSelectedChoice(null);
      setTextAnswer('');
      setOrderAnswers([]);
    } else {
      showToast(res.message);
    }
  };

  const currentQ = roomData ? BATTLE_QUESTIONS[roomData.qIndex] : null;
  const currentGroup = roomData?.groups.find((g) => g.id === groupId);
  const isMyGroupTurn = roomData?.current?.groupId === groupId;

  // Render Projector View (Layar Proyektor Kelas)
  if (isProjectorMode && roomData) {
    const sortedGroups = [...roomData.groups].sort((a, b) => b.score - a.score || a.id - b.id);

    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#a8ffe5]/20 text-[#a8ffe5] border border-[#a8ffe5]/40 text-xs font-bold uppercase tracking-wider">
              LAYAR KELAS (PROJECTOR DISPLAY)
            </span>
            <span className="font-mono text-sm text-white/80">
              KODE RUANG: <strong className="text-white text-base tracking-widest">{roomData.code}</strong>
            </span>
          </div>
          <button
            onClick={() => setIsProjectorMode(false)}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white"
          >
            Tutup Layar Proyektor ✕
          </button>
        </div>

        {/* Big Question Stage */}
        <div className="glass-panel p-8 sm:p-12 text-center space-y-6 border border-white/30">
          <div className="text-xs font-mono uppercase tracking-widest text-[#a8ffe5]">
            SOAL KE {roomData.qIndex + 1} DARI {BATTLE_QUESTIONS.length} · {currentQ?.category}
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-4xl mx-auto">
            {currentQ?.prompt}
          </h2>

          {/* Options Display for Choice */}
          {currentQ?.type === 'choice' && currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-4 text-left">
              {currentQ.options.map((opt, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/10 border border-white/20 text-sm sm:text-base text-white font-medium flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#a8ffe5]/20 text-[#a8ffe5] flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/20 inline-flex items-center gap-4 text-sm font-semibold">
            {roomData.phase === 'reading' && (
              <span className="text-[#ffc98d]">⏳ Membaca Soal... Menunggu guru membuka tombol rebut.</span>
            )}
            {roomData.phase === 'open' && (
              <span className="text-[#a8ffe5] animate-pulse">⚡ REBUTAN TERBUKA! Siapa tercepat?</span>
            )}
            {roomData.phase === 'answering' && (
              <span className="text-[#c2daff]">
                🎤 Kelompok {roomData.current?.groupId} mendapat giliran ({roomData.current?.respondent})
              </span>
            )}
            {roomData.phase === 'resolved' && (
              <span className="text-[#a8ffe5]">
                ✓ Selesai: +{roomData.current?.points} poin untuk Kelompok {roomData.current?.groupId}
              </span>
            )}
          </div>
        </div>

        {/* 8-Team Leaderboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sortedGroups.map((g, rank) => (
            <div
              key={g.id}
              className={`p-4 rounded-2xl border transition-all ${
                roomData.current?.groupId === g.id
                  ? 'bg-[#a8ffe5]/20 border-[#a8ffe5] shadow-[0_0_20px_rgba(168,255,229,0.3)]'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#a7c6be]">
                <span>Peringkat {rank + 1}</span>
                <span className="font-bold text-white">{g.name}</span>
              </div>
              <div className="text-3xl font-extrabold text-white tabular-nums mt-1">
                {g.score} <span className="text-xs text-[#a8ffe5]">pts</span>
              </div>
              <div className="text-[11px] text-[#a7c6be] mt-1 truncate">
                {g.members.length ? `Next: ${g.members[g.turn % g.members.length]}` : 'Belum bergabung'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
            CLASSROOM BATTLE ARENA
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Application Letter Battle
          </h1>
          <p className="text-xs sm:text-sm text-[#a7c6be] mt-1">
            Lomba rebutan interaktif 8 kelompok. Dikendalikan secara real-time oleh guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Projector Mode Toggle */}
          <button
            onClick={() => setIsProjectorMode(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white font-semibold flex items-center gap-1.5"
          >
            <Tv className="w-4 h-4 text-[#a8ffe5]" />
            <span className="hidden sm:inline">Layar Proyektor</span>
          </button>

          {/* Teacher Desk Jump */}
          <button
            onClick={() => onNavigate('guru')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] text-xs font-bold shadow hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Kendali Guru</span>
          </button>
        </div>
      </div>

      {/* Join Form if not yet joined */}
      {!joined && (
        <div className="glass-panel p-6 sm:p-8 max-w-xl mx-auto space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white">Gabung ke Ruang Battle</h2>
            <p className="text-xs text-[#a7c6be]">Masukkan kode ruang, nomor kelompok, dan PIN dari guru.</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Kode Ruang (dari Guru)</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.trim())}
                placeholder="Contoh: 246810"
                maxLength={6}
                className="w-full bg-[#082329] border border-white/20 text-white font-mono text-center text-lg p-2.5 rounded-xl tracking-widest"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">Pilih Kelompok</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(Number(e.target.value))}
                  className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Kelompok {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">PIN Kelompok</label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  placeholder="6 Karakter"
                  maxLength={6}
                  className="w-full bg-[#082329] border border-white/20 text-white font-mono uppercase text-center p-2.5 rounded-xl"
                />
              </div>
            </div>

            {/* 4 Members */}
            <div>
              <label className="block text-white font-semibold mb-1">Nama 4 Anggota (Urutan Giliran Menjawab)</label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={m}
                    onChange={(e) => {
                      const copy = [...members];
                      copy[idx] = e.target.value;
                      setMembers(copy);
                    }}
                    placeholder={`Anggota ${idx + 1}`}
                    maxLength={32}
                    className="bg-[#082329] border border-white/20 text-white p-2 rounded-lg"
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#a7c6be] mt-1">
                Gunakan 1 perangkat smartphone per kelompok. Anggota akan bergantian menjawab setiap putaran.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-sm shadow hover:scale-[1.02] active:scale-98 transition-all"
            >
              Masuk Arena Battle 🚀
            </button>
          </form>
        </div>
      )}

      {/* In-Game Student Battle Screen */}
      {joined && roomData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question & Buzzer Stage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <span className="text-[#a8ffe5] font-semibold">
                  SOAL {roomData.qIndex + 1} / {BATTLE_QUESTIONS.length}
                </span>
                <span className="text-[#ffc98d] font-bold">
                  {roomData.rebound ? 'Lemparan (+5 Poin)' : 'Awal (+10 Benar / +5 Alasan)'}
                </span>
              </div>

              {/* Question text */}
              <div className="space-y-2">
                <div className="text-xs uppercase text-[#a7c6be]">{currentQ?.category}</div>
                <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                  {currentQ?.prompt}
                </h2>
              </div>

              {/* Phase status indicator */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#a7c6be] block text-[10px] uppercase font-bold">STATUS GILIRAN</span>
                  <span className="text-white font-semibold">
                    {roomData.phase === 'reading' && 'Membaca soal... Rebut terkunci'}
                    {roomData.phase === 'open' && 'Rebut dibuka guru! Tekan tombol sekarang!'}
                    {roomData.phase === 'answering' && (
                      isMyGroupTurn
                        ? 'Kelompok Anda tercepat! Silakan jawab.'
                        : `Kelompok ${roomData.current?.groupId} sedang menjawab...`
                    )}
                    {roomData.phase === 'review' && 'Menunggu penilaian guru...'}
                    {roomData.phase === 'resolved' && 'Soal telah dinilai guru.'}
                  </span>
                </div>

                {roomData.phase === 'open' && (
                  <span className="px-3 py-1 rounded-full bg-[#a8ffe5] text-[#082c32] font-bold text-xs animate-pulse">
                    READY TO BUZZ
                  </span>
                )}
              </div>

              {/* GIANT BUZZER BUTTON */}
              <div className="py-8 flex flex-col items-center justify-center">
                <button
                  onClick={handleBuzz}
                  disabled={roomData.phase !== 'open'}
                  className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-center font-extrabold transition-all duration-150 select-none ${
                    roomData.phase === 'open'
                      ? 'bg-gradient-to-br from-[#a8ffe5] via-[#75f2cd] to-[#45d4a9] text-[#082c32] shadow-[0_0_50px_rgba(168,255,229,0.6)] scale-105 active:scale-95 cursor-pointer ring-8 ring-[#a8ffe5]/30'
                      : 'bg-white/10 text-white/40 border-4 border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl tracking-wider">REBUT</span>
                  <span className="text-[11px] font-medium mt-1">
                    {roomData.phase === 'open' ? 'Ketuk Sekarang!' : 'Menunggu Guru'}
                  </span>
                </button>
              </div>

              {/* Answer Form if my group won the buzz */}
              {isMyGroupTurn && roomData.phase === 'answering' && currentQ && (
                <div className="p-5 rounded-2xl bg-[#08282e] border-2 border-[#a8ffe5] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#a8ffe5]">FORMULIR JAWABAN KELOMPOK {groupId}</span>
                    <span className="text-[#a7c6be]">Penjawab: {roomData.current?.respondent}</span>
                  </div>

                  {currentQ.type === 'choice' && currentQ.options && (
                    <div className="space-y-2">
                      {currentQ.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => setSelectedChoice(optIdx)}
                          className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium border flex items-center gap-3 transition-all ${
                            selectedChoice === optIdx
                              ? 'bg-[#a8ffe5]/20 border-[#a8ffe5] text-white shadow'
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'text' && (
                    <div>
                      <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Tuliskan kalimat perbaikan lengkap..."
                        rows={3}
                        className="w-full bg-[#061e24] border border-white/20 text-white text-xs p-3 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={handleSendAnswer}
                      className="px-6 py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all"
                    >
                      Kirim Jawaban ke Guru ↵
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group Status & Leaderboard Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white">{currentGroup?.name}</span>
                <span className="text-xs text-[#a8ffe5] font-mono">PIN: {currentGroup?.pin}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#a7c6be]">
                  <span>Skor Kelompok:</span>
                  <span className="text-lg font-extrabold text-white tabular-nums">{currentGroup?.score} Pts</span>
                </div>
                <div className="flex justify-between text-[#a7c6be]">
                  <span>Giliran Berikutnya:</span>
                  <span className="font-semibold text-[#f0fcf9]">
                    {currentGroup?.members.length
                      ? currentGroup.members[currentGroup.turn % currentGroup.members.length]
                      : '-'}
                  </span>
                </div>
              </div>

              {/* 8 Groups Leaderboard */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#a7c6be] block">
                  PAPAN SKOR KELAS
                </span>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {[...roomData.groups]
                    .sort((a, b) => b.score - a.score)
                    .map((g, rk) => (
                      <div
                        key={g.id}
                        className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                          g.id === groupId
                            ? 'bg-[#a8ffe5]/15 border border-[#a8ffe5]/40 text-white font-bold'
                            : 'bg-white/5 text-[#a7c6be]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-white/50">{rk + 1}.</span>
                          <span>{g.name}</span>
                        </span>
                        <span className="font-mono tabular-nums text-white">{g.score}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
