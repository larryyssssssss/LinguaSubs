/**
 * Supabase客户端实例
 * 用于与Supabase后端服务进行交互
 */

import { supabaseConfig, isSupabaseConfigured, getSupabaseConfig } from './supabaseConfig.js';

/**
 * 创建Supabase客户端实例
 */
let supabase;

// 检查Supabase配置是否完整
if (!isSupabaseConfigured()) {
    console.warn('Supabase配置不完整，请在 index.html 中设置 SUPABASE_CONFIG 或在 supabaseConfig.js 中设置实际的配置值');
    console.info('获取配置信息的步骤：');
    console.info('1. 访问 Supabase 控制台 (https://app.supabase.com/)');
    console.info('2. 选择您的项目');
    console.info('3. 在左侧菜单中点击 "Settings" -> "API"');
    console.info('4. 复制 "Project URL" 和 "anon public key"');
    console.info('5. 在 index.html 中的 SUPABASE_CONFIG 对象中设置这些值');
} else if (typeof window !== 'undefined' && window.supabase) {
    // 创建Supabase客户端
    const config = getSupabaseConfig();
    supabase = window.supabase.createClient(
        config.url,
        config.anonKey
    );
    console.log('Supabase客户端初始化成功');
} else {
    console.warn('Supabase SDK未正确加载');
    supabase = null;
}

/**
 * 检查Supabase客户端是否可用
 * @returns {boolean} Supabase客户端是否可用
 */
function isSupabaseAvailable() {
    return supabase !== null && isSupabaseConfigured();
}

// 导出Supabase客户端和检查函数
export { supabase, isSupabaseAvailable };