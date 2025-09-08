/**
 * 数据服务层
 * 用于处理与Supabase后端的数据交互
 */

import { supabase, isSupabaseAvailable } from './supabaseClient.js';
import { supabaseConfig } from './supabaseConfig.js';
import { parseSRT } from './utils.js';

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
        // 处理文件名，确保不包含中文字符
        const sanitizedFileName = sanitizeFileName(fileName);
        
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(sanitizedFileName, file, {
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
            .getPublicUrl(sanitizedFileName);

        return publicUrl;
    } catch (error) {
        console.error('文件上传时发生异常:', error);
        return null;
    }
}

/**
 * 处理文件名，移除或替换不支持的字符
 * @param {string} fileName 原始文件名
 * @returns {string} 处理后的文件名
 */
function sanitizeFileName(fileName) {
    // 移除或替换不支持的字符，包括中文字符
    return fileName
        .replace(/[^\x00-\x7F]/g, '') // 移除非ASCII字符（包括中文）
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 将其他特殊字符替换为下划线
        .replace(/_+/g, '_') // 将多个连续下划线替换为单个下划线
        .replace(/^_+|_+$/g, ''); // 移除开头和结尾的下划线
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
            .select('word, proficiency, review_count')
            .eq('movie_id', movieId);

        if (error) {
            console.error('获取电影学习统计数据失败:', error);
            return { totalWords: 0, learnedWords: 0 };
        }

        // 计算总单词数和已学习单词数
        const totalWords = data.length;
        
        // 已学习单词数：review_count大于0或者proficiency不为undefined的单词
        const learnedWords = data.filter(item => 
            (item.review_count && item.review_count > 0) || 
            (item.proficiency !== undefined)
        ).length;

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

/**
 * 删除电影记录
 * @param {string} movieId 电影ID
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteMovie(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法删除电影记录');
        return false;
    }

    try {
        const { error } = await supabase
            .from(supabaseConfig.tables.movies)
            .delete()
            .eq('id', movieId);

        if (error) {
            console.error('删除电影记录失败:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('删除电影记录时发生异常:', error);
        return false;
    }
}

/**
 * 获取用户上传的媒体列表
 * @returns {Promise<Array>} 用户媒体列表
 */
async function getUserMediaList() {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，返回空用户媒体列表');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .select('*')
            .not('user_id', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('获取用户媒体列表失败:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('获取用户媒体列表时发生异常:', error);
        return [];
    }
}

/**
 * 保存用户媒体数据
 * @param {Object} mediaData 媒体数据
 * @returns {Promise<Object|null>} 保存的媒体记录或null
 */
async function saveUserMedia(mediaData) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法保存用户媒体数据');
        return null;
    }

    try {
        // 获取当前用户ID
        const userId = localStorage.getItem('linguasubs_userId');
        if (!userId) {
            return null;
        }

        // 准备数据
        const mediaRecord = {
            ...mediaData,
            user_id: userId
        };

        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .upsert(mediaRecord)
            .select()
            .single();

        if (error) {
            console.error('保存用户媒体数据失败:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('保存用户媒体数据时发生异常:', error);
        return null;
    }
}

/**
 * 删除用户媒体
 * @param {string} mediaId 媒体ID
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteUserMedia(mediaId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法删除用户媒体');
        return false;
    }

    try {
        // 获取当前用户ID
        const userId = localStorage.getItem('linguasubs_userId');
        if (!userId) {
            return false;
        }

        const { error } = await supabase
            .from(supabaseConfig.tables.movies)
            .delete()
            .eq('id', mediaId)
            .eq('user_id', userId);

        if (error) {
            console.error('删除用户媒体失败:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('删除用户媒体时发生异常:', error);
        return false;
    }
}

/**
 * 根据电影ID获取词汇列表
 * @param {string} movieId 电影ID
 * @returns {Promise<Array>} 词汇列表
 */
async function getWordList(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法获取词汇列表');
        return [];
    }

    try {
        // 首先尝试从数据库获取已存储的词汇列表
        const { data: movieData, error: movieError } = await supabase
            .from(supabaseConfig.tables.movies)
            .select('word_list, srt_path')
            .eq('id', movieId)
            .single();

        if (movieError) {
            console.error('获取电影数据失败:', movieError);
            return [];
        }

        // 如果数据库中已存在词汇列表，直接返回
        if (movieData.word_list) {
            return movieData.word_list;
        }

        // 如果数据库中没有词汇列表，但从电影数据中可以获取到字幕路径
        if (movieData.srt_path) {
            // 从Storage下载字幕文件
            const response = await fetch(movieData.srt_path);
            if (!response.ok) {
                console.error('下载字幕文件失败:', response.status);
                return [];
            }

            const srtContent = await response.text();
            // 解析字幕文件生成词汇列表
            const newWordList = parseSRT(srtContent);
            
            // 将新生成的词汇列表存回数据库
            const { error: updateError } = await supabase
                .from(supabaseConfig.tables.movies)
                .update({ word_list: newWordList })
                .eq('id', movieId);

            if (updateError) {
                console.error('更新电影词汇列表失败:', updateError);
            }

            return newWordList;
        }

        // 如果既没有词汇列表也没有字幕路径，返回空数组
        return [];
    } catch (error) {
        console.error('获取词汇列表时发生异常:', error);
        return [];
    }
}

/**
 * 上传电影文件（包括SRT和海报）
 * @param {string} userId 用户ID
 * @param {string} title 电影标题
 * @param {File} srtFile SRT文件对象
 * @param {File} posterFile 海报文件对象
 * @returns {Promise<Object|null>} 上传结果或null
 */
async function uploadMovie(userId, title, srtFile, posterFile) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法上传电影');
        return null;
    }

    try {
        // 并行上传SRT文件和海报文件
        const [srtUrl, posterUrl] = await Promise.all([
            uploadFile(srtFile, supabaseConfig.buckets.subtitles, `${userId}_${Date.now()}_${srtFile.name}`),
            uploadFile(posterFile, supabaseConfig.buckets.posters, `${userId}_${Date.now()}_${posterFile.name}`)
        ]);

        if (!srtUrl || !posterUrl) {
            console.error('文件上传失败');
            return null;
        }

        // 准备电影数据
        const movieData = {
            title: title,
            srt_path: srtUrl,
            poster_url: posterUrl,
            user_id: userId,
            created_at: new Date().toISOString()
        };

        // 插入电影数据到数据库
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .insert([movieData])
            .select()
            .single();

        if (error) {
            console.error('插入电影数据失败:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('上传电影时发生异常:', error);
        return null;
    }
}

/**
 * 更新用户电影信息
 * @param {string} movieId 电影ID
 * @param {Object} updates 更新数据
 * @returns {Promise<Object|null>} 更新后的电影数据或null
 */
async function updateUserMovie(movieId, updates) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法更新电影信息');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from(supabaseConfig.tables.movies)
            .update(updates)
            .eq('id', movieId)
            .select()
            .single();

        if (error) {
            console.error('更新电影信息失败:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('更新电影信息时发生异常:', error);
        return null;
    }
}

/**
 * 删除用户电影
 * @param {string} movieId 电影ID
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteUserMovie(movieId) {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase不可用，无法删除电影');
        return false;
    }

    try {
        const { error } = await supabase
            .from(supabaseConfig.tables.movies)
            .delete()
            .eq('id', movieId);

        if (error) {
            console.error('删除电影失败:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('删除电影时发生异常:', error);
        return false;
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
    createMovie,
    getUserMediaList,
    deleteMovie,
    getWordList,
    uploadMovie,
    updateUserMovie,
    deleteUserMovie
};