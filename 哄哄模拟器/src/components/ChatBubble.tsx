'use client';

import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/game';

interface ChatBubbleProps {
  message: ChatMessage;
  gender: 'girlfriend' | 'boyfriend';
  onPlayAudio?: () => void;
}

// 对方头像 SVG（圆形头像框）
function PartnerAvatar({ gender }: { gender: 'girlfriend' | 'boyfriend' }) {
  if (gender === 'girlfriend') {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-200 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* 可爱女生头像 */}
          <circle cx="20" cy="20" r="18" fill="#FFE4E1" />
          {/* 头发 */}
          <ellipse cx="20" cy="12" rx="14" ry="8" fill="#8B4513" />
          <ellipse cx="10" cy="18" rx="4" ry="10" fill="#8B4513" />
          <ellipse cx="30" cy="18" rx="4" ry="10" fill="#8B4513" />
          {/* 眼睛 */}
          <ellipse cx="14" cy="22" rx="2.5" ry="3" fill="#333" />
          <ellipse cx="26" cy="22" rx="2.5" ry="3" fill="#333" />
          <circle cx="15" cy="21" r="1" fill="white" />
          <circle cx="27" cy="21" r="1" fill="white" />
          {/* 脸颊 */}
          <ellipse cx="10" cy="26" rx="2" ry="1.5" fill="#FFB6C1" opacity="0.6" />
          <ellipse cx="30" cy="26" rx="2" ry="1.5" fill="#FFB6C1" opacity="0.6" />
          {/* 嘴巴 */}
          <path d="M16 28 Q20 31 24 28" stroke="#E57373" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        {/* 男生头像 */}
        <circle cx="20" cy="20" r="18" fill="#E3F2FD" />
        {/* 头发 */}
        <ellipse cx="20" cy="10" rx="12" ry="6" fill="#424242" />
        {/* 眼睛 */}
        <ellipse cx="14" cy="22" rx="2" ry="2.5" fill="#333" />
        <ellipse cx="26" cy="22" rx="2" ry="2.5" fill="#333" />
        {/* 嘴巴 */}
        <path d="M16 28 L24 28" stroke="#5D4037" strokeWidth="2" />
      </svg>
    </div>
  );
}

// 用户头像 SVG（圆形头像框）
function UserAvatar() {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        {/* 简单用户头像 */}
        <circle cx="20" cy="20" r="18" fill="#F5F5F5" />
        {/* 头发 */}
        <ellipse cx="20" cy="10" rx="10" ry="5" fill="#9E9E9E" />
        {/* 眼睛 */}
        <circle cx="14" cy="22" r="2" fill="#333" />
        <circle cx="26" cy="22" r="2" fill="#333" />
        {/* 嘴巴 */}
        <path d="M16 28 L24 28" stroke="#757575" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function ChatBubble({ message, gender, onPlayAudio }: ChatBubbleProps) {
  const isPartner = message.role === 'partner';

  // 格式化时间显示
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={cn('flex flex-col mb-3', isPartner ? 'items-start' : 'items-end')}>
      {/* 时间戳 */}
      <div className="text-xs text-gray-400 mb-1 px-2">
        {formatTime(message.timestamp)}
      </div>

      {/* 消息行 */}
      <div
        className={cn(
          'flex gap-2 items-end max-w-[75%]',
          isPartner ? 'flex-row' : 'flex-row-reverse'
        )}
      >
        {/* 头像 */}
        <div className="flex-shrink-0">
          {isPartner ? (
            <PartnerAvatar gender={gender} />
          ) : (
            <UserAvatar />
          )}
        </div>

        {/* 气泡 */}
        <div className="relative">
          {/* 气泡尾巴 */}
          {isPartner ? (
            <div className="absolute -left-2 bottom-2 w-2 h-2 bg-white border-l border-b border-gray-200 transform rotate-45" />
          ) : (
            <div className="absolute -right-2 bottom-2 w-2 h-2 bg-[#95EC69] border-r border-b border-[#7ED957] transform -rotate-45" />
          )}

          {/* 气泡内容 */}
          <div
            className={cn(
              'rounded-lg px-3 py-2 relative shadow-sm',
              isPartner
                ? 'bg-white border border-gray-200 text-gray-800'
                : 'bg-[#95EC69] text-black'
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>

          {/* 语音播放按钮 */}
          {isPartner && message.audioUri && onPlayAudio && (
            <button
              onClick={onPlayAudio}
              className={cn(
                'absolute -bottom-1',
                isPartner ? '-right-1' : '-left-1',
                'w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              )}
            >
              <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}