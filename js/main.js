// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化电影列表
    renderMovieList();
    
    // 初始化个人媒体库
    renderUserLibrary();
    
    // 初始化显示首页
    setState({ currentView: 'home' });
    
    // 绑定按钮事件
    if (elements.forgotBtn) elements.forgotBtn.addEventListener('click', () => handleFeedback('Hard'));
    if (elements.reviewBtn) elements.reviewBtn.addEventListener('click', () => handleFeedback('Good'));
    if (elements.knownBtn) elements.knownBtn.addEventListener('click', () => handleFeedback('Easy'));
    
    // 绑定模式切换按钮事件
    if (elements.browseModeBtn) elements.browseModeBtn.addEventListener('click', () => toggleStudyMode('browse'));
    if (elements.reviewModeBtn) elements.reviewModeBtn.addEventListener('click', () => toggleStudyMode('review'));
    
    // 绑定设置面板事件
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => toggleSettings(true));
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', () => toggleSettings(false));
    if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('click', saveSettings);
    if (elements.resetSettingsBtn) elements.resetSettingsBtn.addEventListener('click', resetSettings);
    
    // 绑定导出事件
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWordList);
    }
    
    // 绑定返回按钮事件
    const backBtn = document.getElementById('back-to-word-list');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // 在移动端隐藏单词详情面板，显示单词列表面板
            const wordListPanel = document.querySelector('.word-list-panel');
            const wordDetailPanel = document.querySelector('.word-detail-panel');
            
            if (wordListPanel && wordDetailPanel) {
                wordListPanel.classList.remove('mobile-hidden');
                wordDetailPanel.classList.add('mobile-hidden');
            }
        });
    }
    
    // 绑定上传事件
    const uploadInput = document.getElementById('subtitle-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', handleSubtitleUpload);
    }
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 绑定帮助按钮事件
    const helpBtn = document.getElementById('help-btn');
    const closeHelpBtn = document.getElementById('close-shortcut-help');
    const shortcutHelp = document.getElementById('shortcut-help');
    
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            if (shortcutHelp) shortcutHelp.classList.remove('hidden');
        });
    }
    
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            if (shortcutHelp) shortcutHelp.classList.add('hidden');
        });
    }
    
    // 点击遮罩层关闭帮助面板
    if (shortcutHelp) {
        shortcutHelp.addEventListener('click', (e) => {
            if (e.target === shortcutHelp) {
                shortcutHelp.classList.add('hidden');
            }
        });
    }
});

