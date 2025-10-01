
import React from 'react';
import MenuIcon from './icons/MenuIcon';
// FIX: Changed import to a named import as RafeeqLogo does not have a default export.
import { RafeeqLogo } from './icons/RafeeqLogo';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ onMenuClick }) => {
  return (
    <header className="bg-stone-100/80 dark:bg-stone-900/80 backdrop-blur-sm text-stone-800 dark:text-white text-center p-4 fixed top-0 w-full z-10 flex items-center justify-between border-b border-stone-200 dark:border-stone-800 h-16">
      <div className="w-1/3 flex justify-start">
        <button
          onClick={onMenuClick}
          aria-label="فتح الإعدادات"
          title="فتح الإعدادات"
          className="text-stone-600 dark:text-stone-300 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors p-2 rounded-full"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="w-1/3 flex justify-center items-center">
        <RafeeqLogo className="h-6" />
      </div>
      <div className="w-1/3" />
    </header>
  );
});

export default Header;
