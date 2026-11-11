import React, { useState } from 'react';
import { RouteId } from '../types';
import { STRUCTURE_PARTS } from '../data/lessonData';
import { Gamepad2, Star, CheckCircle, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ArcadeViewProps {
  onNavigate: (route: RouteId) => void;
  soundEnabled: boolean;
  onProgress?: () => void;
}

export const ArcadeView: React.FC<ArcadeViewProps> = ({ onNavigate, soundEnabled, onProgress }) => {
  const [activeMission, setActiveMission] = useState<number>(0);
  const [xp, setXp] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('al_arcade_xp') || 0);
    } catch {
      return 0;
    }
  });

  const addXp = (amount: number) => {
    const next = xp + amount;
    setXp(next);
    try {
      localStorage.setItem('al_arcade_xp', String(next));
    } catch {}
    onProgress?.();
  };

  // Mission 1: Structure Match
  const [matchAnswers, setMatchAnswers] = useState<Record<number, number>>({});
  const [matchChecked, setMatchChecked] = useState(false);

  const checkMatch = () => {
    let correct = 0;
    STRUCTURE_PARTS.forEach((_, idx) => {
      if (matchAnswers[idx] === idx) correct++;
    });
    setMatchChecked(true);
    if (correct >= 7) {
      addXp(150);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}
    }
  };

  // Mission 2: Grammar Detective Cases
  const grammarCases = [
    {
      bad: 'I can identifies electronic components.',
      good: 'I can identify electronic components.',
      options: ['I can identifies', 'I can identify', 'I can identified'],
      correctIndex: 1,
      why: 'Setelah modal verb "can", selalu gunakan bentuk dasar (identify).'
    },
    {
      bad: 'Hey boss! I wanna apply here.',
      good: 'Dear Hiring Manager, I am writing to apply for the position.',
      options: ['Hey boss!', 'Dear Hiring Manager,', 'What’s up manager?'],
      correctIndex: 1,
      why: 'Gunakan sapaan formal "Dear Hiring Manager," dalam surat lamaran.'
    },
    {
      bad: 'Last month, I assemble an audio amplifier.',
      good: 'Last month, I assembled an audio amplifier.',
      options: ['I assemble', 'I assembled', 'I am assemble'],
      correctIndex: 1,
      why: 'Keterangan waktu "Last month" menunjukkan waktu lampau (Simple Past).'
    }
  ];

  const [detectiveAnswers, setDetectiveAnswers] = useState<Record<number, number>>({});
  const [detectiveChecked, setDetectiveChecked] = useState(false);

  const checkDetective = () => {
    let score = 0;
    grammarCases.forEach((c, idx) => {
      if (detectiveAnswers[idx] === c.correctIndex) score++;
    });
    setDetectiveChecked(true);
    if (score === grammarCases.length) {
      addXp(120);
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch {}
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & XP Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
            SKILL ARCADE
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Interactive Practice Arena
          </h1>
          <p className="text-xs sm:text-sm text-[#a7c6be] mt-1">
            Empat misi interaktif untuk mematangkan pemahaman sebelum sesi Live Battle kelas.
          </p>
        </div>

        {/* XP Badge */}
        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#a8ffe5]/20 to-[#c2daff]/10 border border-[#a8ffe5]/40 flex items-center gap-3">
          <Star className="w-5 h-5 text-[#ffc98d] fill-[#ffc98d]" />
          <div>
            <div className="text-[10px] uppercase font-bold text-[#a7c6be]">Perolehan XP</div>
            <div className="text-lg font-extrabold text-white tabular-nums leading-none">{xp} XP</div>
          </div>
        </div>
      </div>

      {/* Mission Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 0, title: 'Structure Match', meta: '9 Bagian Surat' },
          { id: 1, title: 'Grammar Detective', meta: '3 Kasus Tata Bahasa' },
          { id: 2, title: 'Recruiter Quick Dash', meta: 'Evaluasi Cepat' },
          { id: 3, title: 'Timeline Sorter', meta: 'Urutan Logis' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMission(m.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeMission === m.id
                ? 'bg-[#a8ffe5]/15 border-[#a8ffe5] text-white shadow-[0_0_15px_rgba(168,255,229,0.2)]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] font-mono text-[#a8ffe5] uppercase font-bold">Misi 0{m.id + 1}</div>
            <div className="font-bold text-sm text-white mt-0.5">{m.title}</div>
            <div className="text-[11px] text-[#a7c6be] mt-1">{m.meta}</div>
          </button>
        ))}
      </div>

      {/* Mission 0: Structure Match */}
      {activeMission === 0 && (
        <div className="glass-panel p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Misi 1: Match the 9 Structures</h2>
              <p className="text-xs text-[#a7c6be]">Pasangkan setiap definisi fungsi dengan nama bagian surat yang tepat:</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-[#a8ffe5]">Target: min 7/9</span>
          </div>

          <div className="space-y-3">
            {STRUCTURE_PARTS.map(([name, desc], idx) => (
              <div key={name} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-[#f0fcf9] font-medium flex-1">
                  <strong>{idx + 1}.</strong> {desc}
                </span>

                <select
                  value={matchAnswers[idx] ?? ''}
                  onChange={(e) => {
                    setMatchAnswers({ ...matchAnswers, [idx]: Number(e.target.value) });
                    setMatchChecked(false);
                  }}
                  className="bg-[#082329] border border-white/20 text-white p-2 rounded-lg text-xs min-w-[200px]"
                >
                  <option value="">-- Pilih Bagian --</option>
                  {STRUCTURE_PARTS.map(([pName], optIdx) => (
                    <option key={pName} value={optIdx}>
                      {pName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => {
                setMatchAnswers({});
                setMatchChecked(false);
              }}
              className="text-xs text-[#a7c6be] hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Jawaban</span>
            </button>

            <button
              onClick={checkMatch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all"
            >
              Periksa Pasangan (+150 XP)
            </button>
          </div>

          {matchChecked && (
            <div className="p-4 rounded-xl bg-[#a8ffe5]/15 border border-[#a8ffe5]/40 text-xs text-white">
              Pemeriksaan selesai! Nilai kecocokan Anda:{' '}
              <strong className="text-[#a8ffe5]">
                {STRUCTURE_PARTS.filter((_, i) => matchAnswers[i] === i).length} / 9 Benar
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Mission 1: Grammar Detective */}
      {activeMission === 1 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white">Misi 2: Grammar & Tone Detective</h2>
            <p className="text-xs text-[#a7c6be]">Temukan kesalahan ungkapan teknis dan pilih perbaikan yang paling tepat:</p>
          </div>

          <div className="space-y-4">
            {grammarCases.map((c, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="text-xs">
                  <span className="text-[#ffc98d] font-bold">Kasus {idx + 1} (Kalimat Bermasalah):</span>
                  <div className="font-mono text-white/90 p-2 rounded bg-black/30 mt-1 line-through text-red-300">
                    "{c.bad}"
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-[#a7c6be] font-semibold">Pilih Opsi Perbaikan:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {c.options.map((opt, optIdx) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setDetectiveAnswers({ ...detectiveAnswers, [idx]: optIdx });
                          setDetectiveChecked(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                          detectiveAnswers[idx] === optIdx
                            ? 'bg-[#a8ffe5]/20 border-[#a8ffe5] text-white font-semibold'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {detectiveChecked && (
                  <p className="text-[11px] text-[#a8ffe5] pt-1 border-t border-white/5">
                    💡 <em>{c.why}</em>
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={checkDetective}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all"
          >
            Cek Investigasi (+120 XP)
          </button>
        </div>
      )}

      {/* Mission 2 & 3: Quick Info */}
      {(activeMission === 2 || activeMission === 3) && (
        <div className="glass-panel p-6 sm:p-8 space-y-4 text-center">
          <Gamepad2 className="w-12 h-12 text-[#a8ffe5] mx-auto opacity-80" />
          <h2 className="text-xl font-bold text-white">Mode Latihan Cepat</h2>
          <p className="text-xs sm:text-sm text-[#a7c6be] max-w-md mx-auto">
            Latihan struktur dan tata bahasa ini dirancang untuk mempersiapkan seluruh kelompok sebelum bertanding di sesi Live Battle bersama guru.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('battle')}
              className="px-5 py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all inline-flex items-center gap-1.5"
            >
              <span>Langsung ke Ruang Battle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
