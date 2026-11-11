import React, { useState } from 'react';
import { RouteId, IdentityState } from '../types';
import { VACANCY_DATA } from '../data/lessonData';
import { saveSubmission } from '../services/submissionService';
import { FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LkpdViewProps {
  onNavigate: (route: RouteId) => void;
  identity: IdentityState;
  onUpdateIdentity: (identity: IdentityState) => void;
  onProgress?: () => void;
}

export const LkpdView: React.FC<LkpdViewProps> = ({
  onNavigate,
  identity,
  onUpdateIdentity,
  onProgress
}) => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('al_lkpd_answers') || '{}');
    } catch {
      return {};
    }
  });

  const [consent, setConsent] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);

  const updateAnswer = (key: string, val: string) => {
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    try {
      localStorage.setItem('al_lkpd_answers', JSON.stringify(updated));
    } catch {}
    onProgress?.();
  };

  const handleSubmit = async () => {
    setSubmitResult(null);
    if (!identity.name.trim() || !identity.className.trim()) {
      setSubmitResult({ ok: false, message: 'Harap isi nama dan kelas terlebih dahulu.' });
      return;
    }
    if (!answers['purpose']?.trim() || !answers['requirements']?.trim()) {
      setSubmitResult({ ok: false, message: 'Harap jawab minimal pertanyaan nomor 1 dan 2 pada LKPD 1.' });
      return;
    }

    setSubmitting(true);
    try {
      const subId = await saveSubmission({
        studentName: identity.name.trim(),
        className: identity.className.trim(),
        groupId: identity.group.trim(),
        kind: 'lkpd',
        answers
      });
      setSubmitResult({
        ok: true,
        message: `LKPD berhasil dikirim ke Dashboard Guru! ID Tugas: ${subId}`
      });
      try {
        confetti({ particleCount: 30, spread: 50 });
      } catch {}
    } catch (e) {
      setSubmitResult({ ok: false, message: 'Gagal mengirim LKPD. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
          DIGITAL WORKSHEET
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Lembar Kerja Peserta Didik (LKPD)
        </h1>
        <p className="text-xs sm:text-sm text-[#a7c6be] mt-1">
          Dikerjakan secara mandiri dan dibahas bersama kelompok 4 orang. Jawaban langsung tersimpan dan terkirim ke dashboard guru.
        </p>
      </div>

      {/* Identity Card */}
      <div className="glass-panel p-5 sm:p-6 space-y-3">
        <h2 className="font-bold text-sm text-white flex items-center gap-2">
          <span>Identitas Peserta Didik</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[#a7c6be] mb-1">Nama Siswa *</label>
            <input
              type="text"
              value={identity.name}
              onChange={(e) => onUpdateIdentity({ ...identity, name: e.target.value })}
              placeholder="Nama lengkap..."
              className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-[#a7c6be] mb-1">Kelas *</label>
            <input
              type="text"
              value={identity.className}
              onChange={(e) => onUpdateIdentity({ ...identity, className: e.target.value })}
              placeholder="XI TAV..."
              className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-[#a7c6be] mb-1">Kelompok (1–8)</label>
            <input
              type="text"
              value={identity.group}
              onChange={(e) => onUpdateIdentity({ ...identity, group: e.target.value })}
              placeholder="Contoh: Kelompok 2"
              className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          'LKPD 1: Analisis Surat & Lowongan',
          'LKPD 2: Rencana & Bukti Praktik',
          'LKPD 3: Telaah Rekan & Refleksi'
        ].map((title, idx) => (
          <button
            key={title}
            onClick={() => setActiveStage(idx)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeStage === idx
                ? 'bg-[#a8ffe5] text-[#082c32] shadow-[0_0_15px_rgba(168,255,229,0.3)]'
                : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {/* LKPD 1 Stage */}
      {activeStage === 0 && (
        <div className="glass-panel p-6 sm:p-8 space-y-5 animate-in fade-in duration-150">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-lg text-white">LKPD 1 · Understanding Application Letter</h3>
            <p className="text-xs text-[#a7c6be] mt-0.5">
              Baca lowongan Audio Video Technician Assistant dan contoh surat Raka pada menu Materi, lalu diskusikan:
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">
                1. What is the social purpose of Raka’s letter? (Apa tujuan penulisan surat tersebut?)
              </label>
              <textarea
                value={answers['purpose'] || ''}
                onChange={(e) => updateAnswer('purpose', e.target.value)}
                placeholder="Tuliskan tujuan surat dalam bahasa Inggris atau Indonesia..."
                rows={2}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">
                2. Sebutkan tiga persyaratan pekerjaan yang tercantum pada lowongan.
              </label>
              <textarea
                value={answers['requirements'] || ''}
                onChange={(e) => updateAnswer('requirements', e.target.value)}
                placeholder="Persyaratan teknis dan non-teknis yang diminta..."
                rows={2}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">
                3. Kutip satu bukti proyek sekolah dari contoh dan jelaskan mengapa bukti itu relevan.
              </label>
              <textarea
                value={answers['evidence'] || ''}
                onChange={(e) => updateAnswer('evidence', e.target.value)}
                placeholder="Kutipan bukti proyek dan kecocokannya dengan lowongan..."
                rows={2}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-1">
                  4. Kalimat Simple Present Tense yang digunakan
                </label>
                <textarea
                  value={answers['present'] || ''}
                  onChange={(e) => updateAnswer('present', e.target.value)}
                  placeholder="Contoh kalimat present tense..."
                  rows={2}
                  className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">
                  5. Kalimat Simple Past Tense yang menceritakan proyek
                </label>
                <textarea
                  value={answers['past'] || ''}
                  onChange={(e) => updateAnswer('past', e.target.value)}
                  placeholder="Contoh kalimat past tense..."
                  rows={2}
                  className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LKPD 2 Stage */}
      {activeStage === 1 && (
        <div className="glass-panel p-6 sm:p-8 space-y-5 animate-in fade-in duration-150">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-lg text-white">LKPD 2 · Creating My Application Letter Plan</h3>
            <p className="text-xs text-[#a7c6be] mt-0.5">
              Rancang keterkaitan kemampuan Anda dengan kebutuhan bengkel sebelum menulis draf surat:
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">
                1. Keterampilan elektronika apa saja yang sudah Anda kuasai dalam pembelajaran bengkel?
              </label>
              <textarea
                value={answers['skills'] || ''}
                onChange={(e) => updateAnswer('skills', e.target.value)}
                placeholder="Contoh: Membaca nilai resistor dan kapasitor, menyolder jalur PCB, mengukur tegangan DC..."
                rows={3}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">
                2. Jelaskan proyek praktik audio video yang pernah Anda kerjakan dan peran pribadi Anda dalam tim.
              </label>
              <textarea
                value={answers['project'] || ''}
                onChange={(e) => updateAnswer('project', e.target.value)}
                placeholder="Ceritakan proyek perakitan audio amplifier, instalasi sound system, atau pengujian alat..."
                rows={3}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* LKPD 3 Stage */}
      {activeStage === 2 && (
        <div className="glass-panel p-6 sm:p-8 space-y-5 animate-in fade-in duration-150">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-lg text-white">LKPD 3 · Peer Review & Reflection</h3>
            <p className="text-xs text-[#a7c6be] mt-0.5">
              Minta masukan teman sebangku/sekelompok mengenai draf surat Anda, lalu catat refleksinya:
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">
                1. Nama rekan penelaah dan masukan perbaikan yang diberikan:
              </label>
              <textarea
                value={answers['peerReview'] || ''}
                onChange={(e) => updateAnswer('peerReview', e.target.value)}
                placeholder="Nama teman dan sarannya mengenai struktur atau tata bahasa..."
                rows={2}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">
                2. Satu hal baru yang paling berharga yang Anda pahami dalam materi ini:
              </label>
              <textarea
                value={answers['reflection'] || ''}
                onChange={(e) => updateAnswer('reflection', e.target.value)}
                placeholder="Refleksi pembelajaran..."
                rows={2}
                className="w-full bg-[#082329] border border-white/20 text-white p-2.5 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submission Panel */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent-check"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-[#a8ffe5]"
          />
          <label htmlFor="consent-check" className="text-xs text-[#d7ffed]/90 leading-relaxed cursor-pointer">
            Saya menyetujui pengiriman nama, kelas, dan lembar kerja LKPD ini langsung ke sistem dashboard guru untuk dinilai.
          </label>
        </div>

        {submitResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              submitResult.ok
                ? 'bg-[#a8ffe5]/15 border border-[#a8ffe5]/40 text-[#a8ffe5]'
                : 'bg-red-500/20 border border-red-500/40 text-red-200'
            }`}
          >
            {submitResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{submitResult.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || !consent}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] font-extrabold text-xs shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Mengirim ke Guru...' : 'Kirim LKPD ke Guru ↵'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
