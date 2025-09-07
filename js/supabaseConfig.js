/**
 * Supabase配置文件
 * 
 * 要获取这些配置信息，请按照以下步骤操作：
 * 1. 访问 Supabase 控制台 (https://app.supabase.com/)
 * 2. 选择您的项目
 * 3. 在左侧菜单中点击 "Settings" (设置)
 * 4. 点击 "API" 选项卡
 * 5. 复制 "Project URL" 和 "anon public key"
 */

// 获取Supabase配置
function getSupabaseConfig() {
    // 检查全局配置是否存在
    if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
        return {
            url: window.SUPABASE_CONFIG.url,
            anonKey: window.SUPABASE_CONFIG.anonKey
        };
    }
    
    // 如果没有全局配置，返回默认值（需要替换为实际值）
    console.warn('请在 index.html 中配置 SUPABASE_CONFIG 或在此文件中设置实际的 Supabase 配置');
    return {
        url: 'https://your-project-id.supabase.co', // 替换为您的 Supabase 项目 URL
        anonKey: 'your-anon-key-here' // 替换为您的 Supabase 匿名密钥
    };
}

// Supabase配置对象
const supabaseConfig = {
    // Supabase项目URL - 需要替换为实际的项目URL
    url: getSupabaseConfig().url,
    
    // Supabase匿名密钥 - 需要替换为实际的匿名密钥
    anonKey: getSupabaseConfig().anonKey,
    
    // 存储桶名称
    storage: {
        // 字幕文件存储桶
        subtitlesBucket: 'subtitles',
        // 封面图片存储桶
        coversBucket: 'covers'
    },
    
    // 数据表名称
    tables: {
        // 电影表
        movies: 'movies',
        // 用户学习进度表
        userProgress: 'user_progress'
    }
};

// 检查配置是否完整
function isSupabaseConfigured() {
    const config = getSupabaseConfig();
    return config.url && 
           config.url !== 'https://your-project-id.supabase.co' && 
           config.anonKey && 
           config.anonKey !== 'your-anon-key-here';
}

// 导出配置
export { supabaseConfig, isSupabaseConfigured, getSupabaseConfig };