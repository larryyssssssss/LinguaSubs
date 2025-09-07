/**
 * 解析SRT字幕文件内容
 * @param {string} srtContent - SRT文件内容
 * @returns {Array<string>} - 纯净对话句子数组
 */
function parseSRT(srtContent) {
    // 移除所有HTML标签
    const cleanContent = srtContent.replace(/<[^>]*>/g, '');
    
    // 按双换行符分割块
    const blocks = cleanContent.split(/\n\s*\n/);
    
    const sentences = [];
    
    blocks.forEach(block => {
        // 移除时间戳和序号行
        const lines = block.split('\n').filter(line => {
            // 过滤掉空行、序号行和时间戳行
            return line.trim() !== '' && 
                   !/^\d+$/.test(line.trim()) && 
                   !/^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/.test(line.trim());
        });
        
        // 将剩余行合并为句子
        if (lines.length > 0) {
            const sentence = lines.join(' ').trim();
            if (sentence) {
                sentences.push(sentence);
            }
        }
    });
    
    return sentences;
}

/**
 * 从句子中提取核心词汇
 * @param {Array<string>} sentences - 句子数组
 * @returns {Array<string>} - 核心词汇数组
 */
function extractWords(sentences) {
    // 合并所有句子为一个字符串
    const allText = sentences.join(' ');
    
    // 使用正则表达式提取所有英文单词
    const words = allText.match(/[a-zA-Z]+/g) || [];
    
    // 转为小写
    const lowerWords = words.map(word => word.toLowerCase());
    
    // 定义停用词列表
    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
        'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
        'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 
        'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'into', 
        'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 
        'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 
        'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 
        'now', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 
        'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 
        'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 
        'yourselves', 'themselves',
        // 额外的常见停用词
        'am', 'get', 'got', 'let', 'go', 'went', 'come', 'came', 'see', 'saw',
        'take', 'took', 'make', 'made', 'know', 'knew', 'think', 'thought',
        'say', 'said', 'tell', 'told', 'ask', 'asked', 'give', 'gave', 'find',
        'found', 'put', 'leave', 'left', 'feel', 'felt', 'seem', 'seemed',
        'try', 'tried', 'turn', 'turned', 'start', 'started', 'begin', 'began',
        'stop', 'stopped', 'keep', 'kept', 'hold', 'held', 'bring', 'brought',
        'happen', 'happened', 'become', 'became', 'show', 'showed', 'hear',
        'heard', 'play', 'played', 'run', 'ran', 'move', 'moved', 'live', 'lived',
        'believe', 'believed', 'hurt', 'call', 'called', 'work', 'worked'
    ]);
    
    // 去重并过滤停用词和长度小于3的单词
    const uniqueWords = [...new Set(lowerWords)];
    const coreWords = uniqueWords.filter(word => 
        word.length >= 3 && !stopWords.has(word)
    );
    
    return coreWords;
}

// 导出函数
export { parseSRT, extractWords };