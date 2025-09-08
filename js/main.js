// 在文件顶部添加导入语句
import { getMovies, getMovieById, getUserProgress, saveUserProgress, saveWordProficiency, getMovieStats, uploadFile, createMovie, deleteMovie } from './dataService.js';
import { initRouter, navigateTo } from './router.js';
import { prefetchWordDetails, getWordDetails, wordDetailsCache } from './api.js';
import { showGlobalLoading, hideGlobalLoading } from './loadingManager.js';
import { setState, elements, initializeElements, toggleStudyMode, toggleSettings, saveSettings, resetSettings, selectWord, setWordProficiency, renderWordList, renderWordDetails, appState } from './stateManager.js'; // 导入appState
import { movies } from './data.js'; // 导入本地电影数据
import { calculateNextReview, getNextWord } from './srs.js';
import { parseSRT, extractWords } from './utils.js';

// 用户ID管理
let userId = null;

// 生成或获取用户ID
function getUserId() {
    if (userId) return userId;
    
    // 尝试从localStorage获取现有的用户ID
    userId = localStorage.getItem('linguasubs_userId');
    
    // 如果没有现有的用户ID，则生成一个新的
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem('linguasubs_userId', userId);
    }
    
    return userId;
}

// 生成用户ID（基于时间戳和随机数）
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示用户ID
function displayUserId() {
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        userIdDisplay.textContent = `用户ID: ${getUserId().substring(0, 12)}...`;
        // 添加复制功能
        userIdDisplay.style.cursor = 'pointer';
        userIdDisplay.title = '点击复制用户ID';
        userIdDisplay.addEventListener('click', () => {
            navigator.clipboard.writeText(getUserId()).then(() => {
                // 显示复制成功的提示
                const originalText = userIdDisplay.textContent;
                userIdDisplay.textContent = '已复制!';
                setTimeout(() => {
                    userIdDisplay.textContent = originalText;
                }, 2000);
            });
        });
    }
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户ID
    getUserId();
    displayUserId();
    
    // 初始化元素引用
    initializeElements();
    
    // 将本地电影数据添加到window对象中，确保其他地方可以访问
    window.movies = movies;
    
    // 初始化路由
    initRouter();
    // 初始化电影列表
    renderMovieList();
    
    // 初始化个人媒体库
    renderUserLibrary();
    
    // 初始化显示首页
    setState({ currentView: 'home' });
    
    // 绑定按钮事件
    if (elements.forgotBtn) elements.forgotBtn.addEventListener('click', handleForgot);
    if (elements.reviewBtn) elements.reviewBtn.addEventListener('click', handleReview);
    if (elements.knownBtn) elements.knownBtn.addEventListener('click', handleKnown);
    
    // 为按钮添加键盘支持
    if (elements.forgotBtn) elements.forgotBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.reviewBtn) elements.reviewBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.knownBtn) elements.knownBtn.addEventListener('keydown', handleButtonKeyDown);
    
    // 绑定模式切换按钮事件
    if (elements.browseModeBtn) elements.browseModeBtn.addEventListener('click', () => toggleStudyMode('browse'));
    if (elements.reviewModeBtn) elements.reviewModeBtn.addEventListener('click', () => toggleStudyMode('review'));
    
    // 为模式切换按钮添加键盘支持
    if (elements.browseModeBtn) elements.browseModeBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.reviewModeBtn) elements.reviewModeBtn.addEventListener('keydown', handleButtonKeyDown);
    
    // 绑定设置面板事件
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => toggleSettings(true));
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', () => toggleSettings(false));
    if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('click', saveSettings);
    if (elements.resetSettingsBtn) elements.resetSettingsBtn.addEventListener('click', resetSettings);
    
    // 添加清除缓存按钮事件
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            // 导入清除缓存函数
            import('./api.js').then(({ clearWordDetailsCache }) => {
                clearWordDetailsCache();
                showMessage('缓存已清除', 'success');
            }).catch(error => {
                console.error('清除缓存时出错:', error);
                showMessage('清除缓存失败', 'error');
            });
        });
        clearCacheBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    // 为设置面板按钮添加键盘支持
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('keydown', handleButtonKeyDown);
    if (elements.resetSettingsBtn) elements.resetSettingsBtn.addEventListener('keydown', handleButtonKeyDown);
    
    // 绑定导出事件
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWordList);
        exportBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    // 绑定返回首页按钮事件
    const backToHomeBtn = document.getElementById('back-to-home');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            // 导航到首页
            navigateTo('/');
        });
        backToHomeBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    // 绑定上传事件
    const uploadInput = document.getElementById('subtitle-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', handleSubtitleUpload);
    }
    
    // 绑定上传模态框事件
    const openUploadModalBtn = document.getElementById('open-upload-modal');
    const closeUploadModalBtn = document.getElementById('close-upload-modal');
    const cancelUploadBtn = document.getElementById('cancel-upload');
    const submitUploadBtn = document.getElementById('submit-upload');
    const uploadModal = document.getElementById('upload-modal');
    
    if (openUploadModalBtn) {
        openUploadModalBtn.addEventListener('click', () => {
            if (uploadModal) uploadModal.classList.remove('hidden');
        });
        openUploadModalBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    if (closeUploadModalBtn) {
        closeUploadModalBtn.addEventListener('click', () => {
            if (uploadModal) uploadModal.classList.add('hidden');
        });
        closeUploadModalBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            if (uploadModal) uploadModal.classList.add('hidden');
        });
        cancelUploadBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    if (submitUploadBtn) {
        submitUploadBtn.addEventListener('click', handleUploadSubmit);
        submitUploadBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    // 点击遮罩层关闭模态框
    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) {
                uploadModal.classList.add('hidden');
            }
        });
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
        helpBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            if (shortcutHelp) shortcutHelp.classList.add('hidden');
        });
        closeHelpBtn.addEventListener('keydown', handleButtonKeyDown);
    }
    
    // 点击遮罩层关闭帮助面板
    if (shortcutHelp) {
        shortcutHelp.addEventListener('click', (e) => {
            if (e.target === shortcutHelp) {
                shortcutHelp.classList.add('hidden');
            }
        });
    }
    
    // 确保所有可交互元素都有足够的触控目标大小
    ensureTouchTargets();
});

