import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostById, getFormattedDate, getReadTime } from '@/lib/blog';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: String(post.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) {
    return { title: '文章不存在' };
  }
  return {
    title: `${post.title} - 哄哄模拟器`,
    description: post.summary,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(Number(id));

  if (!post) {
    notFound();
  }

  // 解析内容，支持 Markdown 标题
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inParagraph: string[] = [];

    const flushParagraph = () => {
      if (inParagraph.length > 0) {
        elements.push(
          <p key={key++} className="text-gray-600 leading-relaxed mb-4">
            {inParagraph.join('\n')}
          </p>
        );
        inParagraph = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith('## ')) {
        flushParagraph();
        elements.push(
          <h2 key={key++} className="text-xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b border-pink-100">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushParagraph();
        elements.push(
          <h3 key={key++} className="text-lg font-bold text-gray-800 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('**') && line.endsWith('**') && !line.includes('\n')) {
        flushParagraph();
        elements.push(
          <p key={key++} className="font-bold text-gray-800 mb-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.startsWith('- ')) {
        flushParagraph();
        // 收集列表项
        const listItems: string[] = [line.replace('- ', '')];
        elements.push(
          <ul key={key++} className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-2">
            {listItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      } else if (line.startsWith('❌ ') || line.startsWith('✅ ')) {
        flushParagraph();
        const isError = line.startsWith('❌ ');
        elements.push(
          <p
            key={key++}
            className={`${
              isError ? 'text-red-500' : 'text-green-500'
            } font-medium mb-2`}
          >
            {line}
          </p>
        );
      } else if (line.trim() === '') {
        flushParagraph();
      } else {
        inParagraph.push(line);
      }
    }
    flushParagraph();

    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/blog" className="text-gray-500 hover:text-pink-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800 truncate">{post.title}</h1>
        </div>
      </div>

      {/* 文章内容 */}
      <article className="max-w-2xl mx-auto px-4 py-8">
        {/* 文章头图 */}
        <div className="h-48 -mx-4 -mt-8 mb-8 bg-gradient-to-r from-pink-200 via-pink-100 to-rose-200 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute text-pink-400 animate-pulse"
                style={{
                  left: `${5 + i * 8}%`,
                  top: `${15 + (i % 4) * 20}%`,
                  fontSize: `${18 + (i % 4) * 10}px`,
                  transform: `rotate(${-20 + i * 8}deg)`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                ♥
              </div>
            ))}
          </div>
          <span className="text-6xl relative z-10">💌</span>
        </div>

        {/* 文章信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
          <span>{getFormattedDate(post.created_at)}</span>
          <span>·</span>
          <span>{getReadTime(post.content)}</span>
        </div>

        {/* 文章正文 */}
        <div className="prose prose-pink max-w-none">
          {renderContent(post.content)}
        </div>

        {/* 底部卡片 */}
        <div className="mt-12 p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎮</span>
            <h3 className="font-bold text-gray-800">学完了？来实战一下！</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            说得好不如做得好，去哄哄模拟器试试你学到的技巧吧！
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-pink-500 font-medium rounded-full shadow-sm hover:shadow-md transition-all"
          >
            开始游戏
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </article>
    </div>
  );
}
