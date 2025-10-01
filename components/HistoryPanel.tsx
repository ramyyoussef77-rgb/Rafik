
import React from 'react';
import { ChatSession } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import XIcon from './icons/XIcon';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div
      className={`fixed inset-0 z-20 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`side-panel left w-72 md:w-80 h-full bg-stone-100 dark:bg-stone-900 shadow-xl p-4 flex flex-col ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">المحادثات</h2>
             <button
                onClick={onClose}
                aria-label="إغلاق المحفوظات"
                className="p-1 rounded-full text-stone-500 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-white bg-[#283593] rounded-lg hover:bg-indigo-900 transition-colors shadow-sm"
        >
            <PlusIcon className="w-5 h-5" />
            <span>شات جديد</span>
        </button>

        <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
            {sortedSessions.length > 0 ? (
                 sortedSessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            session.id === activeSessionId
                            ? 'bg-[#c5cae9] dark:bg-[#3f51b5]'
                            : 'hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                    >
                        <p className="truncate text-sm text-stone-700 dark:text-stone-300">{session.title}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            aria-label="مسح الشات ده"
                            className="p-1 rounded-full text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-500 opacity-50 hover:opacity-100"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center text-stone-500 dark:text-stone-400 text-sm py-8">
                    <p>لسه مفيش أي شاتات.</p>
                    <p>ابدأ واحد جديد وهتلاقيه هنا!</p>
                </div>
            )}
           
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
