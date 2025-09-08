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

// 语音加载状态
let voices = [];
let voicesLoaded = false;

// 加载语音
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        // 如果语音包还没加载好，等待加载完成
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            voicesLoaded = true;
        };
    } else {
        voicesLoaded = true;
    }
}

// 初始化时加载语音
if (typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices();
}

/**
 * 发音单词
 * @param {string} word - 要发音的单词
 */
function speakWord(word) {
    // 检查浏览器是否支持SpeechSynthesis API
    if (!window.speechSynthesis) {
        console.warn("浏览器不支持语音合成API");
        return;
    }
    
    // 检查语音是否已加载
    if (!voicesLoaded) {
        console.warn("语音引擎尚未加载完成，正在尝试重新加载...");
        loadVoices(); // 尝试再次加载
        
        // 可以给用户一个 "语音引擎加载中..." 的提示
        // 这里可以根据需要添加UI提示
        
        // 等待一段时间后重试
        setTimeout(() => {
            if (voicesLoaded) {
                speakWord(word); // 重试
            } else {
                console.warn("语音引擎加载超时");
            }
        }, 1000);
        
        return;
    }
    
    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(word);
    
    // 查找英语语音
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
        utterance.voice = englishVoice;
    }
    
    // 设置语音参数
    utterance.rate = 1; // 语速
    utterance.pitch = 1; // 音调
    utterance.volume = 1; // 音量
    
    // 播放语音
    window.speechSynthesis.speak(utterance);
}

// 导出函数
export { parseSRT, extractWords, speakWord };