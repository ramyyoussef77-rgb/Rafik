import React from 'react';
import HomeIcon from './icons/HomeIcon';
import HistoryIcon from './icons/HistoryIcon';
import SettingsIcon from './icons/SettingsIcon';

const BottomNav: React.FC = () => {
  return (
    <nav className="bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm border-t border-stone-200 dark:border-stone-700 fixed bottom-0 right-0 w-full">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        <button className="flex flex-col items-center justify-center text-[#283593] dark:text-indigo-400 font-medium">
          <HomeIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">الرئيسية</span>
        </button>
        <button className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors">
          <HistoryIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">المحفوظات</span>
        </button>
        <button className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors">
          <SettingsIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">الإعدادات</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
