/**
 * SRS (Spaced Repetition System) 算法实现
 * 基于Anki的SM-2算法
 */

/**
 * 计算下一个复习时间
 * @param {Object} wordStats - 单词的学习统计数据
 * @param {string} feedback - 用户反馈 ('Hard', 'Good', 'Easy')
 * @returns {Object} 更新后的学习统计数据
 */
function calculateNextReview(wordStats, feedback) {
    // 初始化单词统计数据
    let {
        reviewCount = 0,
        easeFactor = 2.5,
        interval = 0,
        nextReviewDate = new Date(),
        proficiency = null
    } = wordStats;
    
    // 增加复习次数
    reviewCount++;
    
    // 根据用户反馈调整难度因子
    switch (feedback) {
        case 'Hard': // 困难
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 0.5));
            break;
        case 'Good': // 一般
            interval = interval === 0 ? 1 : Math.round(interval * easeFactor);
            break;
        case 'Easy': // 简单
            easeFactor += 0.15;
            interval = interval === 0 ? 1 : Math.round(interval * easeFactor * 1.3);
            break;
        default:
            // 默认情况，按一般处理
            interval = interval === 0 ? 1 : Math.round(interval * easeFactor);
    }
    
    // 确保间隔至少为1天
    interval = Math.max(1, interval);
    
    // 计算下次复习日期
    const now = new Date();
    nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
    
    // 根据复习次数和反馈更新熟练度
    if (reviewCount >= 3 && feedback === 'Easy') {
        proficiency = 'advanced';
    } else if (reviewCount >= 2 && (feedback === 'Good' || feedback === 'Easy')) {
        proficiency = 'intermediate';
    } else {
        proficiency = 'beginner';
    }
    
    return {
        reviewCount,
        easeFactor,
        interval,
        nextReviewDate,
        proficiency
    };
}

/**
 * 获取下一个要学习的单词
 * @param {Array<string>} words - 所有单词列表
 * @param {Object} progressData - 学习进度数据
 * @returns {string|null} 下一个单词或null
 */
function getNextWord(words, progressData) {
    // 过滤出需要复习的单词（今天或之前需要复习的单词）
    const wordsToReview = words.filter(word => {
        const stats = progressData[word];
        if (!stats || !stats.nextReviewDate) return true; // 未学习过的单词需要学习
        return new Date(stats.nextReviewDate) <= new Date(); // 到了复习时间的单词需要复习
    });
    
    // 如果有待复习的单词，优先选择
    if (wordsToReview.length > 0) {
        // 选择间隔最短的单词（最急需复习的）
        wordsToReview.sort((a, b) => {
            const intervalA = progressData[a]?.interval || 0;
            const intervalB = progressData[b]?.interval || 0;
            return intervalA - intervalB;
        });
        return wordsToReview[0];
    }
    
    // 如果没有需要复习的单词，选择一个新单词
    // 选择学习次数最少的单词
    const wordsToLearn = words.filter(word => !progressData[word]);
    if (wordsToLearn.length > 0) {
        return wordsToLearn[0];
    }
    
    // 如果所有单词都已学习，选择最早需要复习的单词
    const sortedWords = [...words].sort((a, b) => {
        const dateA = progressData[a]?.nextReviewDate || new Date(0);
        const dateB = progressData[b]?.nextReviewDate || new Date(0);
        return new Date(dateA) - new Date(dateB);
    });
    
    return sortedWords[0] || null;
}

// 导出函数
export { calculateNextReview, getNextWord };