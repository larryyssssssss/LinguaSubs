/**
 * 解析SRT字幕文件
 * @param {string} srtContent - SRT文件内容
 * @returns {Array<string>} 包含所有字幕文本的数组
 */
function parseSRT(srtContent) {
    // 按空行分割块
    const blocks = srtContent.trim().split(/\n\s*\n/);
    
    const sentences = [];
    
    // 处理每个块
    blocks.forEach(block => {
        // 按行分割
        const lines = block.split('\n');
        
        // 至少需要3行（序号、时间、文本）
        if (lines.length >= 3) {
            // 合并所有文本行（从第3行开始）
            let text = '';
            for (let i = 2; i < lines.length; i++) {
                text += lines[i] + ' ';
            }
            
            // 清理文本
            text = text.trim();
            
            // 移除HTML标签
            text = text.replace(/<[^>]*>/g, '');
            
            // 移除音效标记（括号内的内容）
            text = text.replace(/\([^)]*\)/g, '');
            
            // 移除音乐标记
            text = text.replace(/\[.*?\]/g, '');
            
            // 如果清理后还有内容，添加到句子数组
            if (text) {
                sentences.push(text);
            }
        }
    });
    
    return sentences;
}

/**
 * 从句子中提取核心单词
 * @param {Array<string>} sentences - 句子数组
 * @returns {Array<string>} 核心单词数组
 */
function extractWords(sentences) {
    // 将所有句子合并为一个字符串
    const allText = sentences.join(' ');
    
    // 提取所有英文单词
    const words = allText.match(/[a-zA-Z]+/g) || [];
    
    // 转换为小写
    const lowerWords = words.map(word => word.toLowerCase());
    
    // 定义停用词集合（常见的无意义词汇）
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 
        'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 
        'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
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