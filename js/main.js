// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取视图元素
    const homeView = document.getElementById('home-view');
    const studyView = document.getElementById('study-view');
    const wordCard = document.getElementById('word-card');
    const wordElement = document.getElementById('word');
    const phoneticElement = document.getElementById('phonetic');
    const pronunciationBtn = document.getElementById('pronunciation-btn');
    const definitionElement = document.getElementById('definition');
    const exampleSentenceElement = document.getElementById('example-sentence');
    const forgotBtn = document.getElementById('forgot-btn');
    const reviewBtn = document.getElementById('review-btn');
    const knownBtn = document.getElementById('known-btn');
    
    // 当前电影数据
    let currentMovie = null;
    let currentWords = [];
    let currentWordIndex = 0;
    let progressData = {};
    
    // 显示指定视图的函数
    function showView(viewId) {
        // 隐藏所有视图
        homeView.classList.add('hidden');
        studyView.classList.add('hidden');
        
        // 显示指定视图
        if (viewId === 'home-view') {
            homeView.classList.remove('hidden');
        } else if (viewId === 'study-view') {
            studyView.classList.remove('hidden');
        }
    }
    
    // 渲染电影列表
    function renderMovieList() {
        const movieListContainer = document.getElementById('movie-list');
        movieListContainer.innerHTML = ''; // 清空现有内容
        
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
            
            movieListContainer.appendChild(movieCard);
        });
    }
    
    // 加载电影数据
    async function loadMovieData(movie) {
        currentMovie = movie;
        
        try {
            // 从LocalStorage加载学习进度
            const savedProgress = localStorage.getItem(`linguasubs_${movie.id}`);
            progressData = savedProgress ? JSON.parse(savedProgress) : {};
            
            // 获取SRT文件内容
            const response = await fetch(movie.srtPath);
            if (!response.ok) {
                throw new Error(`无法加载字幕文件: ${movie.srtPath}`);
            }
            
            const srtContent = await response.text();
            
            // 解析SRT文件
            const sentences = parseSRT(srtContent);
            
            // 提取核心词汇
            currentWords = extractWords(sentences);
            
            console.log('提取的单词数量:', currentWords.length);
            console.log('提取的单词:', currentWords.slice(0, 10)); // 只显示前10个单词
            
            // 显示学习视图
            showView('study-view');
            
            // 显示第一个单词
            showNextWord();
        } catch (error) {
            console.error('加载电影数据时出错:', error);
            alert('加载电影数据时出错，请检查控制台了解详情。');
        }
    }
    
    // 显示下一个单词
    async function showNextWord() {
        // 使用SRS算法获取下一个单词
        const nextWord = getNextWord(currentWords, progressData);
        
        if (!nextWord) {
            // 如果没有单词可学，显示完成消息
            wordElement.textContent = '恭喜！';
            phoneticElement.textContent = '';
            definitionElement.innerHTML = '<p>您已经学习完所有单词。</p>';
            exampleSentenceElement.innerHTML = '<p>您可以选择其他电影继续学习。</p>';
            pronunciationBtn.style.display = 'none';
            document.querySelector('.feedback-buttons').style.display = 'none';
            return;
        }
        
        // 显示加载状态
        wordElement.textContent = '加载中...';
        phoneticElement.textContent = '';
        definitionElement.innerHTML = '';
        exampleSentenceElement.innerHTML = '';
        pronunciationBtn.style.display = 'none';
        document.querySelector('.feedback-buttons').style.display = 'flex';
        
        // 获取单词详细信息
        const wordDetails = await getWordDetails(nextWord);
        
        if (wordDetails) {
            // 渲染单词卡片
            renderWordCard(wordDetails);
        } else {
            // 如果API未找到单词，显示基本单词信息
            wordElement.textContent = nextWord;
            phoneticElement.textContent = '';
            definitionElement.innerHTML = '<p>未找到该单词的详细信息。</p>';
            exampleSentenceElement.innerHTML = '<p>这可能是一个专有名词或拼写错误。</p>';
            pronunciationBtn.style.display = 'none';
        }
    }
    
    // 渲染单词卡片
    function renderWordCard(wordData) {
        wordElement.textContent = wordData.word;
        phoneticElement.textContent = wordData.phonetic || '';
        
        // 显示发音按钮（如果有音频）
        if (wordData.audio) {
            pronunciationBtn.style.display = 'inline-block';
            pronunciationBtn.onclick = () => {
                const audio = new Audio(wordData.audio);
                audio.play();
            };
        } else {
            pronunciationBtn.style.display = 'none';
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
        definitionElement.innerHTML = definitionHTML;
        
        // 显示例句（这里使用一个简单的示例）
        exampleSentenceElement.innerHTML = `<p>Example sentence for <strong>${wordData.word}</strong> will be shown here.</p>`;
    }
    
    // 处理用户反馈
    function handleFeedback(feedback) {
        const currentWord = wordElement.textContent;
        
        if (currentWord && currentWord !== '加载中...' && currentWord !== '恭喜！') {
            // 更新单词的学习进度
            const wordStats = progressData[currentWord] || null;
            progressData[currentWord] = calculateNextReview(wordStats, feedback);
            
            // 保存到LocalStorage
            if (currentMovie) {
                localStorage.setItem(`linguasubs_${currentMovie.id}`, JSON.stringify(progressData));
            }
            
            // 显示下一个单词
            showNextWord();
        }
    }
    
    // 绑定按钮事件
    forgotBtn.addEventListener('click', () => handleFeedback('Hard'));
    reviewBtn.addEventListener('click', () => handleFeedback('Good'));
    knownBtn.addEventListener('click', () => handleFeedback('Easy'));
    
    // 初始化电影列表
    renderMovieList();
    
    // 初始化显示首页
    showView('home-view');
});