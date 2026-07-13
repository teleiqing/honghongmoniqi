import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateReadTime(content: string): string {
  const words = content.length;
  const minutes = Math.max(1, Math.ceil(words / 300));
  return `${minutes}分钟`;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .select('id, title, summary, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取文章列表失败: ${error.message}`);
  }

  return (data as BlogPost[]) || [];
}

export async function getPostById(id: number): Promise<BlogPost | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .select('id, title, summary, content, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`获取文章详情失败: ${error.message}`);
  }

  return data as BlogPost | null;
}

export async function createPost(title: string, summary: string, content: string): Promise<BlogPost> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .insert({ title, summary, content })
    .select()
    .single();

  if (error) {
    throw new Error(`创建文章失败: ${error.message}`);
  }

  return data as BlogPost;
}

export function getFormattedDate(createdAt: string): string {
  return formatDate(createdAt);
}

export function getReadTime(content: string): string {
  return calculateReadTime(content);
}
