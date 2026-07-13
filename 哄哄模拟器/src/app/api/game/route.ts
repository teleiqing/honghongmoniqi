import { NextRequest, NextResponse } from 'next/server';
import { invokeChatCompletion, synthesizeSpeech, type ChatMessage } from '@/lib/openai';
import {
  GenerateRequest,
  GenerateResponse,
  Option,
  getEmotionStage,
  SCORE_THRESHOLDS,
} from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // 构建系统提示
    const systemPrompt = buildSystemPrompt(body);

    // 构建对话历史
    const messages = buildMessages(systemPrompt, body);

    // 调用 OpenAI 生成回复
    const content = await invokeChatCompletion(messages, {
      temperature: 0.8,
    });

    // 解析 LLM 响应
    const parsed = parseLLMResponse(content, body.currentScore);

    // 生成语音
    let audioUri: string | undefined;
    try {
      audioUri = await synthesizeSpeech(parsed.partnerMessage, body.voiceType);
    } catch (ttsError) {
      console.error('TTS generation failed:', ttsError);
      // 不阻断游戏流程，语音失败时继续返回文本
    }

    // 构建响应
    const response: GenerateResponse = {
      partnerMessage: parsed.partnerMessage,
      options: parsed.options,
      scoreChange: parsed.scoreChange,
      newScore: parsed.newScore,
      audioUri,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json(
      { error: '生成对话失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 构建系统提示
function buildSystemPrompt(body: GenerateRequest): string {
  const genderText = body.gender === 'girlfriend' ? '女朋友' : '男朋友';
  const emotionStage = getEmotionStage(body.currentScore);
  
  // 提取已说过的话（避免重复）
  const previousMessages = body.history
    .filter(msg => msg.role === 'partner')
    .map(msg => msg.content)
    .slice(-5); // 最近5条
  
  const previousMessagesText = previousMessages.length > 0
    ? `\n\n# 已说过的话（绝对不要重复或相似！）
${previousMessages.map((msg, i) => `第${i + 1}轮："${msg}"`).join('\n')}

⚠️ 重要规则：
- 你的回复必须和上面的内容完全不同，不要说相似的话
- 不要重复使用相同的表达方式、语气词或句式
- 每轮都要有新的内容、新的情绪表达
- 如果之前说过"哼"，这次就不能再说"哼"
- 如果之前说过"不理你了"，这次就不能说类似的话`
    : '';

  return `你是一个"哄哄模拟器"游戏中的AI角色，扮演一个正在生气的${genderText}。

# 核心设定
- 场景：${body.scenario.title} - ${body.scenario.description}
- 当前好感度：${body.currentScore}分（满分100，最低-50）
- 当前情绪状态：${emotionStage}
- 当前轮次：第${body.currentRound + 1}轮（共10轮）${previousMessagesText}

# 你的性格特点
${body.gender === 'girlfriend' ? `
- 俏皮可爱，生气时也要带点撒娇的感觉
- 嘴上说生气，但其实心里还关心对方
- 不会真的让人不舒服，只是想让对方重视自己
- 语言风格：口语化、表情丰富、偶尔用语气词、表情符号
- 会说："哼～"、"讨厌"、"你干嘛呀"、"滚开（其实是撒娇）"、"不理你了"
` : `
- 沉稳但生气，话不多但语气有分量
- 生气时会沉默或冷言冷语
- 不会大吵大闹，但会用行动表达不满
- 语言风格：简洁、直接、偶尔有点小脾气
- 会说："行"、"随便你"、"没生气"、"不用说了"
`}

# 回复规则
1. 每轮回复必须包含两部分：
   - 你的话（自然口语，符合当前情绪，像微信聊天一样真实）
   - 6个回复选项供用户选择

2. 选项设计要求（非常重要！）：
   - 2个加分选项（+5到+20分）：真诚道歉、具体弥补方案、提起共同回忆等
   - 4个减分选项（-5到-30分），其中搞笑选项必须让人"忍不住想选、选完又后悔"：
     
     【减分选项风格指南】
     - 普通减分（1个）：敷衍、敷衍但有一点真心、转移话题
       示例："随便"、"好吧"、"那你想怎样"、"行行行我错了"
     
     - 搞笑减分（3个）：必须满足以下特点之一：
       * 听起来很有道理但其实在找死
         示例："我错了，但你也有错啊你不应该生气"、"咱俩互相道歉吧你先开始"
       * 离谱到好笑但又很诱惑
         示例："要不我给你表演个后空翻？"、"你要是不生气了我就去打游戏了"
       * 好像在道歉其实在敷衍
         示例："对不起对不起对不起（敷衍三连）"、"我错了下次还敢"
       * 看起来是解决方案但根本不靠谱
         示例："要不咱俩分手冷静一下？"、"我请你吃肯德基疯狂星期四抵消这件事行不行"
       * 试图用幽默化解但其实火上浇油
         示例："别生气了生气会长皱纹的"、"你看我这张脸多真诚你原谅我吧"
       * 自以为很聪明其实在找死
         示例："你要是不原谅我我就...我就去吃顿好的"、"生气伤肝我心疼你别气了"

3. 选项必须随机打乱顺序，不要把加分项固定在某个位置

4. 对话必须连贯：
   - 承接上一轮的对话内容
   - 根据好感度变化调整情绪
   - 不要重复之前说过的话

5. 好感度变化规则：
   - 根据用户选择的选项给出分数变化
   - 分数变化后要体现在下一轮的情绪中

# 输出格式要求（严格遵守JSON格式）
{
  "message": "你说的话（自然口语，像微信聊天）",
  "scoreChange": 数字（正负整数），
  "options": [
    {"id": "1", "text": "选项内容", "scoreChange": 数字},
    {"id": "2", "text": "选项内容", "scoreChange": 数字},
    {"id": "3", "text": "选项内容", "scoreChange": 数字},
    {"id": "4", "text": "选项内容", "scoreChange": 数字},
    {"id": "5", "text": "选项内容", "scoreChange": 数字},
    {"id": "6", "text": "选项内容", "scoreChange": 数字}
  ]
}

# 注意事项
- 选项文本要口语化，像真实微信聊天
- 不要评判用户选择的选项是否合理
- 保持轻松有趣的氛围，不要真的让人不舒服
- 游戏结束（好感度>=80或<=-50）时，message要体现最终情绪`;
}

// 构建消息数组
function buildMessages(systemPrompt: string, body: GenerateRequest): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // 如果是第一轮，添加初始提示
  if (body.history.length === 0) {
    messages.push({
      role: 'user',
      content: '游戏开始，请生成第一轮对话和6个选项。',
    });
  } else {
    // 添加历史对话
    body.history.forEach((msg) => {
      if (msg.role === 'partner') {
        messages.push({ role: 'assistant', content: msg.content });
      } else {
        messages.push({ role: 'user', content: msg.content });
      }
    });

    // 如果用户已经选择了，提示AI生成下一轮
    if (body.userChoice) {
      messages.push({
        role: 'user',
        content: `我选择了"${body.userChoice}"，请根据我的选择给出回复和新的6个选项。`,
      });
    }
  }

  return messages;
}

// 解析LLM响应
function parseLLMResponse(content: string, currentScore: number): {
  partnerMessage: string;
  options: Option[];
  scoreChange: number;
  newScore: number;
} {
  try {
    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 提取并处理选项
    const options: Option[] = parsed.options.map((opt: { id: string; text: string; scoreChange: number }, index: number) => ({
      id: opt.id || `${index + 1}`,
      text: opt.text,
      scoreChange: opt.scoreChange,
      isGood: opt.scoreChange > 0,
    }));

    // 随机打乱选项顺序
    shuffleArray(options);

    // 计算新分数
    const scoreChange = parsed.scoreChange || 0;
    const newScore = Math.max(
      SCORE_THRESHOLDS.min,
      Math.min(SCORE_THRESHOLDS.max, currentScore + scoreChange)
    );

    return {
      partnerMessage: parsed.message,
      options,
      scoreChange,
      newScore,
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error, content);
    
    // 返回默认值作为fallback
    return {
      partnerMessage: '哼，我还在生气呢，你倒是说说看你想怎么哄我？',
      options: generateDefaultOptions(),
      scoreChange: 0,
      newScore: currentScore,
    };
  }
}

// 生成默认选项（fallback）
function generateDefaultOptions(): Option[] {
  return [
    { id: '1', text: '对不起，我真的知道错了，以后不会再这样了', scoreChange: 10, isGood: true },
    { id: '2', text: '我给你买了你喜欢的奶茶，我们一起喝吧', scoreChange: 15, isGood: true },
    { id: '3', text: '你又怎么了？', scoreChange: -10, isGood: false },
    { id: '4', text: '我错了，但你也有错啊', scoreChange: -15, isGood: false },
    { id: '5', text: '要不我给你跳一段？', scoreChange: -20, isGood: false },
    { id: '6', text: '我请你吃肯德基疯狂星期四行不行', scoreChange: -25, isGood: false },
  ];
}

// 随机打乱数组
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}