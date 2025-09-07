/**
 * 从词典API获取单词详细信息
 * @param {string} word - 要查询的单词
 * @returns {Promise<Object|null>} - 包含单词信息的对象或null（如果未找到）
 */
async function getWordDetails(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`未找到单词: ${word}`);
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
            
            return wordData;
        }
        
        return null;
    } catch (error) {
        console.error(`获取单词"${word}"信息时出错:`, error);
        return null;
    }
}