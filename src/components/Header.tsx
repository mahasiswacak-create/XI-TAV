import React, { useState } from 'react';
import { RouteId, BackgroundTheme } from '../types';
import { Sparkles, Sliders, Volume2, VolumeX, Shield, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  progressCount: number;
  currentTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isTeacherAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  progressCount,
  currentTheme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
  isTeacherAuthenticated
}) => {
  const [showThemeModal, setShowThemeModal] = useState(false);

  const themeOptions: { id: BackgroundTheme; name: string; desc: string }[] = [
    { id: 'workbench', name: 'TAV Workbench', desc: 'Laboratorium osiloskop & amplifier audio' },
    { id: 'audio-lab', name: 'Audio Studio', desc: 'Konsol mixing & acoustic panel' },
    { id: 'circuit', name: 'PCB Circuit', desc: 'Komponen sirkuit amplifier audio macro' },
    { id: 'noir', name: 'Dark Studio', desc: 'Suasana studio fokus minimalis' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 backdrop-blur-xl bg-[#06181b]/70 border-b border-white/15">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a8ffe5]/30 to-[#a8eaff]/10 border border-[#a8ffe5]/40 flex items-center justify-center font-extrabold text-lg tracking-tight text-[#a8ffe5] shadow-[0_0_15px_rgba(168,255,229,0.2)] group-hover:scale-105 transition-transform">
              AL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Application Letter Lab
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#a8ffe5]/15 text-[#a8ffe5] border border-[#a8ffe5]/30">
                  XI TAV
                </span>
              </div>
              <p className="text-[11px] text-[#a7c6be] hidden sm:block">
                SMK PGRI 1 Nganjuk · Teknik Audio Video
              </p>
            </div>
          </div>

          {/* Tools & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Learning Progress */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <span className="text-[#a7c6be] hidden md:inline">Progres:</span>
              <span className="font-semibold text-[#a8ffe5] tabular-nums">{progressCount}/8</span>
              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-gradient-to-r from-[#a8ffe5] to-[#c2daff] transition-all duration-300"
                  style={{ width: `${(progressCount / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Matikan suara efek' : 'Aktifkan suara efek'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#d7ffed] flex items-center gap-1.5 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#a8ffe5]" /> : <VolumeX className="w-4 h-4 text-white/40" />}
              <span className="hidden lg:inline">{soundEnabled ? 'Suara ON' : 'Mute'}</span>
            </button>

            {/* Theme Selector */}
            <button
              onClick={() => setShowThemeModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#d7ffed] flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-[#ffc98d]" />
              <span className="hidden sm:inline">Tema TAV</span>
            </button>

            {/* Teacher Direct Shortcut */}
            <button
              onClick={() => onNavigate('guru')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRoute === 'guru'
                  ? 'bg-[#a8ffe5] text-[#082c32] shadow-[0_0_15px_rgba(168,255,229,0.3)]'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Untuk Guru</span>
              {isTeacherAuthenticated && (
                <span className="w-2 h-2 rounded-full bg-[#a8ffe5] animate-pulse" title="Sesi Guru Aktif" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel p-6 max-w-md w-full border border-white/30 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#a8ffe5]" />
                <h3 className="font-bold text-base text-white">Suasana Belajar TAV</h3>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#a7c6be] mb-4">
              Pilih visual background bertema kejuruan Teknik Audio Video untuk kenyamanan pandangan Anda:
            </p>

            <div className="space-y-2.5">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onThemeChange(opt.id);
                    setShowThemeModal(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    currentTheme === opt.id
                      ? 'bg-[#a8ffe5]/15 border-[#a8ffe5] text-white shadow-[0_0_15px_rgba(168,255,229,0.15)]'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[#f0fcf9]">{opt.name}</div>
                    <div className="text-[11px] text-[#a7c6be]">{opt.desc}</div>
                  </div>
                  {currentTheme === opt.id && <CheckCircle2 className="w-4 h-4 text-[#a8ffe5]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
