const appState = {
    currentView: 'home', // 'home', 'study'
    currentMovie: null, // { id, title, ... }
    allWords: [],
    sentences: [],
    wordDetailsCache: {}, // 用于缓存API结果
    currentWord: null, // 当前正在学习的单词
    currentWordDetails: null, // 当前单词的详细信息
    progressData: {} // 学习进度数据
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
    movieListContainer: document.getElementById('movie-list')
};

function updateUI() {
    // 根据 appState.currentView 控制视图显示/隐藏
    elements.homeView.classList.toggle('hidden', appState.currentView !== 'home');
    elements.studyView.classList.toggle('hidden', appState.currentView !== 'study');

    if (appState.currentView === 'study' && appState.currentWordDetails) {
        // 所有渲染卡片的逻辑都集中在这里
        const wordData = appState.currentWordDetails;
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
    } else if (appState.currentView === 'study' && !appState.currentWordDetails) {
        // 显示单词加载中的状态
        elements.wordElement.textContent = '加载中...';
        elements.phoneticElement.textContent = '';
        elements.definitionElement.innerHTML = '';
        elements.exampleSentenceElement.innerHTML = '';
        elements.pronunciationBtn.style.display = 'none';
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