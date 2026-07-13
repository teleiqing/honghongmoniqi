import Link from 'next/link';
import { getAllPosts, getFormattedDate, getReadTime } from '@/lib/blog';

export const metadata = {
  title: '恋爱攻略 - 哄哄模拟器',
  description: '实用的恋爱沟通技巧，让你更懂对方的心',
};

export default async function BlogListPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-pink-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">恋爱攻略</h1>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-pink-50 hover:border-pink-200 group"
            >
              <div className="p-6">
                {/* 文章头图装饰 */}
                <div className="h-32 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-pink-200 via-pink-100 to-rose-200 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute text-pink-400"
                        style={{
                          left: `${10 + i * 12}%`,
                          top: `${20 + (i % 3) * 25}%`,
                          fontSize: `${20 + (i % 3) * 8}px`,
                          transform: `rotate(${-15 + i * 5}deg)`,
                        }}
                      >
                        ♥
                      </div>
                    ))}
                  </div>
                  <span className="text-4xl">💌</span>
                </div>

                {/* 标题 */}
                <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-pink-500 transition-colors">
                  {post.title}
                </h2>

                {/* 摘要 */}
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                  {post.summary}
                </p>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{getFormattedDate(post.created_at)}</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getReadTime(post.content)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>更多攻略正在更新中…</p>
          <p className="mt-1">玩累了就来看看攻略吧 💖</p>
        </div>
      </div>
    </div>
  );
}
