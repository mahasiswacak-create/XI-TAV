import React, { useState } from 'react';
import { RouteId } from '../types';
import { ArrowRight, Swords, Sparkles, BookOpen, CheckCircle, Radio, Wrench, Shield } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (route: RouteId) => void;
  soundEnabled: boolean;
  onPlaySound?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, soundEnabled, onPlaySound }) => {
  const [demoPolished, setDemoPolished] = useState(false);
  const [pollChoice, setPollChoice] = useState<string | null>(null);

  const scenes = [
    {
      step: '01 · FIND',
      title: 'Analyze the Vacancy',
      desc: 'Cermati lowongan Audio Video Technician Assistant. Temukan kualifikasi perakitan amplifier, pembacaan skema, dan instrumen ukur multimeter.'
    },
    {
      step: '02 · CONNECT',
      title: 'Match Real Practical Evidence',
      desc: 'Hubungkan keterampilan elektronika Anda dengan bukti konkret dari praktik sekolah: pengujian osiloskop, prosedur K3, dan kerja sama tim.'
    },
    {
      step: '03 · WRITE',
      title: 'Draft Formal Application Letter',
      desc: 'Gunakan struktur baku 9 bagian, bahasa formal, perpaduan simple present & simple past, dengan target 100–150 kata pada tiga paragraf utama.'
    },
    {
      step: '04 · BATTLE & REVIEW',
      title: 'Classroom Battle & Peer Review',
      desc: 'Uji ketangkasan pemahaman di sesi Battle 8 kelompok bersama guru, tinjau masukan rekan sekelas, lalu kirimkan hasil akhir.'
    }
  ];

  const [activeScene, setActiveScene] = useState(0);

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <section className="glass-panel p-6 sm:p-10 border border-white/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#a8ffe5]/15 to-[#a8eaff]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-3xl relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a8ffe5]/10 border border-[#a8ffe5]/30 text-xs text-[#a8ffe5] font-semibold">
            <Radio className="w-3.5 h-3.5 text-[#a8ffe5] animate-pulse" />
            <span>ENGLISH FOR AUDIO VIDEO ELECTRONICS · XI TAV</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Turn Workshop Practice into{' '}
            <span className="bg-gradient-to-r from-[#a8ffe5] via-[#c2daff] to-[#ffc98d] bg-clip-text text-transparent">
              Your First Career Move.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#d7ffed]/90 leading-relaxed max-w-2xl">
            Ruang belajar interaktif Bahasa Inggris kejuruan Teknik Audio Video (TAV) SMK PGRI 1 Nganjuk. 
            Kuasai struktur surat lamaran formal, perbaiki kalimat teknis, dan ikuti <strong>Classroom Live Battle</strong> 8 kelompok yang dikendalikan langsung oleh guru.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('materi')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#b8e8ff] text-[#082c32] font-bold text-sm shadow-[0_4px_20px_rgba(168,255,229,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Pelajari Materi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('battle')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-[#ffc98d]" />
              <span>Masuk Battle Ruang Kelas</span>
            </button>

            <button
              onClick={() => onNavigate('guru')}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#a8ffe5]/30 text-[#a8ffe5] text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Portal Khusus Guru</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration: The Power of Formal Polish */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#a7c6be] font-bold mb-2">
              INTERACTIVE COMPARISON
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Transforming Casual Sentences into Professional Proof
            </h2>
            <p className="text-xs sm:text-sm text-[#a7c6be] leading-relaxed mb-6">
              Di industri elektronika audio video, manajer bengkel mencari pelamar yang dapat membuktikan kompetensi secara santun dan terukur, bukan sekadar menyatakan klaim umum.
            </p>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#061e24]/80 border border-white/20 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                <span className="font-mono text-[#a7c6be]">application-letter-preview.txt</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${demoPolished ? 'bg-[#a8ffe5]/20 text-[#a8ffe5]' : 'bg-[#ffc98d]/20 text-[#ffc98d]'}`}>
                  {demoPolished ? 'Formal & Siap Kerja' : 'Perlu Revisi'}
                </span>
              </div>

              <div className="font-mono text-sm leading-relaxed transition-all duration-300">
                <p className="font-bold text-[#ffc98d] mb-1">
                  {demoPolished ? 'Dear Hiring Manager,' : 'Hey boss!'}
                </p>
                <p className="text-[#f0fcf9]">
                  {demoPolished ? (
                    'I am writing to apply for the Audio Video Technician Assistant position. During a school practical project, I assembled a low-voltage audio amplifier and checked all circuit connections using a digital multimeter.'
                  ) : (
                    'I really wanna work here. I know some electronic stuff and I like listening to loud music.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 flex items-center justify-between gap-4 border-t border-white/10 mt-6">
            <span className="text-xs text-[#a7c6be]">
              Klik tombol untuk melihat perbandingan:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                onClick={() => setDemoPolished(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !demoPolished ? 'bg-white/20 text-white shadow' : 'text-[#a7c6be] hover:text-white'
                }`}
              >
                Sebelum
              </button>
              <button
                onClick={() => setDemoPolished(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  demoPolished ? 'bg-[#a8ffe5] text-[#082c32] shadow-[0_0_10px_rgba(168,255,229,0.3)]' : 'text-[#a7c6be] hover:text-white'
                }`}
              >
                Sesudah ✨
              </button>
            </div>
          </div>
        </div>

        {/* Step Progression Journey */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#a7c6be] font-bold mb-2">
              ALUR PEMBELAJARAN
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              Your 4-Stage Learning Journey
            </h2>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 min-h-[140px]">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#a8ffe5]">
                {scenes[activeScene].step}
              </span>
              <h3 className="font-bold text-white text-base">
                {scenes[activeScene].title}
              </h3>
              <p className="text-xs text-[#a7c6be] leading-relaxed">
                {scenes[activeScene].desc}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4">
            <span className="text-xs text-[#a7c6be]">Tahap {activeScene + 1} dari 4</span>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveScene((prev) => (prev > 0 ? prev - 1 : scenes.length - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white"
              >
                ← Prev
              </button>
              <button
                onClick={() => setActiveScene((prev) => (prev < scenes.length - 1 ? prev + 1 : 0))}
                className="px-3 py-1.5 rounded-lg bg-[#a8ffe5]/20 hover:bg-[#a8ffe5]/30 text-[#a8ffe5] border border-[#a8ffe5]/40 text-xs font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Diagnostic Poll */}
      <section className="glass-panel p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-2">Polling Awal Kelas</h2>
        <p className="text-xs sm:text-sm text-[#a7c6be] mb-4">
          Pernahkah Anda melihat atau membaca lowongan pekerjaan teknisi elektronika / audio video sebelumnya?
        </p>

        <div className="flex flex-wrap gap-3">
          {['Sudah pernah', 'Belum pernah', 'Belum yakin'].map((item) => (
            <button
              key={item}
              onClick={() => setPollChoice(item)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                pollChoice === item
                  ? 'bg-[#a8ffe5] text-[#082c32] border-[#a8ffe5] shadow-[0_0_15px_rgba(168,255,229,0.3)]'
                  : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {pollChoice && (
          <p className="mt-3 text-xs text-[#a8ffe5]">
            ✓ Pilihan Anda ({pollChoice}) tercatat untuk evaluasi diagnostik awal.
          </p>
        )}
      </section>
    </div>
  );
};
