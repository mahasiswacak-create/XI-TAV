import React, { useState } from 'react';
import { RouteId } from '../types';
import { VACANCY_DATA, STRUCTURE_PARTS, SAMPLE_LETTER } from '../data/lessonData';
import { BookOpen, ChevronRight, FileText, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

interface MateriViewProps {
  onNavigate: (route: RouteId) => void;
  onLessonProgress?: () => void;
}

export const MateriView: React.FC<MateriViewProps> = ({ onNavigate, onLessonProgress }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const tabs = [
    '1. TAV & Fungsi Sosial',
    '2. 9 Struktur Surat',
    '3. Tata Bahasa & Action Verbs',
    '4. Contoh Surat & Analisis'
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#a8ffe5] font-bold">
          LEARNING MODULE
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Mastering the Application Letter
        </h1>
        <p className="text-xs sm:text-sm text-[#a7c6be] mt-1 max-w-2xl">
          Panduan praktis menyusun surat lamaran kerja formal dalam bahasa Inggris dengan fokus kejuruan Teknik Audio Video (TAV).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(idx);
              onLessonProgress?.();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === idx
                ? 'bg-[#a8ffe5] text-[#082c32] shadow-[0_0_15px_rgba(168,255,229,0.3)]'
                : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Tab 0: TAV & Social Function */}
      {activeTab === 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#a8ffe5]" />
              <span>Teknik Audio Video (TAV) dalam Konteks Kerja Nyata</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#f0fcf9]/90 leading-relaxed">
              Teknik Audio Video (TAV) berada dalam rumpun Teknik Elektronika. Pembelajarannya mencakup perancangan, perakitan, pengoperasian, pengujian, pemeliharaan, dan perbaikan sistem elektronika audio video. Praktiknya meliputi:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Mengenali komponen aktif/pasif & membaca skema rangkaian',
                'Merakit dan menguji audio amplifier & sound system',
                'Menggunakan alat ukur multimeter & osiloskop digital',
                'Menerapkan keselamatan bengkel (K3) dan kerja sama tim'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#d7ffed]">
                  <CheckCircle2 className="w-4 h-4 text-[#a8ffe5] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Job Vacancy Card */}
          <div className="glass-panel p-6 sm:p-8 border-l-4 border-l-[#a8ffe5]">
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#ffc98d] font-bold">
              SIMULASI LOWONGAN PEKERJAAN BENGKEL
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{VACANCY_DATA.role}</h3>
            <div className="text-xs text-[#a7c6be] mt-1">
              <strong>{VACANCY_DATA.company}</strong> · {VACANCY_DATA.address}
            </div>

            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Persyaratan Pekerjaan (Requirements):</h4>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-[#f0fcf9]/80 pl-1">
                {VACANCY_DATA.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[#082227]/70 text-xs text-[#a8ffe5] border border-[#a8ffe5]/20">
              💡 <strong>Tugas Siswa:</strong> Tulis surat lamaran kerja dalam bahasa Inggris (100–150 kata pada tiga paragraf inti) yang menghubungkan pengalaman proyek bengkel Anda dengan lowongan di atas.
            </div>
          </div>
        </div>
      )}

      {/* Content Tab 1: 9 Generic Structure Parts */}
      {activeTab === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2">9 Bagian Baku Surat Lamaran</h2>
            <p className="text-xs sm:text-sm text-[#a7c6be] mb-6">
              Klik setiap bagian di bawah ini untuk mempelajari fungsi, letak, dan penjelasannya:
            </p>

            <div className="space-y-2.5">
              {STRUCTURE_PARTS.map(([partName, partDesc], idx) => {
                const isOpen = openAccordion === idx;
                return (
                  <div
                    key={partName}
                    className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenAccordion(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between font-semibold text-sm text-[#f0fcf9] hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#a8ffe5]/20 text-[#a8ffe5] text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span>{partName}</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 text-[#a7c6be] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="p-4 pt-1 text-xs text-[#d7ffed]/90 border-t border-white/10 bg-black/20 leading-relaxed">
                        {partDesc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content Tab 2: Language Features & Action Verbs */}
      {activeTab === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <span className="text-[10px] font-mono tracking-widest text-[#a8ffe5] uppercase font-bold">TENSE 01</span>
              <h3 className="text-lg font-bold text-white mt-1">Simple Present Tense</h3>
              <p className="text-xs text-[#a7c6be] mt-1 mb-4">
                Digunakan untuk menyatakan keahlian teknis atau kompetensi yang saat ini dimiliki.
              </p>
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2 text-xs">
                <div>
                  <span className="text-[#a8ffe5] font-bold">Contoh Benar:</span>
                  <p className="font-mono text-white mt-0.5">“I use basic measuring instruments such as multimeters.”</p>
                </div>
                <div>
                  <span className="text-[#a8ffe5] font-bold">Dengan Modal 'Can':</span>
                  <p className="font-mono text-white mt-0.5">“I can read simple schematic circuit diagrams.”</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <span className="text-[10px] font-mono tracking-widest text-[#ffc98d] uppercase font-bold">TENSE 02</span>
              <h3 className="text-lg font-bold text-white mt-1">Simple Past Tense</h3>
              <p className="text-xs text-[#a7c6be] mt-1 mb-4">
                Digunakan untuk menceritakan proyek praktik sekolah yang sudah tuntas dikerjakan.
              </p>
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2 text-xs">
                <div>
                  <span className="text-[#ffc98d] font-bold">Contoh Benar:</span>
                  <p className="font-mono text-white mt-0.5">“During a practical session, I assembled an audio amplifier.”</p>
                </div>
                <div>
                  <span className="text-[#ffc98d] font-bold">Kerja Sama Tim:</span>
                  <p className="font-mono text-white mt-0.5">“I worked with three classmates to test the signal output.”</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Verbs Table */}
          <div className="glass-panel p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-2">Technical Action Verbs TAV</h3>
            <p className="text-xs text-[#a7c6be] mb-4">
              Gunakan kata kerja aksi berikut untuk membuat surat lamaran Anda terdengar meyakinkan:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ['Assemble', 'Merakit rangkaian'],
                ['Identify', 'Mengenali komponen'],
                ['Measure', 'Mengukur tegangan/arus'],
                ['Test', 'Menguji keluaran audio'],
                ['Record', 'Mencatat hasil tes'],
                ['Verify', 'Memverifikasi jalur PCB'],
                ['Follow K3', 'Menaati prosedur K3'],
                ['Document', 'Mendokumentasikan temuan']
              ].map(([en, id]) => (
                <div key={en} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-[#a8ffe5]">{en}</div>
                  <div className="text-[#a7c6be] text-[11px] mt-0.5">{id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Tab 3: Sample Letter from Raka */}
      {activeTab === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Model Surat: Raka Pratama</h2>
                <p className="text-xs text-[#a7c6be]">Simulasi surat lamaran lengkap yang memenuhi seluruh standar kualifikasi bengkel audio.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#a8ffe5]/15 text-[#a8ffe5] border border-[#a8ffe5]/30 text-xs font-semibold">
                Contoh Baku
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#071d22]/90 border border-white/20 font-serif space-y-4 text-sm text-[#f0fcf9] leading-relaxed">
              {SAMPLE_LETTER.map(([label, text], idx) => (
                <div key={label} className="pb-3 border-b border-white/5 last:border-none">
                  <span className="text-[10px] font-sans font-mono tracking-wider text-[#a8ffe5] block mb-1">
                    [{idx + 1}. {label}]
                  </span>
                  <div className="whitespace-pre-line text-[#f0fcf9]/95">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Action */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
        <span className="text-xs text-[#a7c6be]">
          Siap menguji pemahaman Anda di game arcade atau battle kelompok?
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('games')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-all"
          >
            Coba Skill Arcade
          </button>
          <button
            onClick={() => onNavigate('battle')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] text-[#082c32] text-xs font-bold shadow transition-all flex items-center gap-1.5"
          >
            <span>Masuk Battle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
