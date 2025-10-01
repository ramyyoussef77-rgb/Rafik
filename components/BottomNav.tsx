
import React from 'react';
import PlusIcon from './icons/PlusIcon';
import HistoryIcon from './icons/HistoryIcon';
import SettingsIcon from './icons/SettingsIcon';

interface BottomNavProps {
  onNewChat: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = React.memo(({ onNewChat, onHistoryClick, onSettingsClick }) => {
  return (
    <nav className="bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm border-t border-stone-200 dark:border-stone-700 fixed bottom-0 right-0 w-full">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        <button onClick={onHistoryClick} className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors w-1/3">
          <HistoryIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">المحفوظات</span>
        </button>
        <button onClick={onNewChat} title="شات جديد" aria-label="شات جديد" className="w-16 h-16 rounded-full bg-[#283593] text-white flex items-center justify-center shadow-lg transform -translate-y-4 hover:scale-105 transition-transform">
          <PlusIcon className="w-8 h-8" />
        </button>
        <button onClick={onSettingsClick} className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors w-1/3">
          <SettingsIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">الإعدادات</span>
        </button>
      </div>
    </nav>
  );
});

export default BottomNav;