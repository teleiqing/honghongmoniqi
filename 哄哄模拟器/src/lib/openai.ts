import OpenAI from 'openai';
import type { VoiceType } from '@/types/game';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const OPENAI_VOICE_MAPPING: Record<VoiceType, OpenAI.Audio.SpeechCreateParams['voice']> = {
  gentle_female: 'nova',
  dominant_female: 'shimmer',
  cute_female: 'coral',
  deep_male: 'onyx',
  gentle_male: 'echo',
};

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  return new OpenAI({ apiKey });
}

export async function invokeChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
  },
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: options?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages,
    temperature: options?.temperature ?? 0.8,
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function synthesizeSpeech(
  text: string,
  voiceType: VoiceType,
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL ?? 'tts-1',
    voice: OPENAI_VOICE_MAPPING[voiceType],
    input: text,
    response_format: 'mp3',
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:audio/mp3;base64,${buffer.toString('base64')}`;
}
