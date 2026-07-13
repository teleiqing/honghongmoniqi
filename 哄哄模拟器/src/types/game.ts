// 游戏类型定义

// 性别选择
export type Gender = 'girlfriend' | 'boyfriend';

// 声音类型
export type VoiceType =
  | 'gentle_female'    // 温柔女声
  | 'dominant_female'  // 霸道御姐
  | 'cute_female'      // 可爱软妹
  | 'deep_male'        // 低沉男声
  | 'gentle_male';     // 温柔男声

// 预设场景
export interface Scenario {
  id: string;
  title: string;
  description: string;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'partner' | 'user';
  content: string;
  timestamp: number;
  audioUri?: string;  // 语音地址
}

// 选项
export interface Option {
  id: string;
  text: string;
  scoreChange: number;  // 好感度变化值，用户不可见
  isGood: boolean;      // 是否为加分选项
}

// 游戏状态
export interface GameState {
  gender: Gender;
  voiceType: VoiceType;
  scenario: Scenario;
  messages: ChatMessage[];
  currentOptions: Option[];
  score: number;          // 好感度分数（初始20，满分100，最低-50）
  round: number;          // 当前轮次
  maxRounds: number;      // 最大轮次（10）
  status: 'playing' | 'won' | 'lost';
  isGenerating: boolean;  // 是否正在生成回复
}

// API 请求类型
export interface GenerateRequest {
  scenario: Scenario;
  gender: Gender;
  voiceType: VoiceType;
  history: ChatMessage[];
  currentScore: number;
  currentRound: number;
  userChoice?: string;  // 用户选择的选项文本
}

// API 响应类型
export interface GenerateResponse {
  partnerMessage: string;
  options: Option[];
  scoreChange: number;
  newScore: number;
  audioUri?: string;
}

// 预设场景列表
export const SCENARIOS: Scenario[] = [
  {
    id: 'anniversary',
    title: '忘记纪念日',
    description: '今天是你们在一起三周年，你完全忘了',
  },
  {
    id: 'late_night',
    title: '深夜不回消息',
    description: '你昨晚打游戏到凌晨三点，对方发了十几条消息你都没回',
  },
  {
    id: 'chat_with_other',
    title: '被发现和异性聊天',
    description: '对方看到你和异性朋友的暧昧聊天记录',
  },
  {
    id: 'lost_cat',
    title: '把对方的猫弄丢了',
    description: '你帮对方照顾猫的时候，猫跑丢了',
  },
  {
    id: 'public_embarrassment',
    title: '当众让对方没面子',
    description: '你在朋友聚会上开了一个过分的玩笑',
  },
];

// 好感度阈值
export const SCORE_THRESHOLDS = {
  min: -50,       // 最低分数
  initial: 20,    // 初始分数
  win: 80,        // 胜利分数
  max: 100,       // 最高分数
};

// 情绪阶段映射（根据好感度）
export function getEmotionStage(score: number): string {
  if (score <= 0) return '非常生气，冷暴力或激烈质问';
  if (score <= 30) return '还在生气，但愿意听你说';
  if (score <= 60) return '开始软化，嘴上生气但语气缓和';
  if (score <= 80) return '快被哄好了，可能撒娇或小声说"哼"';
  return '原谅了，但还要你保证不再犯';
}