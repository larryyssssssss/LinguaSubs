const appState = {
    currentView: 'home', // 'home', 'study'
    currentMovie: null, // { id, title, ... }
    allWords: [],
    sentences: [],
    wordDetailsCache: {}, // 用于缓存API结果
    currentWord: null, // 当前正在学习的单词
    currentWordDetails: null, // 当前单词的详细信息
    progressData: {}, // 学习进度数据
    wordFrequency: {} // 单词频率统计
};

const elements = {
    homeView: document.getElementById('home-view'),
    studyView: document.getElementById('study-view'),
    wordElement: document.getElementById('word'),
    phoneticElement: document.getElementById('phonetic'),
    pronunciationBtn: document.getElementById('pronunciation-btn'),
    definitionElement: document.getElementById('definition'),
    exampleSentenceElement: document.getElementById('example-sentence'),
    forgotBtn: document.getElementById('forgot-btn'),
    reviewBtn: document.getElementById('review-btn'),
    knownBtn: document.getElementById('known-btn'),
    movieListContainer: document.getElementById('movie-list'),
    wordListContainer: document.getElementById('word-list-container')
};

function updateUI() {
    // 根据 appState.currentView 控制视图显示/隐藏
    elements.homeView.classList.toggle('hidden', appState.currentView !== 'home');
    elements.studyView.classList.toggle('hidden', appState.currentView !== 'study');

    if (appState.currentView === 'study') {
        // 渲染单词列表
        renderWordList();
        
        // 渲染单词详情
        if (appState.currentWordDetails) {
            renderWordDetails();
        } else if (appState.currentWord) {
            // 显示单词加载中的状态
            elements.wordElement.textContent = '加载中...';
            elements.phoneticElement.textContent = '';
            elements.definitionElement.innerHTML = '';
            elements.exampleSentenceElement.innerHTML = '';
            elements.pronunciationBtn.style.display = 'none';
        }
    }
}

// 渲染单词列表
function renderWordList() {
    if (!elements.wordListContainer) return;
    
    elements.wordListContainer.innerHTML = '';
    
    // 按频率排序单词
    const sortedWords = [...appState.allWords].sort((a, b) => {
        const freqA = appState.wordFrequency[a] || 0;
        const freqB = appState.wordFrequency[b] || 0;
        return freqB - freqA;
    });
    
    sortedWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        if (word === appState.currentWord) {
            wordItem.classList.add('active');
        }
        
        const frequency = appState.wordFrequency[word] || 1;
        
        wordItem.innerHTML = `
            <span class="word-text">${word}</span>
            <span class="word-frequency">${frequency}</span>
        `;
        
        wordItem.addEventListener('click', () => {
            selectWord(word);
        });
        
        elements.wordListContainer.appendChild(wordItem);
    });
}

// 渲染单词详情
function renderWordDetails() {
    const wordData = appState.currentWordDetails;
    if (!wordData) return;
    
    elements.wordElement.textContent = wordData.word;
    elements.phoneticElement.textContent = wordData.phonetic || '';
    
    // 显示发音按钮（如果有音频）
    if (wordData.audio) {
        elements.pronunciationBtn.style.display = 'inline-block';
        elements.pronunciationBtn.onclick = () => {
            const audio = new Audio(wordData.audio);
            audio.play();
        };
    } else {
        elements.pronunciationBtn.style.display = 'none';
    }
    
    // 渲染词性和释义
    let definitionHTML = '';
    if (wordData.meanings && wordData.meanings.length > 0) {
        wordData.meanings.forEach(meaning => {
            definitionHTML += `<p><strong>${meaning.partOfSpeech || '释义'}</strong>: ${meaning.definitions.join('; ')}</p>`;
        });
    } else {
        definitionHTML = '<p>暂无释义信息。</p>';
    }
    elements.definitionElement.innerHTML = definitionHTML;
    
    // 查找并高亮例句
    const example = findExampleSentence(wordData.word, appState.sentences);
    elements.exampleSentenceElement.innerHTML = example 
        ? example.replace(new RegExp(`\\b${wordData.word}\\b`, 'ig'), `<strong>${wordData.word}</strong>`)
        : `未在影片中找到包含"${wordData.word}"的清晰例句。`;
}

// 选择单词
async function selectWord(word) {
    // 更新当前单词
    setState({ 
        currentWord: word,
        currentWordDetails: null
    });
    
    // 获取单词详细信息
    const wordDetails = await getWordDetails(word);
    
    if (wordDetails) {
        setState({ 
            currentWordDetails: wordDetails
        });
    } else {
        setState({ 
            currentWordDetails: {
                word: word,
                phonetic: '',
                meanings: [{ partOfSpeech: '信息', definitions: ['未找到该单词的详细信息。', '这可能是一个专有名词或拼写错误。'] }]
            }
        });
    }
}

// 新增：查找例句的函数
function findExampleSentence(word, sentences) {
    // 优先找较长的、完整的句子
    const longSentences = sentences.filter(s => s.length > 20);
    for (const sentence of longSentences) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(sentence)) {
            return sentence;
        }
    }
    // 如果没有，再从所有句子中找
    for (const sentence of sentences) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(sentence)) {
            return sentence;
        }
    }
    return null;
}

function setState(newState) {
    Object.assign(appState, newState);
    updateUI();
}