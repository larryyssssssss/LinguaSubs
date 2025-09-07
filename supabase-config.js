/**
 * 实际的Supabase配置文件
 * 请将此文件中的占位符替换为您的实际Supabase项目信息
 */

// 从环境变量获取配置，如果没有则使用默认值
const SUPABASE_URL = 'https://pnsmvvtjdumgkvboelws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc212dnRqZHVtZ2t2Ym9lbHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzIyODksImV4cCI6MjA3MjgwODI4OX0.6k4-7LRuLu8nfp1tzIP2HlVIIIIR_0rAzBXIpoP-FZo';

// 导出配置
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
};

console.log('Supabase配置已加载');