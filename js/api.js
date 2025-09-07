/**
 * LRU缓存类
 */
class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (item) {
            // 将访问的项目移到最后（最近使用）
            this.cache.delete(key);
            this.cache.set(key, item);
            return item;
        }
        return null;
    }
    
    set(key, value) {
        // 如果已存在，先删除
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 如果缓存已满，删除最久未使用的项目（第一个项目）
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        // 添加新项目到末尾
        this.cache.set(key, value);
    }
    
    has(key) {
        return this.cache.has(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
}

// 创建全局单词详情缓存实例
const wordDetailsCache = new LRUCache(200);

/**
 * 从词典API获取单词详细信息
 * @param {string} word - 要查询的单词
 * @returns {Promise<Object|null>} - 包含单词信息的对象或null（如果未找到）
 */
async function getWordDetails(word) {
    // 检查缓存中是否已存在该单词的详细信息
    const cachedData = wordDetailsCache.get(word);
    if (cachedData) {
        console.log(`从缓存中获取单词: ${word}`);
        return cachedData;
    }
    
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`未找到单词: ${word}`);
                // 缓存未找到的结果，避免重复请求
                wordDetailsCache.set(word, null);
                return null;
            }
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 解析API响应数据
        if (data && data.length > 0) {
            const entry = data[0];
            const wordData = {
                word: entry.word,
                phonetic: '',
                audio: '',
                meanings: []
            };
            
            // 获取音标
            if (entry.phonetic) {
                wordData.phonetic = entry.phonetic;
            } else if (entry.phonetics && entry.phonetics.length > 0) {
                // 查找第一个有音标的条目
                const phoneticEntry = entry.phonetics.find(p => p.text);
                if (phoneticEntry) {
                    wordData.phonetic = phoneticEntry.text;
                }
                
                // 查找第一个有音频的条目
                const audioEntry = entry.phonetics.find(p => p.audio);
                if (audioEntry) {
                    wordData.audio = audioEntry.audio;
                }
            }
            
            // 获取词性和释义
            if (entry.meanings) {
                wordData.meanings = entry.meanings.map(meaning => ({
                    partOfSpeech: meaning.partOfSpeech || 'unknown',
                    definitions: meaning.definitions ? meaning.definitions.slice(0, 3).map(def => def.definition) : ['暂无释义']
                }));
            }
            
            // 将结果存入缓存
            wordDetailsCache.set(word, wordData);
            
            return wordData;
        }
        
        // 缓存空结果
        wordDetailsCache.set(word, null);
        return null;
    } catch (error) {
        console.error(`获取单词"${word}"信息时出错:`, error);
        // 不缓存错误结果，允许重试
        return null;
    }
}

/**
 * 预取单词详情
 * @param {Array<string>} words - 要预取的单词列表
 * @param {number} maxConcurrent - 最大并发请求数
 */
async function prefetchWordDetails(words, maxConcurrent = 3) {
    // 过滤掉已缓存的单词
    const wordsToFetch = words.filter(word => !wordDetailsCache.has(word));
    
    if (wordsToFetch.length === 0) {
        console.log('所有单词都已在缓存中，无需预取');
        return;
    }
    
    console.log(`开始预取 ${wordsToFetch.length} 个单词`);
    
    // 分批处理，避免同时发起过多请求
    const batches = [];
    for (let i = 0; i < wordsToFetch.length; i += maxConcurrent) {
        batches.push(wordsToFetch.slice(i, i + maxConcurrent));
    }
    
    // 逐批发起请求
    for (const batch of batches) {
        const promises = batch.map(word => 
            getWordDetails(word).then(details => {
                if (details) {
                    console.log(`预取成功: ${word}`);
                } else {
                    console.log(`预取失败或未找到: ${word}`);
                }
                return details;
            }).catch(error => {
                console.error(`预取单词"${word}"时出错:`, error);
                return null;
            })
        );
        
        // 等待当前批次完成
        await Promise.all(promises);
    }
    
    console.log(`预取完成，缓存大小: ${wordDetailsCache.size()}`);
}

// 导出函数
export { getWordDetails, prefetchWordDetails, wordDetailsCache };