import React, { useState } from 'react';
import { RouteId, IdentityState } from '../types';
import { VACANCY_DATA } from '../data/lessonData';
import { saveSubmission } from '../services/submissionService';
import { Send, FileText, CheckCircle2, AlertCircle, Eye, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalViewProps {
  onNavigate: (route: RouteId) => void;
  identity: IdentityState;
  onUpdateIdentity: (identity: IdentityState) => void;
  onProgress?: () => void;
}

export const FinalView: React.FC<FinalViewProps> = ({
  onNavigate,
  identity,
  onUpdateIdentity,
  onProgress
}) => {
  const [letterText, setLetterText] = useState<string>(() => {
    try {
      return localStorage.getItem('al_final_letter') || '';
    } catch {
      return '';
    }
  });

  const [checks, setChecks] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('al_final_checks') || '{}');
    } catch {
      return {};
    }
  });

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);

  const criteriaList = [
    'Menyebutkan posisi Audio Video Technician Assistant dan sumber lowongan.',
    'Menyertakan 9 bagian struktur surat lamaran secara lengkap.',
    'Menjelaskan bukti proyek praktik sekolah (contoh: merakit amplifier/alat ukur).',
    'Menggunakan perpaduan Simple Present & Simple Past Tense yang tepat.',
    'Menggunakan kosakata formal dan menghindari singkatan informal (wanna/gonna).',
    'Panjang tiga paragraf inti berkisar antara 100–150 kata.'
  ];

  const handleTextChange = (val: string) => {
    setLetterText(val);
    try {
      localStorage.setItem('al_final_letter', val);
    } catch {}
    onProgress?.();
  };

  const handleToggleCheck = (idx: number) => {
    const updated = { ...checks, [idx]: !checks[idx] };
    setChecks(updated);
    try {
      localStorage.setItem('al_final_checks', JSON.stringify(updated));
    } catch {}
  };

  const insertTemplate = () => {
    const template = `[Your Full Name]
Nganjuk, East Java
student.tav@example.com

${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Hiring Manager
${VACANCY_DATA.company}
${VACANCY_DATA.address}

Dear Hiring Manager,

I am writing to apply for the ${VACANCY_DATA.role} position advertised on the school career board. I am currently a Grade XI student in the Audio Video Engineering programme at SMK PGRI 1 Nganjuk. I am eager to apply my technical skills to support your workshop.

During our school practical lessons, I assembled a low-voltage audio amplifier with my classmates. Under our teacher's supervision, I identified active and passive electronic components, interpreted schematic diagrams, and checked all solder joints with a digital multimeter. I also followed workshop safety procedures and accurately documented test measurements.

I would welcome the opportunity to discuss my qualifications and practical background in an interview. My student practical logbook is available upon request. Thank you for your time and consideration.

Yours sincerely,
[Your Full Name]`;

    handleTextChange(template);
  };

  const wordCount = (text: string) => {
    return (text.trim().match(/\S+/g) || []).length;
  };

  const handleSubmit = async () => {
    setSubmitResult(null);
    if (!identity.name.trim() || !identity.className.trim()) {
      setSubmitResult({ ok: false, message: 'Harap lengkapi nama dan kelas terlebih dahulu.' });
      return;
    }
    if (!letterText.trim() || /\[Your|Opening|Body/i.test(letterText)) {
      setSubmitResult({ ok: false, message: 'Harap lengkapi isi surat dan ganti tanda kurung template dengan data Anda.' });
      return;
    }

    setSubmitting(true);
    try {
      const subId = await saveSubmission({
        studentName: identity.name.trim(),
        className: identity.className.trim(),
        groupId: identity.group.trim(),
        kind: 'final',
        letter: letterText.trim(),
        checks,
        answers: {}
      });
      setSubmitResult({
        ok: true,
        message: `Surat lamaran berhasil dikirim ke Dashboard Guru! ID Kiriman: ${subId}`
      });
      try {
        confetti({ particleCount: 50, spread: 70 });
      } catch {}
    } catch {
      setSubmitResult({ ok: false, message: 'Gagal mengirim surat. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalWords = wordCount(letterText);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
          SUMMATIVE CHALLENGE
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Menulis Surat Lamaran Kerja Mandiri
        </h1>
        <p className="text-xs sm:text-sm text-[#a7c6be] mt-1">
          Simulasi melamar posisi Audio Video Technician Assistant di Prima Audio Elektronik. Tulis surat formal Anda sendiri berdasarkan pengalaman praktik bengkel sekolah.
        </p>
      </div>

      {/* Editor & Controls */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={insertTemplate}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a8ffe5]" />
              <span>Gunakan Format Template Baku</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'Tutup Pratinjau' : 'Pratinjau Surat'}</span>
            </button>
          </div>

          <div className="text-xs font-mono text-[#a7c6be]">
            Total: <strong className="text-white">{totalWords} kata</strong> (Target isi: 100–150 kata)
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={letterText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Tuliskan surat lamaran lengkap Anda di sini atau gunakan format template..."
          rows={14}
          className="w-full bg-[#071d22]/90 border border-white/20 text-[#f0fcf9] p-4 rounded-2xl font-serif text-sm sm:text-base leading-relaxed focus:border-[#a8ffe5]"
        />

        {/* Live Letter Preview */}
        {showPreview && (
          <div className="p-6 rounded-2xl bg-[#f7f9fa] text-[#1c2e38] font-serif text-sm leading-relaxed whitespace-pre-line shadow-inner border border-white/20 animate-in fade-in">
            <span className="font-sans text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">
              PRATINJAU DOKUMEN CETAK
            </span>
            {letterText || '(Surat belum diisi)'}
          </div>
        )}
      </div>

      {/* Self-Check Checklist */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#a8ffe5]" />
          <span>Checklist Evaluasi Mandiri Sebelum Mengirim</span>
        </h3>
        <p className="text-xs text-[#a7c6be]">
          Pastikan draf surat Anda telah memenuhi kriteria penilaian berikut:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {criteriaList.map((crit, idx) => (
            <label
              key={idx}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                checks[idx]
                  ? 'bg-[#a8ffe5]/15 border-[#a8ffe5]/40 text-white font-medium'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <input
                type="checkbox"
                checked={checks[idx] || false}
                onChange={() => handleToggleCheck(idx)}
                className="mt-0.5 w-4 h-4 rounded text-[#a8ffe5]"
              />
              <span>{crit}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submission Card */}
      <div className="glass-panel p-6 space-y-4">
        {submitResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              submitResult.ok
                ? 'bg-[#a8ffe5]/15 border border-[#a8ffe5]/40 text-[#a8ffe5]'
                : 'bg-red-500/20 border border-red-500/40 text-red-200'
            }`}
          >
            {submitResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{submitResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#a7c6be]">
            Tugas akan langsung diterima di portal guru untuk dinilai dengan rubrik resmi.
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-extrabold text-xs shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Mengirim...' : 'Kirim Surat Akhir ke Guru ↵'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
