'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameScreen } from '@/components/GameScreen';
import { Gender, VoiceType, Scenario, SCENARIOS } from '@/types/game';

// 声音类型选项
const VOICE_OPTIONS: { id: VoiceType; label: string; description: string }[] = [
  { id: 'gentle_female', label: '温柔女声', description: '轻声细语，温柔体贴' },
  { id: 'dominant_female', label: '霸道御姐', description: '气场强大，敢爱敢恨' },
  { id: 'cute_female', label: '可爱软妹', description: '撒娇卖萌，软糯粘人' },
  { id: 'deep_male', label: '低沉男声', description: '成熟稳重，深邃有力' },
  { id: 'gentle_male', label: '温柔男声', description: '温和儒雅，体贴入微' },
];

// 性别选项
const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'girlfriend', label: '女朋友' },
  { id: 'boyfriend', label: '男朋友' },
];

export default function Home() {
  const [step, setStep] = useState<'gender' | 'voice' | 'scenario' | 'playing'>('gender');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const handleSelectGender = (gender: Gender) => {
    setSelectedGender(gender);
    setStep('voice');
  };

  const handleSelectVoice = (voice: VoiceType) => {
    setSelectedVoice(voice);
    setStep('scenario');
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStep('playing');
  };

  const handleRestart = () => {
    setStep('gender');
    setSelectedGender(null);
    setSelectedVoice(null);
    setSelectedScenario(null);
  };

  return (
    <main className="h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50">
      {/* 性别选择 */}
      {step === 'gender' && (
        <div className="h-full flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">哄哄模拟器</h1>
            <p className="text-gray-500">AI 扮演你的另一半，看看你能把它哄好吗？</p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm text-pink-500 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            恋爱攻略
          </Link>

          <div className="w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-700 mb-4 text-center">选择对方的身份</h2>

            <div className="grid grid-cols-2 gap-4">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectGender(option.id)}
                  className="rounded-2xl p-6 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* 头像 */}
                    {option.id === 'girlfriend' ? (
                      <svg viewBox="0 0 60 60" className="w-16 h-16 group-hover:scale-110 transition-transform">
                        <circle cx="30" cy="30" r="28" fill="#FFE4E1" />
                        <circle cx="30" cy="30" r="25" fill="#FFB6C1" />
                        <ellipse cx="30" cy="18" rx="20" ry="12" fill="#8B4513" />
                        <ellipse cx="15" cy="28" rx="5" ry="15" fill="#8B4513" />
                        <ellipse cx="45" cy="28" rx="5" ry="15" fill="#8B4513" />
                        <ellipse cx="22" cy="33" rx="3.5" ry="4" fill="#333" />
                        <ellipse cx="38" cy="33" rx="3.5" ry="4" fill="#333" />
                        <circle cx="23" cy="31" r="1.5" fill="white" />
                        <circle cx="39" cy="31" r="1.5" fill="white" />
                        <ellipse cx="15" cy="40" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
                        <ellipse cx="45" cy="40" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
                        <path d="M24 42 Q30 48 36 42" stroke="#E57373" strokeWidth="2.5" fill="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 60 60" className="w-16 h-16 group-hover:scale-110 transition-transform">
                        <circle cx="30" cy="30" r="28" fill="#E3F2FD" />
                        <circle cx="30" cy="30" r="25" fill="#90CAF9" />
                        <ellipse cx="30" cy="15" rx="18" ry="9" fill="#424242" />
                        <ellipse cx="22" cy="33" rx="3" ry="3.5" fill="#333" />
                        <ellipse cx="38" cy="33" rx="3" ry="3.5" fill="#333" />
                        <path d="M24 42 L36 42" stroke="#5D4037" strokeWidth="2.5" />
                      </svg>
                    )}
                    <span className="text-lg font-medium text-gray-800">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 声音选择 */}
      {step === 'voice' && selectedGender && (
        <div className="h-full flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            <button
              onClick={() => setStep('gender')}
              className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>

            <h2 className="text-lg font-medium text-gray-700 mb-4 text-center">
              选择{selectedGender === 'girlfriend' ? '她' : '他'}的声音类型
            </h2>

            {/* 根据性别过滤声音选项 */}
            <div className="grid grid-cols-1 gap-3">
              {VOICE_OPTIONS
                .filter((v) =>
                  selectedGender === 'girlfriend'
                    ? v.id.includes('female')
                    : v.id.includes('male')
                )
                .map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectVoice(option.id)}
                    className="rounded-xl p-4 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-base font-medium text-gray-800">{option.label}</span>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </div>
                      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 场景选择 */}
      {step === 'scenario' && selectedGender && selectedVoice && (
        <div className="h-full flex flex-col items-center justify-center px-4 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            <button
              onClick={() => setStep('voice')}
              className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>

            <h2 className="text-lg font-medium text-gray-700 mb-4 text-center">
              选择一个场景开始游戏
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className="rounded-xl p-4 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-base font-medium text-gray-800">{scenario.title}</span>
                      <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                    </div>
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 游戏进行中 */}
      {step === 'playing' && selectedGender && selectedVoice && selectedScenario && (
        <GameScreen
          gender={selectedGender}
          voiceType={selectedVoice}
          scenario={selectedScenario}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}