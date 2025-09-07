/**
 * 计算下一个复习时间
 * @param {Object} wordStats - 单词当前状态
 * @param {string} feedback - 用户反馈 ('Hard', 'Good', 'Easy')
 * @returns {Object} - 更新后的单词状态
 */
function calculateNextReview(wordStats, feedback) {
    // 如果是新词，初始化状态
    if (!wordStats) {
        wordStats = {
            reviewCount: 0,
            nextReviewDate: null,
            interval: 0,
            easeFactor: 2.5
        };
    }
    
    // 增加复习次数
    wordStats.reviewCount += 1;
    
    // 根据用户反馈调整复习间隔
    switch (feedback) {
        case 'Hard': // 忘记了
            // 紧急复习，在5-10分钟内再次出现
            const minutes = Math.floor(Math.random() * 6) + 5;
            wordStats.nextReviewDate = new Date(Date.now() + minutes * 60000);
            wordStats.interval = 0; // 重置间隔
            wordStats.easeFactor = Math.max(1.3, wordStats.easeFactor - 0.2); // 降低容易系数
            break;
            
        case 'Good': // 需巩固
            // 1天后复习
            if (wordStats.interval === 0) {
                wordStats.interval = 1;
            } else {
                wordStats.interval = Math.round(wordStats.interval * wordStats.easeFactor);
            }
            wordStats.nextReviewDate = new Date(Date.now() + wordStats.interval * 86400000);
            break;
            
        case 'Easy': // 我认识
            // 指数级增长间隔
            if (wordStats.interval === 0) {
                wordStats.interval = 1; // 第一次认识，1天后复习
            } else {
                wordStats.interval = Math.round(wordStats.interval * wordStats.easeFactor);
                // 逐渐增加easeFactor，但不超过3.0
                wordStats.easeFactor = Math.min(wordStats.easeFactor + 0.1, 3.0);
            }
            wordStats.nextReviewDate = new Date(Date.now() + wordStats.interval * 86400000);
            break;
    }
    
    return wordStats;
}

/**
 * 获取下一个要学习的单词
 * @param {Array<string>} allWords - 所有单词列表
 * @param {Object} progressData - 学习进度数据
 * @returns {string|null} - 下一个单词或null（如果没有单词）
 */
function getNextWord(allWords, progressData) {
    const now = new Date();
    
    // 1. 查找紧急复习的单词（5-10分钟内需要复习的）
    for (const [word, stats] of Object.entries(progressData)) {
        if (stats.nextReviewDate && stats.interval === 0 && new Date(stats.nextReviewDate) <= now) {
            return word;
        }
    }
    
    // 2. 查找已到期的复习单词
    const dueWords = [];
    for (const [word, stats] of Object.entries(progressData)) {
        if (stats.nextReviewDate && stats.interval > 0 && new Date(stats.nextReviewDate) <= now) {
            dueWords.push({ word, interval: stats.interval });
        }
    }
    
    // 按间隔时间排序，优先复习间隔较短的单词
    if (dueWords.length > 0) {
        dueWords.sort((a, b) => a.interval - b.interval);
        return dueWords[0].word;
    }
    
    // 3. 查找新单词（按一定随机性）
    const studiedWords = new Set(Object.keys(progressData));
    const newWords = allWords.filter(word => !studiedWords.has(word));
    
    // 如果有新单词，随机返回一个
    if (newWords.length > 0) {
        // 可以根据词频或其他规则选择新单词，这里简单随机选择
        const randomIndex = Math.floor(Math.random() * newWords.length);
        return newWords[randomIndex];
    }
    
    // 4. 如果没有新单词，返回已到期的单词（按随机顺序）
    if (dueWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * dueWords.length);
        return dueWords[randomIndex].word;
    }
    
    // 5. 如果都没有，返回null
    return null;
}