
import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import TrashIcon from './icons/TrashIcon';
import VolumeOnIcon from './icons/VolumeOnIcon';
import VolumeOffIcon from './icons/VolumeOffIcon';
import XIcon from './icons/XIcon';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onThemeToggle: () => void;
  isAutoSpeakEnabled: boolean;
  onAutoSpeakToggle: () => void;
  onClearHistory: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeToggle,
  isAutoSpeakEnabled,
  onAutoSpeakToggle,
  onClearHistory,
}) => {
  const handleClear = () => {
    if (window.confirm("متأكد إنك عايز تمسح كل الشاتات؟ الحركة دي مفيهاش رجوع.")) {
        onClearHistory();
        onClose();
    }
  };

  return (
    <div
      className={`side-panel-container fixed inset-0 z-20 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`side-panel right w-72 md:w-80 h-full bg-stone-100 dark:bg-stone-900 shadow-xl p-4 flex flex-col ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">الإعدادات</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="p-1 rounded-full text-stone-500 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <span className="text-stone-700 dark:text-stone-300">الوضع الغامق</span>
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full bg-stone-200 dark:bg-stone-700 text-[#283593] dark:text-indigo-400"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <span className="text-stone-700 dark:text-stone-300">القراية الأوتوماتيك</span>
            <button
              onClick={onAutoSpeakToggle}
              className="p-2 rounded-full bg-stone-200 dark:bg-stone-700 text-[#283593] dark:text-indigo-400"
            >
              {isAutoSpeakEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            <span>مسح كل الشاتات</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
