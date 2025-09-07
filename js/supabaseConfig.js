/**
 * Supabase配置文件
 * 注意：此文件不包含实际的API密钥，需要在运行时通过环境变量或安全方式注入
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
    
    // 默认配置
    return {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
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
    return supabaseConfig.url !== 'YOUR_SUPABASE_URL' && 
           supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY';
}

// 导出配置
export { supabaseConfig, isSupabaseConfigured };