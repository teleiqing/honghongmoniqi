import { NextRequest } from 'next/server';
import { z } from 'zod';
import { invokeChatCompletion } from '@/lib/openai';
import { createPost } from '@/lib/blog';
import { checkRateLimit, readLimitedJson, RequestError, reserveAISlot, verifyBearerToken } from '@/lib/request-security';

const blogInputSchema = z.object({ topic: z.string().trim().max(160).optional() });
const blogOutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1).max(12_000),
});

export async function POST(request: NextRequest) {
  // Fail closed: the blog writer stays disabled until a secret is configured.
  const adminToken = process.env.BLOG_ADMIN_TOKEN;
  if (!adminToken || Buffer.byteLength(adminToken, 'utf8') < 32) {
    return Response.json({ success: false, error: '文章生成功能未启用' }, { status: 503 });
  }
  if (!verifyBearerToken(request, adminToken)) {
    return Response.json({ success: false, error: '没有管理员权限' }, { status: 401 });
  }

  const retryAfter = checkRateLimit(request, 'blog');
  if (retryAfter !== null) {
    return Response.json(
      { success: false, error: '请求太频繁，请稍后重试' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const releaseSlot = reserveAISlot();
  if (!releaseSlot) {
    return Response.json(
      { success: false, error: '服务器繁忙，请稍后重试' },
      { status: 429, headers: { 'Retry-After': '10' } },
    );
  }

  try {
    const input = await readLimitedJson(request, 1_024);
    const validated = blogInputSchema.safeParse(input);
    if (!validated.success) {
      return Response.json({ success: false, error: '文章主题格式不正确' }, { status: 400 });
    }
    const { topic } = validated.data;

    const systemPrompt = `你是一位恋爱博主，专门写恋爱沟通技巧的文章。
你的写作风格轻松幽默，像跟朋友聊天一样，不要太说教。

文章要求：
1. 标题要吸引人，带有emoji
2. 摘要（summary）：用1-2句话概括文章核心观点，50-100字
3. 正文（content）：300-500字，使用Markdown格式
   - 开头用一个有趣的问题或场景引入
   - 分2-3个小节，每个小节有三级标题
   - 每小节包含具体的例子和建议
   - 结尾有总结或金句
   - 使用**加粗**突出重点
   - 使用-列表列出要点
4. 风格：轻松、幽默、接地气、有共鸣

请严格按照以下JSON格式返回：
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "文章正文（Markdown格式）"
}`;

    const userPrompt = topic
      ? `请写一篇关于"${topic}"的恋爱沟通技巧文章。`
      : `请随机写一篇恋爱沟通技巧相关的文章，主题可以是：
- 如何听懂对方的言外之意
- 吵架时的正确姿势
- 怎么夸人才不尴尬
- 异地恋怎么维持新鲜感
- 第一次约会聊什么
- 如何优雅地表达不满
- 为什么对方总说"你不懂我"
- 安全感是怎么来的

选一个你觉得最有趣的主题来写。`;

    const content = await invokeChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // 从 LLM 返回中提取 JSON（可能包含 markdown 代码块或其他文本）
    let result;
    try {
      // 先尝试直接解析
      result = JSON.parse(content);
    } catch {
      // 尝试从 markdown 代码块中提取
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        // 尝试提取第一个{到最后一个}之间的内容
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          result = JSON.parse(content.slice(firstBrace, lastBrace + 1));
        } else {
          throw new Error('无法解析LLM返回的JSON');
        }
      }
    }

    const postData = blogOutputSchema.safeParse(result);
    if (!postData.success) {
      throw new Error('生成的文章不符合保存格式');
    }

    // 保存到数据库
    const post = await createPost(
      postData.data.title,
      postData.data.summary,
      postData.data.content,
    );

    return Response.json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error instanceof RequestError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('生成文章失败:', error);
    return Response.json(
      { success: false, error: '生成文章失败' },
      { status: 500 }
    );
  } finally {
    releaseSlot();
  }
}
