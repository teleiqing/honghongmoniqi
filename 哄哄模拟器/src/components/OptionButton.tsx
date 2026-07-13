'use client';

import { cn } from '@/lib/utils';
import { Option } from '@/types/game';

interface OptionButtonProps {
  option: Option;
  onClick: (option: Option) => void;
  disabled?: boolean;
}

export function OptionButton({ option, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      onClick={() => onClick(option)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg px-4 py-3 text-left transition-all duration-200',
        'bg-white border border-gray-200 shadow-sm',
        'hover:bg-gray-50 hover:border-gray-300',
        'active:bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed',
        'text-gray-800 text-sm leading-relaxed'
      )}
    >
      {/* 处理换行显示 */}
      {option.text.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < option.text.split('\n').length - 1 && <br />}
        </span>
      ))}
    </button>
  );
}