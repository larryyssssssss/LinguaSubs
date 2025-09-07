/**
 * Supabase客户端实例
 * 用于与Supabase后端服务进行交互
 */

import { supabaseConfig } from './supabaseConfig.js';

/**
 * 创建Supabase客户端实例
 * 注意：实际的URL和密钥需要通过环境变量或安全方式注入
 */
let supabase;

// 检查是否已经配置了Supabase并且全局supabase对象存在
if (typeof window !== 'undefined' && window.supabase && supabaseConfig.url !== 'YOUR_SUPABASE_URL' && 
    supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = window.supabase.createClient(
        supabaseConfig.url,
        supabaseConfig.anonKey
    );
} else if (typeof window !== 'undefined' && window.supabase) {
    // 如果配置不完整但仍想初始化一个客户端用于测试
    console.warn('Supabase配置不完整，使用默认配置');
    supabase = window.supabase.createClient(
        supabaseConfig.url,
        supabaseConfig.anonKey
    );
} else {
    console.warn('Supabase SDK未正确加载');
    supabase = null;
}

/**
 * 检查Supabase客户端是否可用
 * @returns {boolean} Supabase客户端是否可用
 */
function isSupabaseAvailable() {
    return supabase !== null;
}

// 导出Supabase客户端和检查函数
export { supabase, isSupabaseAvailable };