import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '哄哄模拟器 - AI 扮演你的另一半',
  description: 'AI 扮演你的另一半，看看你能把它哄好吗？一个有趣的情侣沟通小游戏。',
  keywords: ['哄哄模拟器', '情侣游戏', 'AI 游戏', '沟通技巧'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