// 处理按钮键盘事件
function handleButtonKeyDown(event) {
    // 空格键和回车键触发点击
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.target.click();
    }
}

// 确保触控目标大小
function ensureTouchTargets() {
    // 为所有按钮和链接添加最小尺寸
    const buttons = document.querySelectorAll('button, a[role="button"]');
    buttons.forEach(button => {
        // 确保按钮至少有44x44px的触控目标
        const computedStyle = window.getComputedStyle(button);
        const width = parseFloat(computedStyle.width) || button.offsetWidth;
        const height = parseFloat(computedStyle.height) || button.offsetHeight;
        
        if (width < 44) {
            button.style.minWidth = '44px';
        }
        
        if (height < 44) {
            button.style.minHeight = '44px';
        }
    });
}

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
    
    // 显示全局加载指示器
    showGlobalLoading('正在处理字幕文件...');
    
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
            
            // 保存到Supabase
            saveUserMedia(userMedia).then(success => {
                if (success) {
                    // 更新UI
                    uploadStatus.textContent = '字幕文件处理完成！';
                    uploadStatus.style.color = '#2ecc71';
                    
                    // 清空文件输入
                    event.target.value = '';
                    
                    // 重新渲染用户媒体库
                    renderUserLibrary();
                    
                    // 自动进入学习模式
                    loadUserMediaData(userMedia);
                } else {
                    uploadStatus.textContent = '保存字幕文件失败';
                    uploadStatus.style.color = '#e74c3c';
                }
                
                // 隐藏全局加载指示器
                hideGlobalLoading();
            }).catch(error => {
                console.error('保存字幕文件时出错:', error);
                uploadStatus.textContent = '保存字幕文件时出错';
                uploadStatus.style.color = '#e74c3c';
                
                // 隐藏全局加载指示器
                hideGlobalLoading();
            });
        } catch (error) {
            console.error('处理字幕文件时出错:', error);
            uploadStatus.textContent = '处理字幕文件时出错，请检查文件格式';
            uploadStatus.style.color = '#e74c3c';
            
            // 隐藏全局加载指示器
            hideGlobalLoading();
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
async function renderUserLibrary() {
    const userLibraryContainer = document.getElementById('user-library');
    if (!userLibraryContainer) return;
    
    // 清空现有内容
    userLibraryContainer.innerHTML = '';
    
    // 从Supabase获取用户媒体项
    let userMediaItems = [];
    try {
        userMediaItems = await getUserMediaList();
    } catch (error) {
        console.error('获取用户媒体列表时出错:', error);
    }
    
    // 按上传日期排序（最新的在前）
    userMediaItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 调整示例文件模块的位置
    const sampleSection = document.querySelector('.sample-section');
    const librarySection = document.querySelector('.library-section');
    
    if (userMediaItems.length === 0) {
        // 如果没有用户上传的文件，示例模块在最上面
        if (sampleSection && librarySection) {
            librarySection.parentNode.insertBefore(sampleSection, librarySection);
        }
    } else {
        // 如果有用户上传的文件，示例模块在中间
        if (sampleSection && librarySection) {
            librarySection.parentNode.insertBefore(sampleSection, librarySection.nextSibling);
        }
    }
    
    if (userMediaItems.length === 0) {
        userLibraryContainer.innerHTML = '<div style="color: rgba(255, 255, 255, 0.7); text-align: center; padding: 20px;">暂无上传的媒体文件</div>';
        return;
    }
    
    userMediaItems.forEach(media => {
        const libraryItem = document.createElement('div');
        libraryItem.className = 'library-item';
        
        // 计算统计数据
        const totalWords = media.words ? media.words.length : 0;
        // 从Supabase获取学习进度数据
        const learnedWords = media.wordProficiency ? Object.keys(media.wordProficiency).length : 0;
        const reviewWords = media.progressData ? Object.keys(media.progressData).length : 0;
        
        // 计算学习进度百分比
        const progressPercent = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
        
        // 创建进度条HTML
        const progressHtml = totalWords > 0 ? 
            `<div class="library-item-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="progress-text">${learnedWords} / ${totalWords} 词已学习</div>
            </div>` : '';
        
        libraryItem.innerHTML = `
            <div class="library-item-info">
                <div class="library-item-title">${media.title}</div>
                ${progressHtml}
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
                deleteUserMedia(mediaId).then(() => {
                    renderUserLibrary();
                }).catch(error => {
                    console.error('删除媒体文件时出错:', error);
                    alert('删除媒体文件时出错');
                });
            } else {
                loadUserMediaForStudy(mediaId);
            }
        });
    });
}

// 删除用户媒体项
function deleteUserMedia(mediaId) {
    return new Promise((resolve, reject) => {
        if (confirm('确定要删除这个媒体文件吗？此操作不可撤销。')) {
            // 从Supabase删除媒体项
            deleteMovie(mediaId).then(success => {
                if (success) {
                    resolve();
                } else {
                    reject(new Error('删除失败'));
                }
            }).catch(error => {
                reject(error);
            });
        } else {
            resolve(); // 用户取消删除
        }
    });
}

// 加载用户媒体进行学习
async function loadUserMediaForStudy(mediaId) {
    try {
        // 从Supabase获取媒体数据
        const mediaData = await getMovieById(mediaId);
        if (mediaData) {
            loadUserMediaData(mediaData);
        } else {
            alert('未找到指定的媒体文件');
        }
    } catch (error) {
        console.error('加载媒体文件时出错:', error);
        alert('加载媒体文件时出错');
    }
}

// 加载用户媒体数据
async function loadUserMediaData(media) {
    showGlobalLoading(`正在加载媒体 "${media.title}"...`);
    
    try {
        // 获取学习进度数据
        const progressData = await getUserProgress(media.id);
        
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
            progressData: progressData,
            wordFrequency: media.wordFrequency || {},
            wordProficiency: extractWordProficiencyFromProgress(progressData),
            studyMode: 'browse'
        });

        // 默认选择第一个单词
        if (media.words && media.words.length > 0) {
            selectWord(media.words[0]);
        }
        
        // 预取接下来的单词
        if (media.words) {
            prefetchWords(media.words, progressData);
        }
    } catch (error) {
        console.error('加载用户媒体数据时出错:', error);
        setState({ 
            currentWordDetails: {
                word: '加载失败',
                phonetic: '',
                meanings: [{ partOfSpeech: '错误', definitions: ['无法加载媒体数据，请检查控制台了解详情。', `错误信息: ${error.message}`] }]
            }
        });
    } finally {
        // 隐藏加载指示器
        hideGlobalLoading();
    }
}

// 渲染电影列表
async function renderMovieList() {
    if (!elements.movieListContainer) return;
    
    // 清空现有内容
    elements.movieListContainer.innerHTML = '';
    
    console.log('开始获取电影列表...');
    
    // 从Supabase获取电影列表
    let movies = [];
    try {
        movies = await getMovies();
        console.log('从Supabase获取到的电影列表:', movies);
    } catch (error) {
        console.warn('从Supabase获取电影列表失败:', error);
    }
    
    // 如果没有从Supabase获取到电影，则使用本地数据
    if (!movies || movies.length === 0) {
        console.log('使用本地电影数据');
        movies = window.movies || [];
    }
    
    console.log('最终使用的电影列表:', movies);
    
    // 确保至少有本地示例数据
    if (movies.length === 0 && typeof window.movies !== 'undefined') {
        movies.push(...window.movies);
    }
    
    // 如果仍然没有电影数据，添加一个示例
    if (movies.length === 0) {
        movies = [
            { 
                id: '11111111-1111-1111-1111-111111111111', // 使用UUID格式的ID
                title: '盗梦空间', 
                posterUrl: 'assets/Inception.2010.Bluray.1080p.DTS-HD.x264-Grym.png', 
                srtPath: 'data/Inception.2010.Bluray.1080p.DTS-HD.x264-Grym.srt' 
            }
        ];
    }
    
    // 渲染电影卡片
    for (const movie of movies) {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        // 获取电影的学习统计数据（仅对Supabase中的电影）
        let progressHtml = '';
        if (movie.id && !movie.id.startsWith('user_') && movie.id.includes('-')) { // 检查是否为UUID格式
            try {
                const stats = await getMovieStats(movie.id);
                // 创建进度条HTML
                progressHtml = stats.totalWords > 0 ? 
                    `<div class="movie-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(stats.learnedWords / stats.totalWords) * 100}%"></div>
                        </div>
                        <div class="progress-text">${stats.learnedWords} / ${stats.totalWords} 词已学习</div>
                    </div>` : '';
            } catch (error) {
                console.warn('获取电影统计数据失败:', error);
            }
        }
        
        // 确保posterUrl和srtPath正确
        const posterUrl = movie.cover_url || movie.poster_url || movie.posterUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM2NjYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        
        // 创建一个本地的占位符图片数据URL
        const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM2NjYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        
        movieCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" onerror="this.src='${placeholderImage}'">
            <div class="movie-title">${movie.title}</div>
            ${progressHtml}
        `;
        
        movieCard.addEventListener('click', () => {
            // 加载电影数据并切换到学习视图
            loadMovieData({
                ...movie,
                posterUrl: posterUrl,
                srtPath: movie.srtPath || movie.subtitle_url || movie.srt_path
            });
        });
        
        elements.movieListContainer.appendChild(movieCard);
    }
}

// 改造：异步加载电影数据
async function loadMovieData(movie) {
    showGlobalLoading(`正在加载电影 "${movie.title}"...`);
    
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

    try {
        // 异步加载，不阻塞UI
        // 确保使用正确的字段名获取字幕文件路径
        const srtPath = movie.srtPath || movie.subtitle_url || movie.srt_path;
        if (!srtPath) {
            throw new Error('未找到字幕文件路径');
        }
        
        const response = await fetch(srtPath);
        const srtContent = await response.text();
        
        const sentences = parseSRT(srtContent);
        const words = extractWords(sentences);
        
        // 计算单词频率
        const wordFrequency = calculateWordFrequency(sentences);
        
        // 从Supabase加载学习进度和熟练度数据
        const progressData = await getUserProgress(movie.id);

        setState({ 
            allWords: words, 
            sentences: sentences,
            progressData: progressData,
            wordFrequency: wordFrequency,
            wordProficiency: extractWordProficiencyFromProgress(progressData),
            studyMode: 'browse'
        });
        
        // 默认选择第一个单词
        if (words.length > 0) {
            selectWord(words[0]);
        }
        
        // 预取接下来的单词
        prefetchWords(words, progressData);
    } catch (error) {
        console.error('加载电影数据时出错:', error);
        // 显示错误信息
        setState({ 
            currentWordDetails: {
                word: '加载失败',
                phonetic: '',
                meanings: [{ partOfSpeech: '错误', definitions: ['无法加载电影数据，请检查控制台了解详情。', `错误信息: ${error.message}`] }]
            }
        });
    } finally {
        hideGlobalLoading();
    }
}

// 从进度数据中提取单词熟练度
function extractWordProficiencyFromProgress(progressData) {
    const wordProficiency = {};
    for (const [word, progress] of Object.entries(progressData)) {
        if (progress.proficiency) {
            wordProficiency[word] = progress.proficiency;
        }
    }
    return wordProficiency;
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
    
    // 检查单词是否已在缓存中
    const cachedWordDetails = wordDetailsCache.get(nextWord);
    
    if (cachedWordDetails) {
        // 如果单词详情已在缓存中，直接显示，无需加载状态
        setState({ 
            currentWord: nextWord,
            currentWordDetails: cachedWordDetails
        });
    } else {
        // 如果单词详情不在缓存中，先显示加载状态
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
}

// 处理用户反馈
function handleFeedback(feedback) {
    const currentWord = appState.currentWord;
    
    if (currentWord && currentWord !== '加载中...' && currentWord !== '恭喜！' && currentWord !== '加载失败') {
        // 更新单词的学习进度
        const wordStats = appState.progressData[currentWord] || {};
        const updatedStats = calculateNextReview(wordStats, feedback);
        
        // 保存到Supabase
        if (appState.currentMovie) {
            saveUserProgress(appState.currentMovie.id, currentWord, updatedStats);
        }
        
        // 更新本地状态
        appState.progressData[currentWord] = updatedStats;
        
        // 显示下一个单词
        showNextWord();
        
        // 预取接下来的单词
        prefetchWords(appState.allWords, appState.progressData);
    }
}

// 处理"忘记了"反馈
function handleForgot() {
    handleFeedback('Hard');
}

// 处理"需巩固"反馈
function handleReview() {
    handleFeedback('Good');
}

// 处理"我认识"反馈
function handleKnown() {
    handleFeedback('Easy');
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
    // 检查是否已存在相同的消息提示
    const existingToast = document.querySelector(`.message-toast.${type}[data-message="${message}"]`);
    if (existingToast) {
        // 如果已存在相同消息，重置计时器
        clearTimeout(existingToast.timeoutId);
        existingToast.timeoutId = setTimeout(() => {
            if (existingToast.parentNode) {
                existingToast.parentNode.removeChild(existingToast);
            }
        }, 3000);
        return;
    }
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast ${type}`;
    messageElement.textContent = message;
    messageElement.setAttribute('data-message', message);
    
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
    messageElement.style.wordWrap = 'break-word';
    
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
    messageElement.timeoutId = setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// 实现 API 预取 (Pre-fetching) 提升流畅度
function prefetchWords(words, progress) {
    // 找到接下来 10 个最可能学习的单词（增加预取数量）
    const wordsToPrefetch = [];
    let tempProgress = JSON.parse(JSON.stringify(progress)); // 深拷贝进度，避免影响主逻辑
    for (let i = 0; i < 10; i++) { // 从5增加到10
        const nextWord = getNextWord(words, tempProgress);
        if (nextWord) {
            wordsToPrefetch.push(nextWord);
            // 标记为已"预习"，避免重复选择
            tempProgress[nextWord] = { reviewCount: 1, nextReviewDate: new Date() }; 
        } else {
            break;
        }
    }

    // 使用新的预取函数
    if (wordsToPrefetch.length > 0) {
        prefetchWordDetails(wordsToPrefetch).catch(error => {
            console.error('预取过程中出错:', error);
        });
    }
}

// 处理上传提交
async function handleUploadSubmit() {
    const titleInput = document.getElementById('movie-title-input');
    const subtitleFileInput = document.getElementById('subtitle-file');
    const coverFileInput = document.getElementById('cover-file');
    const uploadModal = document.getElementById('upload-modal');
    
    const title = titleInput.value.trim();
    const subtitleFile = subtitleFileInput.files[0];
    const coverFile = coverFileInput.files[0];
    
    if (!title || !subtitleFile) {
        alert('请填写电影标题并选择字幕文件');
        return;
    }
    
    showGlobalLoading('正在上传文件...');
    
    try {
        // 生成文件名（使用时间戳确保唯一性）
        const timestamp = Date.now();
        const subtitleFileName = `${timestamp}_${subtitleFile.name}`;
        const coverFileName = coverFile ? `${timestamp}_${coverFile.name}` : null;
        
        // 上传字幕文件
        const subtitleUrl = await uploadFile(subtitleFile, supabaseConfig.storage.subtitlesBucket, subtitleFileName);
        if (!subtitleUrl) {
            throw new Error('字幕文件上传失败');
        }
        
        // 上传封面图片（如果提供了）
        let coverUrl = null;
        if (coverFile) {
            coverUrl = await uploadFile(coverFile, supabaseConfig.storage.coversBucket, coverFileName);
            if (!coverUrl) {
                console.warn('封面图片上传失败，将继续创建电影记录');
            }
        }
        
        // 创建电影记录
        const movieData = {
            title: title,
            poster_url: coverUrl,
            subtitle_url: subtitleUrl,
            word_count: 0 // 初始词汇数为0，将在学习过程中更新
        };
        
        const movie = await createMovie(movieData);
        if (!movie) {
            throw new Error('电影记录创建失败');
        }
        
        // 隐藏模态框
        if (uploadModal) uploadModal.classList.add('hidden');
        
        // 重置表单
        titleInput.value = '';
        subtitleFileInput.value = '';
        coverFileInput.value = '';
        
        // 刷新用户媒体库
        renderUserLibrary();
        
        console.log('电影上传成功:', movie);
    } catch (error) {
        console.error('上传失败:', error);
        alert(`上传失败: ${error.message}`);
    } finally {
        hideGlobalLoading();
    }
}

// 读取文件内容为文本
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 导出loadMovieData函数
export { loadMovieData, loadUserMediaData };
