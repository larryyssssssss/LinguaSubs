/**
 * 数据服务层
 * 用于处理与Supabase后端的数据交互
 */

import { supabase, isSupabaseAvailable } from './supabaseClient.js';
import { supabaseConfig } from './supabaseConfig.js';

/**
 * 从Supabase获取所有电影列表
 * @returns {Promise<Array>} 电影列表
 */
async function getMovies() {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，返回空电影列表');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('获取电影列表失败:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('获取电影列表时发生异常:', error);
        return [];
    }
}

/**
 * 根据电影ID获取电影详情
 * @param {string} movieId 电影ID
 * @returns {Promise<Object|null>} 电影详情或null
 */
async function getMovieById(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法获取电影详情');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .select('*')
            .eq('id', movieId)
            .single();

        if (error) {
            console.error('获取电影详情失败:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('获取电影详情时发生异常:', error);
        return null;
    }
}

/**
 * 获取用户在指定电影中的学习进度
 * @param {string} movieId 电影ID
 * @returns {Promise<Object>} 学习进度数据
 */
async function getUserProgress(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，返回空学习进度');
        return {};
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.userProgress)
            .select('*')
            .eq('movie_id', movieId);

        if (error) {
            console.error('获取用户学习进度失败:', error);
            return {};
        }

        // 将数组转换为以单词为键的对象
        const progressData = {};
        if (data) {
            data.forEach(item => {
                progressData[item.word] = {
                    reviewCount: item.review_count,
                    nextReviewDate: item.next_review_date,
                    interval: item.interval,
                    easeFactor: item.ease_factor,
                    proficiency: item.proficiency
                };
            });
        }

        return progressData;
    } catch (error) {
        console.error('获取用户学习进度时发生异常:', error);
        return {};
    }
}

/**
 * 保存用户学习进度
 * @param {string} movieId 电影ID
 * @param {string} word 单词
 * @param {Object} progress 进度数据
 * @returns {Promise<boolean>} 保存是否成功
 */
async function saveUserProgress(movieId, word, progress) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法保存学习进度');
        return false;
    }

    try {
        // 准备数据
        const progressData = {
            movie_id: movieId,
            word: word,
            review_count: progress.reviewCount || 0,
            next_review_date: progress.nextReviewDate || null,
            interval: progress.interval || 0,
            ease_factor: progress.easeFactor || 2.5,
            proficiency: progress.proficiency || null
        };

        // 使用upsert操作，如果存在则更新，否则插入
        const { error } = await supabase
            .from(supabaseConfig.tables.userProgress)
            .upsert(progressData, {
                onConflict: ['movie_id', 'word']
            });

        if (error) {
            console.error('保存用户学习进度失败:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('保存用户学习进度时发生异常:', error);
        return false;
    }
}

/**
 * 保存用户单词熟练度
 * @param {string} movieId 电影ID
 * @param {string} word 单词
 * @param {string} proficiency 熟练度
 * @returns {Promise<boolean>} 保存是否成功
 */
async function saveWordProficiency(movieId, word, proficiency) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法保存单词熟练度');
        return false;
    }

    try {
        // 准备数据
        const proficiencyData = {
            movie_id: movieId,
            word: word,
            proficiency: proficiency
        };

        // 使用upsert操作，如果存在则更新，否则插入
        const { error } = await supabase
            .from(supabaseConfig.tables.userProgress)
            .upsert(proficiencyData, {
                onConflict: ['movie_id', 'word']
            });

        if (error) {
            console.error('保存单词熟练度失败:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('保存单词熟练度时发生异常:', error);
        return false;
    }
}

/**
 * 上传电影文件到Supabase Storage
 * @param {File} file 文件对象
 * @param {string} bucket 存储桶名称
 * @param {string} fileName 文件名
 * @returns {Promise<string|null>} 文件URL或null
 */
async function uploadFile(file, bucket, fileName) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法上传文件');
        return null;
    }

    try {
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('文件上传失败:', error);
            return null;
        }

        // 获取文件的公共URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('文件上传时发生异常:', error);
        return null;
    }
}

/**
 * 获取电影的学习统计数据
 * @param {string} movieId 电影ID
 * @returns {Promise<Object>} 学习统计数据
 */
async function getMovieStats(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，返回空学习统计数据');
        return { totalWords: 0, learnedWords: 0 };
    }

    try {
        // 获取该电影的所有学习进度记录
        const { data, error } = await supabase
            .from(supabaseConfig.tables.userProgress)
            .select('word, proficiency')
            .eq('movie_id', movieId);

        if (error) {
            console.error('获取电影学习统计数据失败:', error);
            return { totalWords: 0, learnedWords: 0 };
        }

        // 计算总单词数和已学习单词数
        const totalWords = data.length;
        const learnedWords = data.filter(item => item.proficiency).length;

        return { totalWords, learnedWords };
    } catch (error) {
        console.error('获取电影学习统计数据时发生异常:', error);
        return { totalWords: 0, learnedWords: 0 };
    }
}

/**
 * 创建新电影记录
 * @param {Object} movieData 电影数据
 * @returns {Promise<Object|null>} 创建的电影记录或null
 */
async function createMovie(movieData) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法创建电影记录');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .insert([movieData])
            .select()
            .single();

        if (error) {
            console.error('创建电影记录失败:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('创建电影记录时发生异常:', error);
        return null;
    }
}

// 导出所有函数
export {
    getMovies,
    getMovieById,
    getUserProgress,
    saveUserProgress,
    saveWordProficiency,
    uploadFile,
    getMovieStats,
    createMovie
};