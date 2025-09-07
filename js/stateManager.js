const appState = {
    currentView: 'home', // 'home', 'study'
    currentMovie: null, // { id, title, ... }
    allWords: [],
    sentences: [],
    wordDetailsCache: {}, // 用于缓存API结果
    currentWord: null, // 当前正在学习的单词
    currentWordDetails: null, // 当前单词的详细信息
    progressData: {}, // 学习进度数据
    wordFrequency: {}, // 单词频率统计
    wordProficiency: {}, // 单词熟练度标记 { word: 'beginner' | 'intermediate' | 'advanced' }
    studyMode: 'browse' // 'browse' | 'review'
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
    wordListContainer: document.getElementById('word-list-container'),
    browseModeBtn: document.getElementById('browse-mode-btn'),
    reviewModeBtn: document.getElementById('review-mode-btn'),
    movieTitle: document.getElementById('movie-title')
};

function updateUI() {
    // 根据 appState.currentView 控制视图显示/隐藏
    elements.homeView.classList.toggle('hidden', appState.currentView !== 'home');
    elements.studyView.classList.toggle('hidden', appState.currentView !== 'study');

    if (appState.currentView === 'study') {
        // 更新电影标题
        if (elements.movieTitle && appState.currentMovie) {
            elements.movieTitle.textContent = appState.currentMovie.title;
        }
        
        // 更新模式按钮状态
        if (elements.browseModeBtn && elements.reviewModeBtn) {
            elements.browseModeBtn.classList.toggle('active', appState.studyMode === 'browse');
            elements.reviewModeBtn.classList.toggle('active', appState.studyMode === 'review');
        }
        
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
    
    if (appState.studyMode === 'browse') {
        // 浏览模式：显示所有单词
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
            const proficiency = appState.wordProficiency[word] || 'unknown';
            
            wordItem.innerHTML = `
                <div class="word-info">
                    <span class="word-text">${word}</span>
                    <span class="word-frequency">${frequency}</span>
                </div>
                <div class="proficiency-container">
                    <select class="proficiency-select" data-word="${word}">
                        <option value="unknown" ${proficiency === 'unknown' ? 'selected' : ''}>未标记</option>
                        <option value="beginner" ${proficiency === 'beginner' ? 'selected' : ''}>生词</option>
                        <option value="intermediate" ${proficiency === 'intermediate' ? 'selected' : ''}>学习中</option>
                        <option value="advanced" ${proficiency === 'advanced' ? 'selected' : ''}>已掌握</option>
                    </select>
                </div>
            `;
            
            wordItem.addEventListener('click', (e) => {
                // 如果点击的是下拉框，不触发选择单词
                if (e.target.classList.contains('proficiency-select')) {
                    return;
                }
                selectWord(word);
            });
            
            // 添加熟练度选择事件
            const selectElement = wordItem.querySelector('.proficiency-select');
            selectElement.addEventListener('change', (e) => {
                setWordProficiency(word, e.target.value);
            });
            
            elements.wordListContainer.appendChild(wordItem);
        });
    } else {
        // 复习模式：只显示需要复习的单词
        const reviewWords = getReviewWords();
        
        if (reviewWords.length === 0) {
            const noReviewItem = document.createElement('div');
            noReviewItem.className = 'word-item';
            noReviewItem.innerHTML = '<div class="word-info"><span class="word-text">暂无需要复习的单词</span></div>';
            elements.wordListContainer.appendChild(noReviewItem);
        } else {
            reviewWords.forEach(wordObj => {
                const wordItem = document.createElement('div');
                wordItem.className = 'word-item';
                if (wordObj.word === appState.currentWord) {
                    wordItem.classList.add('active');
                }
                
                const frequency = appState.wordFrequency[wordObj.word] || 1;
                const proficiency = appState.wordProficiency[wordObj.word] || 'unknown';
                const isDue = wordObj.isDue ? '（到期）' : '（紧急）';
                
                wordItem.innerHTML = `
                    <div class="word-info">
                        <span class="word-text">${wordObj.word}</span>
                        <span class="word-frequency">${frequency}${isDue}</span>
                    </div>
                    <div class="proficiency-container">
                        <select class="proficiency-select" data-word="${wordObj.word}">
                            <option value="unknown" ${proficiency === 'unknown' ? 'selected' : ''}>未标记</option>
                            <option value="beginner" ${proficiency === 'beginner' ? 'selected' : ''}>生词</option>
                            <option value="intermediate" ${proficiency === 'intermediate' ? 'selected' : ''}>学习中</option>
                            <option value="advanced" ${proficiency === 'advanced' ? 'selected' : ''}>已掌握</option>
                        </select>
                    </div>
                `;
                
                wordItem.addEventListener('click', (e) => {
                    // 如果点击的是下拉框，不触发选择单词
                    if (e.target.classList.contains('proficiency-select')) {
                        return;
                    }
                    selectWord(wordObj.word);
                });
                
                // 添加熟练度选择事件
                const selectElement = wordItem.querySelector('.proficiency-select');
                selectElement.addEventListener('change', (e) => {
                    setWordProficiency(wordObj.word, e.target.value);
                });
                
                elements.wordListContainer.appendChild(wordItem);
            });
        }
    }
}

// 获取需要复习的单词
function getReviewWords() {
    const now = new Date();
    const reviewWords = [];
    
    // 查找紧急复习的单词（5-10分钟内需要复习的）
    for (const [word, stats] of Object.entries(appState.progressData)) {
        if (stats.nextReviewDate && stats.interval === 0 && new Date(stats.nextReviewDate) <= now) {
            reviewWords.push({ word, isDue: false });
        }
    }
    
    // 查找已到期的复习单词
    for (const [word, stats] of Object.entries(appState.progressData)) {
        if (stats.nextReviewDate && stats.interval > 0 && new Date(stats.nextReviewDate) <= now) {
            reviewWords.push({ word, isDue: true });
        }
    }
    
    return reviewWords;
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

// 设置单词熟练度
function setWordProficiency(word, proficiency) {
    appState.wordProficiency[word] = proficiency;
    
    // 保存到LocalStorage
    if (appState.currentMovie) {
        const savedData = localStorage.getItem(`linguasubs_${appState.currentMovie.id}`);
        const movieData = savedData ? JSON.parse(savedData) : {};
        movieData.wordProficiency = appState.wordProficiency;
        localStorage.setItem(`linguasubs_${appState.currentMovie.id}`, JSON.stringify(movieData));
    }
    
    // 更新UI
    updateUI();
}

// 切换学习模式
function toggleStudyMode(mode) {
    setState({ studyMode: mode });
    
    // 如果切换到复习模式，自动选择第一个需要复习的单词
    if (mode === 'review') {
        const reviewWords = getReviewWords();
        if (reviewWords.length > 0) {
            selectWord(reviewWords[0].word);
        }
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