// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化电影列表
    renderMovieList();
    
    // 初始化显示首页
    setState({ currentView: 'home' });
    
    // 绑定按钮事件
    elements.forgotBtn.addEventListener('click', () => handleFeedback('Hard'));
    elements.reviewBtn.addEventListener('click', () => handleFeedback('Good'));
    elements.knownBtn.addEventListener('click', () => handleFeedback('Easy'));
});

// 渲染电影列表
function renderMovieList() {
    elements.movieListContainer.innerHTML = ''; // 清空现有内容
    
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/200x250?text=No+Image'">
            <div class="movie-title">${movie.title}</div>
        `;
        
        movieCard.addEventListener('click', () => {
            // 加载电影数据并切换到学习视图
            loadMovieData(movie);
        });
        
        elements.movieListContainer.appendChild(movieCard);
    });
}

// 改造：异步加载电影数据
async function loadMovieData(movie) {
    setState({ 
        currentView: 'study', 
        currentMovie: movie, 
        currentWordDetails: null,
        allWords: [],
        sentences: [],
        progressData: {}
    });

    // 异步加载，不阻塞UI
    fetch(movie.srtPath)
        .then(response => response.text())
        .then(srtContent => {
            const sentences = parseSRT(srtContent);
            const words = extractWords(sentences);
            
            // 从LocalStorage加载学习进度
            const savedProgress = localStorage.getItem(`linguasubs_${movie.id}`);
            const progressData = savedProgress ? JSON.parse(savedProgress) : {};

            setState({ 
                allWords: words, 
                sentences: sentences,
                progressData: progressData
            });
            
            // 数据准备好后，开始显示第一个单词
            showNextWord(); 
            
            // 预取接下来的单词
            prefetchWords(words, progressData);
        })
        .catch(error => {
            console.error('加载电影数据时出错:', error);
            // 显示错误信息
            setState({ 
                currentWordDetails: {
                    word: '加载失败',
                    phonetic: '',
                    meanings: [{ partOfSpeech: '错误', definitions: ['无法加载电影数据，请检查控制台了解详情。'] }]
                }
            });
        });
}

// 显示下一个单词
async function showNextWord() {
    // 使用SRS算法获取下一个单词
    const nextWord = getNextWord(appState.allWords, appState.progressData);
    
    if (!nextWord) {
        // 如果没有单词可学，显示完成消息
        setState({ 
            currentWord: null,
            currentWordDetails: {
                word: '恭喜！',
                phonetic: '',
                meanings: [{ partOfSpeech: '完成', definitions: ['您已经学习完所有单词。', '您可以选择其他电影继续学习。'] }]
            }
        });
        return;
    }
    
    // 显示加载状态
    setState({ 
        currentWord: nextWord,
        currentWordDetails: null
    });
    
    // 获取单词详细信息
    const wordDetails = await getWordDetails(nextWord);
    
    if (wordDetails) {
        // 更新状态以显示单词卡片
        setState({ 
            currentWord: nextWord,
            currentWordDetails: wordDetails
        });
    } else {
        // 如果API未找到单词，显示基本单词信息
        setState({ 
            currentWord: nextWord,
            currentWordDetails: {
                word: nextWord,
                phonetic: '',
                meanings: [{ partOfSpeech: '信息', definitions: ['未找到该单词的详细信息。', '这可能是一个专有名词或拼写错误。'] }]
            }
        });
    }
}

// 处理用户反馈
function handleFeedback(feedback) {
    const currentWord = appState.currentWord;
    
    if (currentWord && currentWord !== '加载中...' && currentWord !== '恭喜！' && currentWord !== '加载失败') {
        // 更新单词的学习进度
        const wordStats = appState.progressData[currentWord] || null;
        appState.progressData[currentWord] = calculateNextReview(wordStats, feedback);
        
        // 保存到LocalStorage
        if (appState.currentMovie) {
            localStorage.setItem(`linguasubs_${appState.currentMovie.id}`, JSON.stringify(appState.progressData));
        }
        
        // 显示下一个单词
        showNextWord();
        
        // 预取接下来的单词
        prefetchWords(appState.allWords, appState.progressData);
    }
}

// 实现 API 预取 (Pre-fetching) 提升流畅度
function prefetchWords(words, progress) {
    const wordsToPrefetch = [];
    // 找到接下来 5 个最可能学习的单词
    let tempProgress = JSON.parse(JSON.stringify(progress)); // 深拷贝进度，避免影响主逻辑
    for (let i = 0; i < 5; i++) {
        const nextWord = getNextWord(words, tempProgress);
        if (nextWord) {
            wordsToPrefetch.push(nextWord);
            // 标记为已"预习"，避免重复选择
            tempProgress[nextWord] = { reviewCount: 1, nextReviewDate: new Date() }; 
        } else {
            break;
        }
    }

    // 对需要预取的单词，如果缓存中没有，则发起API请求
    wordsToPrefetch.forEach(word => {
        if (!appState.wordDetailsCache[word]) {
            getWordDetails(word).then(details => {
                if (details) {
                    console.log(`预取成功: ${word}`);
                }
            });
        }
    });
}