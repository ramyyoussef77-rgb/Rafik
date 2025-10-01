import React from 'react';
import StopCircleIcon from './icons/StopCircleIcon';

interface StopButtonProps {
    onClick: () => void;
}

const StopButton: React.FC<StopButtonProps> = ({ onClick }) => {
    return (
        <div className="flex justify-center pb-2">
            <button
                onClick={onClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-stone-200 dark:text-stone-300 dark:bg-stone-700 rounded-full hover:bg-stone-300 dark:hover:bg-stone-600 transition-all shadow-sm"
                aria-label="إيقاف الإنشاء"
            >
                <StopCircleIcon className="w-4 h-4" />
                <span>وقّف الإجابة</span>
            </button>
        </div>
    );
};

export default StopButton;