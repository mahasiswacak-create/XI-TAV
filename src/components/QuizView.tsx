import React, { useState } from 'react';
import { RouteId, IdentityState } from '../types';
import { QUIZ_QUESTIONS } from '../data/lessonData';
import { saveSubmission } from '../services/submissionService';
import { CheckSquare, ArrowRight, RotateCcw, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  onNavigate: (route: RouteId) => void;
  identity: IdentityState;
  onUpdateIdentity: (identity: IdentityState) => void;
  onProgress?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  onNavigate,
  identity,
  onUpdateIdentity,
  onProgress
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Submission state
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = useState<string>('');

  const currentQ = QUIZ_QUESTIONS[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (locked) return;
    setSelectedOption(idx);
    setLocked(true);
    const updated = [...answers, idx];
    setAnswers(updated);

    if (idx === currentQ.key) {
      try {
        confetti({ particleCount: 20, spread: 40 });
      } catch {}
    }
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setLocked(false);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      onProgress?.();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setLocked(false);
    setSelectedOption(null);
    setIsFinished(false);
    setSubmitted(false);
    setSubmitMsg('');
  };

  const totalScore = answers.reduce((acc, ans, i) => acc + (ans === QUIZ_QUESTIONS[i].key ? 10 : 0), 0);

  const handleSubmitScore = async () => {
    if (!identity.name.trim() || !identity.className.trim()) {
      setSubmitMsg('Harap isi nama dan kelas pada LKPD/Tantangan sebelum mengirim nilai.');
      return;
    }
    setSubmitting(true);
    try {
      await saveSubmission({
        studentName: identity.name.trim(),
        className: identity.className.trim(),
        groupId: identity.group.trim(),
        kind: 'quiz',
        quizScore: totalScore,
        quizAnswers: answers,
        answers: {}
      });
      setSubmitted(true);
      setSubmitMsg(`Nilai kuis (${totalScore}/100) berhasil disimpan ke Dashboard Guru!`);
    } catch {
      setSubmitMsg('Gagal mengirim nilai. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
          KNOWLEDGE CHECK
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Kuis Formatif Pemahaman Surat
        </h1>
        <p className="text-xs sm:text-sm text-[#a7c6be] mt-1">
          10 soal bertahap · 10 poin per jawaban benar · Pembahasan instan di setiap nomor.
        </p>
      </div>

      {!isFinished ? (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a7c6be] mb-2 font-mono">
              <span>Soal {currentIndex + 1} dari {QUIZ_QUESTIONS.length}</span>
              <span className="text-[#a8ffe5] font-semibold">{currentQ.topic}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.q}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isKey = idx === currentQ.key;
              let btnStyle = 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10';

              if (locked) {
                if (isKey) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-semibold shadow';
                } else if (isSelected && !isKey) {
                  btnStyle = 'bg-red-500/20 border-red-400 text-red-200';
                } else {
                  btnStyle = 'bg-white/5 border-white/5 text-white/40 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={locked}
                  className={`w-full p-4 rounded-xl text-xs sm:text-sm text-left border flex items-center gap-3 transition-all ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Feedback */}
          {locked && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5 animate-in fade-in">
              <div className="text-xs font-bold text-[#a8ffe5]">
                {selectedOption === currentQ.key ? '✓ Benar! (+10 Poin)' : '✕ Belum tepat.'}
              </div>
              <p className="text-xs text-[#d7ffed]/90 leading-relaxed">{currentQ.why}</p>
            </div>
          )}

          {/* Next Button */}
          {locked && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all flex items-center gap-1.5"
              >
                <span>{currentIndex === QUIZ_QUESTIONS.length - 1 ? 'Lihat Hasil Kuis' : 'Soal Berikutnya →'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Final Quiz Results Screen */
        <div className="glass-panel p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#a8ffe5]/30 to-[#c2daff]/10 border border-[#a8ffe5]/40 flex items-center justify-center mx-auto text-3xl font-extrabold text-[#a8ffe5] tabular-nums shadow-[0_0_30px_rgba(168,255,229,0.3)]">
            {totalScore}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              {totalScore >= 80 ? 'Target Pengetahuan Tercapai!' : 'Perlu Review Tambahan'}
            </h2>
            <p className="text-xs text-[#a7c6be] mt-1 max-w-md mx-auto">
              Skor Anda adalah {totalScore} dari 100 poin. Nilai ini dapat langsung dikirim ke Dashboard Guru sebagai bukti pemahaman materi.
            </p>
          </div>

          {/* Send Score to Teacher */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-3">
            <div className="text-xs text-left">
              <label className="block text-[#a7c6be] mb-1">Nama Siswa untuk Konfirmasi Nilai:</label>
              <input
                type="text"
                value={identity.name}
                onChange={(e) => onUpdateIdentity({ ...identity, name: e.target.value })}
                placeholder="Nama Anda..."
                className="w-full bg-[#082329] border border-white/20 text-white p-2 rounded-lg text-xs"
              />
            </div>

            {submitMsg && (
              <p className={`text-xs ${submitted ? 'text-[#a8ffe5]' : 'text-red-300'}`}>
                {submitMsg}
              </p>
            )}

            {!submitted && (
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#a8ffe5] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Mengirim...' : 'Kirim Nilai ke Guru'}</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>
            <button
              onClick={() => onNavigate('final')}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-bold text-xs shadow hover:scale-105 transition-all"
            >
              Lanjut ke Tantangan Surat →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
