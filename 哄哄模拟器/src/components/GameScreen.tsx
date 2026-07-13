'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ChatBubble } from './ChatBubble';
import { OptionButton } from './OptionButton';
import { ProgressBar } from './ProgressBar';
import {
  Gender,
  VoiceType,
  Scenario,
  GameState,
  Option,
  ChatMessage,
  GenerateResponse,
  SCORE_THRESHOLDS,
} from '@/types/game';

// 撒花动画组件
function ConfettiAnimation() {
  const confettiConfig = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 2}s`,
      color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#95E1D3'][i % 5],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiConfig.map((config, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: config.left,
            animationDelay: config.delay,
            animationDuration: config.duration,
          }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" fill={config.color} />
          </svg>
        </div>
      ))}
    </div>
  );
}

// 心碎动画组件
function HeartbreakAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-heartbreak">
        <svg className="w-24 h-24 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
}

// 对方头像（顶部导航栏用）
function PartnerNavAvatar({ gender }: { gender: 'girlfriend' | 'boyfriend' }) {
  if (gender === 'girlfriend') {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-200 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="18" fill="#FFE4E1" />
          <ellipse cx="20" cy="12" rx="14" ry="8" fill="#8B4513" />
          <ellipse cx="10" cy="18" rx="4" ry="10" fill="#8B4513" />
          <ellipse cx="30" cy="18" rx="4" ry="10" fill="#8B4513" />
          <ellipse cx="14" cy="22" rx="2.5" ry="3" fill="#333" />
          <ellipse cx="26" cy="22" rx="2.5" ry="3" fill="#333" />
          <path d="M16 28 Q20 31 24 28" stroke="#E57373" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="#E3F2FD" />
        <ellipse cx="20" cy="10" rx="12" ry="6" fill="#424242" />
        <ellipse cx="14" cy="22" rx="2" ry="2.5" fill="#333" />
        <ellipse cx="26" cy="22" rx="2" ry="2.5" fill="#333" />
        <path d="M16 28 L24 28" stroke="#5D4037" strokeWidth="2" />
      </svg>
    </div>
  );
}

interface GameScreenProps {
  gender: Gender;
  voiceType: VoiceType;
  scenario: Scenario;
  onRestart: () => void;
}

export function GameScreen({ gender, voiceType, scenario, onRestart }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>({
    gender,
    voiceType,
    scenario,
    messages: [],
    currentOptions: [],
    score: SCORE_THRESHOLDS.initial,
    round: 0,
    maxRounds: 10,
    status: 'playing',
    isGenerating: true,
  });

  const [lastScoreChange, setLastScoreChange] = useState<number | undefined>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 生成第一轮对话
  const generateFirstRound = useCallback(async () => {
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          gender,
          voiceType,
          history: [],
          currentScore: SCORE_THRESHOLDS.initial,
          currentRound: 0,
        }),
      });

      const data: GenerateResponse = await response.json();

      const firstMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'partner',
        content: data.partnerMessage,
        timestamp: Date.now(),
        audioUri: data.audioUri,
      };

      setGameState(prev => ({
        ...prev,
        messages: [firstMessage],
        currentOptions: data.options,
        score: data.newScore,
        round: 1,
        isGenerating: false,
      }));

      if (data.audioUri && audioRef.current) {
        audioRef.current.src = data.audioUri;
        audioRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error('生成对话失败:', error);
      setGameState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [scenario, gender, voiceType]);

  // 初始化游戏
  useEffect(() => {
    generateFirstRound();
  }, [generateFirstRound]);

  // 处理用户选择选项
  const handleSelectOption = async (option: Option) => {
    setGameState(prev => ({ ...prev, isGenerating: true }));
    setLastScoreChange(undefined);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: option.text,
      timestamp: Date.now(),
    };

    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      currentOptions: [],
    }));

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          gender,
          voiceType,
          history: [...gameState.messages, userMessage],
          currentScore: gameState.score,
          currentRound: gameState.round,
          userChoice: option.text,
        }),
      });

      const data: GenerateResponse = await response.json();

      const partnerMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'partner',
        content: data.partnerMessage,
        timestamp: Date.now(),
        audioUri: data.audioUri,
      };

      const newScore = data.newScore;
      const newRound = gameState.round + 1;

      let status: 'playing' | 'won' | 'lost' = 'playing';
      if (newScore >= SCORE_THRESHOLDS.win) {
        status = 'won';
      } else if (newScore <= SCORE_THRESHOLDS.min || newRound >= gameState.maxRounds) {
        status = 'lost';
      }

      setGameState(prev => ({
        ...prev,
        messages: [...prev.messages, partnerMessage],
        currentOptions: status === 'playing' ? data.options : [],
        score: newScore,
        round: newRound,
        status,
        isGenerating: false,
      }));

      setLastScoreChange(data.scoreChange);

      if (data.audioUri && audioRef.current) {
        audioRef.current.src = data.audioUri;
        audioRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error('生成对话失败:', error);
      setGameState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // 播放语音
  const handlePlayAudio = (message: ChatMessage) => {
    if (message.audioUri && audioRef.current) {
      audioRef.current.src = message.audioUri;
      audioRef.current.play().catch(() => {});
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [gameState.messages]);

  // 获取对方称呼
  const partnerName = gender === 'girlfriend' ? '她' : '他';

  return (
    <div className="h-full flex flex-col bg-[#EDEDED]">
      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} className="hidden" />

      {/* 顶部导航栏（微信风格） */}
      <header className="sticky top-0 bg-[#EDEDED] border-b border-gray-300 px-4 py-3 flex items-center justify-between z-10">
        {/* 左侧：返回按钮 */}
        <button
          onClick={onRestart}
          className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 中间：对方信息和好感度 */}
        <div className="flex items-center gap-3">
          <PartnerNavAvatar gender={gender} />
          <div className="flex flex-col items-center">
            <span className="text-base font-medium text-black">{scenario.title}</span>
            <div className="flex items-center gap-2 mt-1">
              <ProgressBar score={gameState.score} scoreChange={lastScoreChange} />
              <span className="text-xs text-gray-500">
                第{gameState.round}/{gameState.maxRounds}轮
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：更多按钮 */}
        <button className="text-black opacity-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </header>

      {/* 聊天区域（微信风格背景） */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {gameState.messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            gender={gender}
            onPlayAudio={() => handlePlayAudio(message)}
          />
        ))}

        {/* 生成中提示 */}
        {gameState.isGenerating && (
          <div className="flex justify-start gap-2 items-end mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-200 flex items-center justify-center">
              {gender === 'girlfriend' ? (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <circle cx="20" cy="20" r="18" fill="#FFE4E1" />
                  <ellipse cx="20" cy="12" rx="14" ry="8" fill="#8B4513" />
                </svg>
              ) : (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <circle cx="20" cy="20" r="18" fill="#E3F2FD" />
                  <ellipse cx="20" cy="10" rx="12" ry="6" fill="#424242" />
                </svg>
              )}
            </div>
            <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部选项区域（微信输入栏风格） */}
      {!gameState.isGenerating && gameState.status === 'playing' && gameState.currentOptions.length > 0 && (
        <div className="sticky bottom-0 bg-[#F7F7F7] border-t border-gray-300 px-3 py-3">
          {/* 选项标题 */}
          <div className="text-xs text-gray-500 mb-2 text-center">
            选择你的回复
          </div>

          {/* 选项列表 */}
          <div className="flex flex-col gap-2">
            {gameState.currentOptions.map((option) => (
              <OptionButton
                key={option.id}
                option={option}
                onClick={handleSelectOption}
              />
            ))}
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameState.status !== 'playing' && (
        <div className="fixed inset-0 bg-[#EDEDED] flex items-center justify-center z-40">
          {gameState.status === 'won' && <ConfettiAnimation />}
          {gameState.status === 'lost' && <HeartbreakAnimation />}

          <div className="text-center px-8 max-w-md bg-white rounded-xl shadow-lg p-6">
            {/* 结果标题 */}
            <h1 className="text-2xl font-bold mb-3">
              {gameState.status === 'won' ? '🎉 哄好了！' : '💔 失败了...'}
            </h1>

            {/* 最终消息 */}
            {gameState.messages.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {partnerName}最后说：
                </p>
                <p className="text-base text-gray-800 mt-2">
                  {gameState.messages[gameState.messages.length - 1].content}
                </p>
              </div>
            )}

            {/* 结果描述 */}
            <p className="text-gray-500 mb-4">
              {gameState.status === 'won'
                ? '你成功在10轮内把对方哄好了！'
                : gameState.score <= SCORE_THRESHOLDS.min
                  ? '好感度降到了最低...'
                  : '10轮用完了，好感度还不够高...'}
            </p>

            {/* 最终好感度 */}
            <div className="mb-4">
              <span className="text-sm text-gray-500">最终好感度：</span>
              <span className="text-lg font-bold ml-2">
                {gameState.score > 60 ? '😊' : gameState.score > 30 ? '😐' : '😠'}
                {gameState.score}分
              </span>
            </div>

            {/* 重新开始按钮 */}
            <button
              onClick={onRestart}
              className="w-full px-6 py-3 bg-[#07C160] text-white rounded-lg font-medium hover:bg-[#06AD56] transition-colors"
            >
              {gameState.status === 'won' ? '再挑战一次' : '再试一次'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}