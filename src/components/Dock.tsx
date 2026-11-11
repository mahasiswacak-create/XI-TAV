import React from 'react';
import { RouteId } from '../types';
import { Home, BookOpen, Gamepad2, Swords, FileSpreadsheet, CheckSquare, Send, Shield } from 'lucide-react';

interface DockProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  isTeacherAuthenticated: boolean;
}

export const Dock: React.FC<DockProps> = ({ currentRoute, onNavigate, isTeacherAuthenticated }) => {
  const routes: { id: RouteId; label: string; icon: React.ReactNode; isTeacher?: boolean }[] = [
    { id: 'home', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
    { id: 'materi', label: 'Materi', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'games', label: 'Arcade', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'battle', label: 'Battle', icon: <Swords className="w-4 h-4" /> },
    { id: 'lkpd', label: 'LKPD', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'quiz', label: 'Kuis', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'final', label: 'Tantangan', icon: <Send className="w-4 h-4" /> },
    { id: 'guru', label: 'Guru', icon: <Shield className="w-4 h-4" />, isTeacher: true }
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl sm:rounded-full bg-[#082227]/90 border border-white/20 shadow-[0_15px_35px_rgba(0,15,20,0.6)] backdrop-blur-2xl flex items-center gap-1 sm:gap-1.5 max-w-[96vw] overflow-x-auto">
      {routes.map((r) => {
        const isActive = currentRoute === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onNavigate(r.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-[#a8ffe5] to-[#c7e9ff] text-[#082c32] shadow-[0_2px_12px_rgba(168,255,229,0.35)] scale-105'
                : 'text-[#d7ffed]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {r.icon}
            <span className="text-[11px] sm:text-xs">{r.label}</span>
            {r.isTeacher && isTeacherAuthenticated && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#a8ffe5] animate-ping" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
