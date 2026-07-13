'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  score: number;
  scoreChange?: number;
}

export function ProgressBar({ score, scoreChange }: ProgressBarProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [animating, setAnimating] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    // 只有分数真正变化时才触发动画
    if (prevScoreRef.current !== score && scoreChange !== undefined && scoreChange !== 0) {
      setAnimating(true);
      const startScore = prevScoreRef.current;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentScore = startScore + scoreChange * progress;
        setDisplayScore(Math.round(currentScore));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimating(false);
          setDisplayScore(score);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayScore(score);
    }
    
    prevScoreRef.current = score;
  }, [score, scoreChange]);

  // 获取表情图标
  const getEmoji = () => {
    if (displayScore <= 0) return '😠';
    if (displayScore <= 30) return '😤';
    if (displayScore <= 60) return '😐';
    if (displayScore <= 80) return '😊';
    return '😍';
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* 表情 */}
      <span className="text-sm">{getEmoji()}</span>

      {/* 分数 */}
      <span className="text-xs font-medium text-gray-600">{displayScore}</span>

      {/* 分数变化动画 */}
      {scoreChange !== undefined && scoreChange !== 0 && animating && (
        <span
          className={cn(
            'text-xs font-bold animate-bounce',
            scoreChange > 0 ? 'text-green-600' : 'text-red-500'
          )}
        >
          {scoreChange > 0 ? '+' : ''}{scoreChange}
        </span>
      )}
    </div>
  );
}