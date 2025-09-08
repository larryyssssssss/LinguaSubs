/**
 * LRU缓存类
 */
class LRUCache {
    /**
     * 创建LRU缓存实例
     * @param {number} maxSize - 缓存最大大小
     */
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    /**
     * 获取缓存项
     * @param {string} key - 缓存键
     * @returns {*} 缓存值或null
     */
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
    
    /**
     * 设置缓存项
     * @param {string} key - 缓存键
     * @param {*} value - 缓存值
     */
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
    
    /**
     * 检查缓存是否包含指定键
     * @param {string} key - 缓存键
     * @returns {boolean} 是否包含
     */
    has(key) {
        return this.cache.has(key);
    }
    
    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
    }
    
    /**
     * 获取缓存大小
     * @returns {number} 缓存大小
     */
    size() {
        return this.cache.size;
    }
    
    /**
     * 删除特定缓存项
     * @param {string} key - 缓存键
     * @returns {boolean} 是否删除成功
     */
    delete(key) {
        return this.cache.delete(key);
    }
}

// 创建全局单词详情缓存实例
const wordDetailsCache = new LRUCache(200);

/**
 * 从词典API获取单词详细信息（包含中文翻译）
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
        // 首先尝试从主要词典API获取基本信息
        let wordData = await fetchFromPrimaryDictionary(word);
        
        // 如果主要API没有找到，尝试备用API
        if (!wordData) {
            wordData = await fetchFromBackupDictionary(word);
        }
        
        // 如果仍然没有找到，创建基本的单词信息
        if (!wordData) {
            wordData = {
                word: word,
                phonetic: '',
                audio: '',
                meanings: [{
                    partOfSpeech: 'unknown',
                    definitions: [`单词"${word}"的详细信息暂未找到。`]
                }]
            };
        }
        
        // 尝试获取中文翻译
        try {
            const translationResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh`);
            if (translationResponse.ok) {
                const translationData = await translationResponse.json();
                if (translationData && translationData.responseData && translationData.responseData.translatedText) {
                    // 将中文翻译添加到第一个释义中
                    if (wordData.meanings.length > 0) {
                        wordData.meanings[0].chineseTranslation = translationData.responseData.translatedText;
                    }
                }
            }
        } catch (translationError) {
            console.warn(`获取单词"${word}"的中文翻译时出错:`, translationError);
            // 不影响主功能，继续使用英文释义
        }
        
        // 将结果存入缓存
        wordDetailsCache.set(word, wordData);
        
        return wordData;
    } catch (error) {
        console.error(`获取单词"${word}"信息时出错:`, error);
        // 返回基本单词信息而不是null
        const wordData = {
            word: word,
            phonetic: '',
            audio: '',
            meanings: [{
                partOfSpeech: 'error',
                definitions: [`查询单词"${word}"时发生错误: ${error.message}`]
            }]
        };
        
        // 将结果存入缓存
        wordDetailsCache.set(word, wordData);
        
        return wordData;
    }
}

/**
 * 从主要词典API获取单词信息
 * @param {string} word - 要查询的单词
 * @returns {Promise<Object|null>} - 包含单词信息的对象或null
 */
async function fetchFromPrimaryDictionary(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`主要词典API未找到单词: ${word}`);
                return null;
            }
            throw new Error(`主要词典API请求失败: ${response.status}`);
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
            
            return wordData;
        }
        
        return null;
    } catch (error) {
        console.error(`从主要词典API获取单词"${word}"时出错:`, error);
        return null;
    }
}

/**
 * 从备用词典API获取单词信息
 * @param {string} word - 要查询的单词
 * @returns {Promise<Object|null>} - 包含单词信息的对象或null
 */
async function fetchFromBackupDictionary(word) {
    try {
        // 使用备用API - Merriam-Webster Collegiate Dictionary API
        // 注意：这需要API密钥，这里只是一个示例
        // const response = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=YOUR_API_KEY`);
        
        // 作为示例，我们创建一个简单的备用响应
        console.log(`尝试从备用词典获取单词: ${word}`);
        
        // 返回一个基本的单词信息结构
        return {
            word: word,
            phonetic: '',
            audio: '',
            meanings: [{
                partOfSpeech: 'unknown',
                definitions: [`单词"${word}"在主要词典中未找到，这是备用信息。`]
            }]
        };
    } catch (error) {
        console.error(`从备用词典API获取单词"${word}"时出错:`, error);
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

/**
 * 清除单词详情缓存
 * @param {string} word - 要清除的单词，如果不提供则清除所有缓存
 */
function clearWordDetailsCache(word) {
    if (word) {
        wordDetailsCache.delete(word);
        console.log(`已清除单词"${word}"的缓存`);
    } else {
        wordDetailsCache.clear();
        console.log('已清除所有单词详情缓存');
    }
}

// 导出函数
export { getWordDetails, prefetchWordDetails, wordDetailsCache, clearWordDetailsCache };