// 导出单词列表功能
function exportWordList() {
    // 检查是否有数据可导出
    if (!appState.currentMovie || !appState.allWords || appState.allWords.length === 0) {
        alert('当前没有可导出的单词数据');
        return;
    }
    
    // 创建CSV内容
    let csvContent = '单词,熟练度,词频,下次复习时间\n';
    
    // 获取熟练度标签
    const proficiencyLabels = appState.settings?.proficiencyLabels || {
        beginner: '生词',
        intermediate: '学习中',
        advanced: '已掌握'
    };
    
    // 添加每个单词的数据
    appState.allWords.forEach(word => {
        const frequency = appState.wordFrequency[word] || 1;
        const proficiency = appState.wordProficiency[word] || 'unknown';
        const progress = appState.progressData[word];
        
        // 转换熟练度值为标签
        let proficiencyLabel = '未标记';
        if (proficiency === 'beginner') proficiencyLabel = proficiencyLabels.beginner;
        else if (proficiency === 'intermediate') proficiencyLabel = proficiencyLabels.intermediate;
        else if (proficiency === 'advanced') proficiencyLabel = proficiencyLabels.advanced;
        
        // 获取下次复习时间
        let nextReviewDate = '';
        if (progress && progress.nextReviewDate) {
            nextReviewDate = new Date(progress.nextReviewDate).toLocaleDateString('zh-CN');
        }
        
        // 转义包含逗号或引号的字段
        const escapeCSVField = (field) => {
            if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        };
        
        csvContent += `${escapeCSVField(word)},${escapeCSVField(proficiencyLabel)},${frequency},${escapeCSVField(nextReviewDate)}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${appState.currentMovie.title}_词汇表_${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 处理字幕文件上传
function handleSubtitleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const uploadStatus = document.getElementById('upload-status');
    if (!uploadStatus) return;
    
    // 检查文件类型
    if (!file.name.endsWith('.srt')) {
        uploadStatus.textContent = '请上传SRT格式的字幕文件';
        uploadStatus.style.color = '#e74c3c';
        return;
    }
    
    uploadStatus.textContent = '正在处理字幕文件...';
    uploadStatus.style.color = '#f39c12';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const srtContent = e.target.result;
            const sentences = parseSRT(srtContent);
            const words = extractWords(sentences);
            const wordFrequency = calculateWordFrequency(sentences);
            
            // 创建用户媒体项
            const userMedia = {
                id: 'user_' + Date.now(),
                title: file.name.replace('.srt', ''),
                srtContent: srtContent,
                sentences: sentences,
                words: words,
                wordFrequency: wordFrequency,
                uploadDate: new Date().toISOString(),
                progressData: {},
                wordProficiency: {}
            };
            
            // 保存到LocalStorage
            localStorage.setItem(`linguasubs_user_${userMedia.id}`, JSON.stringify(userMedia));
            
            // 更新UI
            uploadStatus.textContent = '字幕文件处理完成！';
            uploadStatus.style.color = '#2ecc71';
            
            // 清空文件输入
            event.target.value = '';
            
            // 重新渲染用户媒体库
            renderUserLibrary();
            
            // 自动进入学习模式
            loadUserMediaData(userMedia);
        } catch (error) {
            console.error('处理字幕文件时出错:', error);
            uploadStatus.textContent = '处理字幕文件时出错，请检查文件格式';
            uploadStatus.style.color = '#e74c3c';
        }
    };
    
    reader.readAsText(file);
}

// 处理键盘快捷键
function handleKeyboardShortcuts(event) {
    // 只在学习视图中生效
    if (appState.currentView !== 'study') return;
    
    // 阻止在输入框中触发快捷键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key) {
        case '1':
        case 'ArrowLeft':
            // 忘记了
            if (elements.forgotBtn) elements.forgotBtn.click();
            break;
        case '2':
        case ' ':
            // 需巩固（空格键）
            event.preventDefault(); // 防止空格键滚动页面
            if (elements.reviewBtn) elements.reviewBtn.click();
            break;
        case '3':
        case 'ArrowRight':
            // 我认识
            if (elements.knownBtn) elements.knownBtn.click();
            break;
        case 'b':
        case 'B':
            // 切换到浏览模式
            if (elements.browseModeBtn) elements.browseModeBtn.click();
            break;
        case 'r':
        case 'R':
            // 切换到复习模式
            if (elements.reviewModeBtn) elements.reviewModeBtn.click();
            break;
        case 's':
        case 'S':
            // 打开设置
            if (elements.settingsBtn) elements.settingsBtn.click();
            break;
        case 'e':
        case 'E':
            // 导出
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) exportBtn.click();
            break;
    }
}

// 渲染用户媒体库
function renderUserLibrary() {
    const userLibraryContainer = document.getElementById('user-library');
    if (!userLibraryContainer) return;
    
    // 清空现有内容
    userLibraryContainer.innerHTML = '';
    
    // 获取所有用户媒体项
    const userMediaItems = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('linguasubs_user_')) {
            try {
                const mediaData = JSON.parse(localStorage.getItem(key));
                userMediaItems.push(mediaData);
            } catch (e) {
                console.error('解析用户媒体数据时出错:', e);
            }
        }
    }
    
    // 按上传日期排序（最新的在前）
    userMediaItems.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    if (userMediaItems.length === 0) {
        userLibraryContainer.innerHTML = '<div style="color: rgba(255, 255, 255, 0.7); text-align: center; padding: 20px;">暂无上传的媒体文件</div>';
        return;
    }
    
    userMediaItems.forEach(media => {
        const libraryItem = document.createElement('div');
        libraryItem.className = 'library-item';
        
        // 计算统计数据
        const totalWords = media.words ? media.words.length : 0;
        const learnedWords = media.wordProficiency ? Object.keys(media.wordProficiency).length : 0;
        const reviewWords = media.progressData ? Object.keys(media.progressData).length : 0;
        
        libraryItem.innerHTML = `
            <div class="library-item-info">
                <div class="library-item-title">${media.title}</div>
                <div class="library-item-stats">
                    <div class="library-item-stat">📚 词汇: ${totalWords}</div>
                    <div class="library-item-stat">✅ 已学: ${learnedWords}</div>
                    <div class="library-item-stat">🔁 复习: ${reviewWords}</div>
                </div>
            </div>
            <div class="library-item-actions">
                <button class="library-item-btn" data-id="${media.id}">学习</button>
                <button class="library-item-btn delete" data-id="${media.id}">删除</button>
            </div>
        `;
        
        userLibraryContainer.appendChild(libraryItem);
    });
    
    // 绑定学习和删除按钮事件
    document.querySelectorAll('.library-item-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const mediaId = this.getAttribute('data-id');
            if (this.classList.contains('delete')) {
                deleteUserMedia(mediaId);
            } else {
                loadUserMediaForStudy(mediaId);
            }
        });
    });
}

// 删除用户媒体项
function deleteUserMedia(mediaId) {
    if (confirm('确定要删除这个媒体文件吗？此操作不可撤销。')) {
        localStorage.removeItem(`linguasubs_user_${mediaId}`);
        renderUserLibrary();
    }
}

// 加载用户媒体进行学习
function loadUserMediaForStudy(mediaId) {
    const mediaData = JSON.parse(localStorage.getItem(`linguasubs_user_${mediaId}`));
    if (mediaData) {
        loadUserMediaData(mediaData);
    }
}

// 加载用户媒体数据
function loadUserMediaData(media) {
    showLoadingIndicator();
    
    setState({ 
        currentView: 'study', 
        currentMovie: {
            id: media.id,
            title: media.title,
            isUserMedia: true
        }, 
        currentWordDetails: null,
        allWords: media.words || [],
        sentences: media.sentences || [],
        progressData: media.progressData || {},
        wordFrequency: media.wordFrequency || {},
        wordProficiency: media.wordProficiency || {},
        studyMode: 'browse'
    });

    // 默认选择第一个单词
    if (media.words && media.words.length > 0) {
        selectWord(media.words[0]);
    }
    
    // 预取接下来的单词
    if (media.words) {
        prefetchWords(media.words, media.progressData || {});
    }
    
    // 隐藏加载指示器
    hideLoadingIndicator();
}

// 渲染电影列表
function renderMovieList() {
    if (!elements.movieListContainer) return;
    
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
    showLoadingIndicator();
    
    setState({ 
        currentView: 'study', 
        currentMovie: movie, 
        currentWordDetails: null,
        allWords: [],
        sentences: [],
        progressData: {},
        wordFrequency: {},
        wordProficiency: {},
        studyMode: 'browse'
    });

    // 异步加载，不阻塞UI
    fetch(movie.srtPath)
        .then(response => response.text())
        .then(srtContent => {
            const sentences = parseSRT(srtContent);
            const words = extractWords(sentences);
            
            // 计算单词频率
            const wordFrequency = calculateWordFrequency(sentences);
            
            // 从LocalStorage加载学习进度和熟练度数据
            const savedData = localStorage.getItem(`linguasubs_${movie.id}`);
            const movieData = savedData ? JSON.parse(savedData) : {};
            const progressData = movieData.progressData || {};
            const wordProficiency = movieData.wordProficiency || {};

            setState({ 
                allWords: words, 
                sentences: sentences,
                progressData: progressData,
                wordFrequency: wordFrequency,
                wordProficiency: wordProficiency
            });
            
            // 默认选择第一个单词
            if (words.length > 0) {
                selectWord(words[0]);
            }
            
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
        })
        .finally(() => {
            hideLoadingIndicator();
        });
}

// 计算单词频率
function calculateWordFrequency(sentences) {
    const frequency = {};
    
    sentences.forEach(sentence => {
        // 提取所有英文单词
        const words = sentence.match(/[a-zA-Z]+/g) || [];
        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            frequency[lowerWord] = (frequency[lowerWord] || 0) + 1;
        });
    });
    
    return frequency;
}

// 选择单词（从stateManager导入）
function selectWord(word) {
    // 更新当前单词
    setState({ 
        currentWord: word,
        currentWordDetails: null
    });
    
    // 获取单词详细信息
    getWordDetails(word).then(wordDetails => {
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
    });
}

// 显示下一个单词（用于SRS学习模式）
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
            if (appState.currentMovie.isUserMedia) {
                // 保存用户上传的媒体数据
                const userMediaKey = `linguasubs_user_${appState.currentMovie.id}`;
                const userData = JSON.parse(localStorage.getItem(userMediaKey)) || {};
                userData.progressData = appState.progressData;
                userData.wordProficiency = appState.wordProficiency;
                localStorage.setItem(userMediaKey, JSON.stringify(userData));
            } else {
                // 保存示例电影数据
                const savedData = localStorage.getItem(`linguasubs_${appState.currentMovie.id}`);
                const movieData = savedData ? JSON.parse(savedData) : {};
                movieData.progressData = appState.progressData;
                localStorage.setItem(`linguasubs_${appState.currentMovie.id}`, JSON.stringify(movieData));
            }
        }
        
        // 显示下一个单词
        showNextWord();
        
        // 预取接下来的单词
        prefetchWords(appState.allWords, appState.progressData);
    }
}

// 显示加载指示器
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast ${type}`;
    messageElement.textContent = message;
    
    // 添加样式
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '15px 20px';
    messageElement.style.borderRadius = '8px';
    messageElement.style.color = 'white';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    messageElement.style.zIndex = '3000';
    messageElement.style.maxWidth = '300px';
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            messageElement.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
            break;
        case 'error':
            messageElement.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            break;
        case 'warning':
            messageElement.style.background = 'linear-gradient(135deg, #f39c12, #d35400)';
            break;
        default:
            messageElement.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    }
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
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