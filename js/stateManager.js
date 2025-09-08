import { saveWordProficiency } from './dataService.js';
import { wordDetailsCache, getWordDetails } from './api.js'; // 导入getWordDetails函数

const appState = {
    currentView: 'home', // 'home', 'study'
    currentMovie: null, // { id, title, ... }
    allWords: [],
    sentences: [],
    wordDetailsCache: wordDetailsCache, // 使用全局缓存实例
    currentWord: null, // 当前正在学习的单词
    currentWordDetails: null, // 当前单词的详细信息
    progressData: {}, // 学习进度数据
    wordFrequency: {}, // 单词频率统计
    wordProficiency: {}, // 单词熟练度标记 { word: 'beginner' | 'intermediate' | 'advanced' }
    studyMode: 'browse', // 'browse' | 'review'
    settings: {
        minFrequency: 1,
        proficiencyLabels: {
            beginner: '生词',
            intermediate: '学习中',
            advanced: '已掌握'
        },
        dictionaryAPI: 'free-dictionary'
    },
    showSettings: false // 是否显示设置面板
};

// 确保在DOM加载完成后再获取元素
let elements = {};

function initializeElements() {
    elements = {
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
        movieTitle: document.getElementById('movie-title'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsPanel: document.getElementById('settings-panel'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        resetSettingsBtn: document.getElementById('reset-settings-btn'),
        minFrequencyInput: document.getElementById('min-frequency'),
        beginnerLabelInput: document.getElementById('beginner-label'),
        intermediateLabelInput: document.getElementById('intermediate-label'),
        advancedLabelInput: document.getElementById('advanced-label'),
        dictionaryAPISelect: document.getElementById('dictionary-api')
    };
}

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
        
        // 控制设置面板显示
        if (elements.settingsPanel) {
            elements.settingsPanel.classList.toggle('hidden', !appState.showSettings);
        }
        
        // 更新设置面板内容
        if (appState.showSettings) {
            updateSettingsPanel();
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
            
            // 更新进度指示器
            updateStudyProgress();
            updateFlipButton();
        }
        
        // 在移动端显示返回按钮
        const backBtn = document.getElementById('back-to-word-list');
        if (backBtn && window.innerWidth <= 768) {
            backBtn.classList.remove('hidden');
        } else if (backBtn) {
            backBtn.classList.add('hidden');
        }
    }
}

// 更新设置面板内容
function updateSettingsPanel() {
    if (elements.minFrequencyInput) {
        elements.minFrequencyInput.value = appState.settings.minFrequency;
    }
    
    if (elements.beginnerLabelInput) {
        elements.beginnerLabelInput.value = appState.settings.proficiencyLabels.beginner;
    }
    
    if (elements.intermediateLabelInput) {
        elements.intermediateLabelInput.value = appState.settings.proficiencyLabels.intermediate;
    }
    
    if (elements.advancedLabelInput) {
        elements.advancedLabelInput.value = appState.settings.proficiencyLabels.advanced;
    }
    
    if (elements.dictionaryAPISelect) {
        elements.dictionaryAPISelect.value = appState.settings.dictionaryAPI;
    }
}

// 更新进度指示器
function updateStudyProgress() {
    const progressElement = document.getElementById('study-progress');
    const currentCardElement = document.getElementById('current-card');
    const totalCardsElement = document.getElementById('total-cards');
    
    if (progressElement && currentCardElement && totalCardsElement) {
        // 计算当前卡片索引和总卡片数
        const currentIndex = appState.allWords.indexOf(appState.currentWord) + 1;
        const totalCards = appState.allWords.length;
        
        // 更新显示
        currentCardElement.textContent = currentIndex;
        totalCardsElement.textContent = totalCards;
        
        // 控制进度指示器显示/隐藏
        if (totalCards > 0) {
            progressElement.classList.remove('hidden');
        } else {
            progressElement.classList.add('hidden');
        }
    }
}

// 控制翻面按钮显示
function updateFlipButton() {
    const flipContainer = document.getElementById('flip-container');
    const flipBtn = document.getElementById('flip-btn');
    const definitionElement = document.getElementById('definition');
    const exampleElement = document.getElementById('example-sentence');
    
    if (flipContainer && flipBtn && definitionElement && exampleElement) {
        // 只在有单词详情时显示翻面按钮
        if (appState.currentWordDetails) {
            flipContainer.classList.remove('hidden');
            
            // 添加翻面按钮事件
            flipBtn.onclick = function() {
                // 切换释义和例句的显示状态
                const isDefinitionVisible = !definitionElement.classList.contains('hidden');
                definitionElement.classList.toggle('hidden', isDefinitionVisible);
                exampleElement.classList.toggle('hidden', isDefinitionVisible);
                
                // 更新按钮文本
                flipBtn.textContent = isDefinitionVisible ? '翻面查看单词' : '翻面查看释义';
            };
        } else {
            flipContainer.classList.add('hidden');
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
        
        // 过滤掉频率低于最小值的单词
        const filteredWords = sortedWords.filter(word => {
            const frequency = appState.wordFrequency[word] || 0;
            return frequency >= appState.settings.minFrequency;
        });
        
        filteredWords.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.setAttribute('role', 'listitem');
            wordItem.setAttribute('tabindex', '0');
            if (word === appState.currentWord) {
                wordItem.classList.add('active');
                wordItem.setAttribute('aria-selected', 'true');
            } else {
                wordItem.setAttribute('aria-selected', 'false');
            }
            
            const frequency = appState.wordFrequency[word] || 1;
            const proficiency = appState.wordProficiency[word] || 'unknown';
            
            // 使用自定义标签
            const proficiencyLabels = appState.settings.proficiencyLabels;
            const proficiencyLabel = proficiency === 'beginner' ? proficiencyLabels.beginner :
                                   proficiency === 'intermediate' ? proficiencyLabels.intermediate :
                                   proficiency === 'advanced' ? proficiencyLabels.advanced : '未标记';
            
            wordItem.setAttribute('data-proficiency', proficiency);
            wordItem.setAttribute('aria-label', `${word}，频率：${frequency}，熟练度：${proficiencyLabel}`);
            wordItem.innerHTML = `
                <div class="word-info">
                    <span class="word-text" role="button" tabindex="0" aria-label="点击查看${word}的详细信息">${word}</span>
                    <span class="word-frequency" aria-label="出现频率">${frequency}</span>
                </div>
                <div class="proficiency-container">
                    <select class="proficiency-select" data-word="${word}" aria-label="设置${word}的熟练度">
                        <option value="unknown" ${proficiency === 'unknown' ? 'selected' : ''}>未标记</option>
                        <option value="beginner" ${proficiency === 'beginner' ? 'selected' : ''}>${proficiencyLabels.beginner}</option>
                        <option value="intermediate" ${proficiency === 'intermediate' ? 'selected' : ''}>${proficiencyLabels.intermediate}</option>
                        <option value="advanced" ${proficiency === 'advanced' ? 'selected' : ''}>${proficiencyLabels.advanced}</option>
                    </select>
                </div>
            `;
            
            wordItem.addEventListener('click', (e) => {
                // 如果点击的是下拉框，不触发选择单词
                if (e.target.classList.contains('proficiency-select')) {
                    return;
                }
                
                // 检查是否是单词文本本身被点击
                if (e.target.classList.contains('word-text')) {
                    // 显示单词详情浮层
                    showWordPopover(word);
                } else {
                    // 选择单词
                    selectWord(word);
                    
                    // 在移动端隐藏单词列表面板，显示单词详情面板
                    if (window.innerWidth <= 768) {
                        const wordListPanel = document.querySelector('.word-list-panel');
                        const wordDetailPanel = document.querySelector('.word-detail-panel');
                        const backBtn = document.getElementById('back-to-word-list');
                        
                        if (wordListPanel && wordDetailPanel && backBtn) {
                            wordListPanel.classList.add('mobile-hidden');
                            wordDetailPanel.classList.remove('mobile-hidden');
                            backBtn.classList.remove('hidden');
                        }
                    }
                }
            });
            
            // 添加键盘支持
            wordItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    wordItem.click();
                }
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
            noReviewItem.setAttribute('role', 'listitem');
            noReviewItem.innerHTML = '<div class="word-info"><span class="word-text">暂无需要复习的单词</span></div>';
            elements.wordListContainer.appendChild(noReviewItem);
        } else {
            reviewWords.forEach(wordObj => {
                const wordItem = document.createElement('div');
                wordItem.className = 'word-item';
                wordItem.setAttribute('role', 'listitem');
                wordItem.setAttribute('tabindex', '0');
                if (wordObj.word === appState.currentWord) {
                    wordItem.classList.add('active');
                    wordItem.setAttribute('aria-selected', 'true');
                } else {
                    wordItem.setAttribute('aria-selected', 'false');
                }
                
                const frequency = appState.wordFrequency[wordObj.word] || 1;
                const proficiency = appState.wordProficiency[wordObj.word] || 'unknown';
                const isDue = wordObj.isDue ? '（到期）' : '（紧急）';
                
                // 使用自定义标签
                const proficiencyLabels = appState.settings.proficiencyLabels;
                const proficiencyLabel = proficiency === 'beginner' ? proficiencyLabels.beginner :
                                       proficiency === 'intermediate' ? proficiencyLabels.intermediate :
                                       proficiency === 'advanced' ? proficiencyLabels.advanced : '未标记';
                
                wordItem.setAttribute('data-proficiency', proficiency);
                wordItem.setAttribute('aria-label', `${wordObj.word}，频率：${frequency}${isDue}，熟练度：${proficiencyLabel}`);
                wordItem.innerHTML = `
                    <div class="word-info">
                        <span class="word-text" role="button" tabindex="0" aria-label="点击查看${wordObj.word}的详细信息">${wordObj.word}</span>
                        <span class="word-frequency" aria-label="出现频率">${frequency}${isDue}</span>
                    </div>
                    <div class="proficiency-container">
                        <select class="proficiency-select" data-word="${wordObj.word}" aria-label="设置${wordObj.word}的熟练度">
                            <option value="unknown" ${proficiency === 'unknown' ? 'selected' : ''}>未标记</option>
                            <option value="beginner" ${proficiency === 'beginner' ? 'selected' : ''}>${proficiencyLabels.beginner}</option>
                            <option value="intermediate" ${proficiency === 'intermediate' ? 'selected' : ''}>${proficiencyLabels.intermediate}</option>
                            <option value="advanced" ${proficiency === 'advanced' ? 'selected' : ''}>${proficiencyLabels.advanced}</option>
                        </select>
                    </div>
                `;
                
                wordItem.addEventListener('click', (e) => {
                    // 如果点击的是下拉框，不触发选择单词
                    if (e.target.classList.contains('proficiency-select')) {
                        return;
                    }
                    
                    // 检查是否是单词文本本身被点击
                    if (e.target.classList.contains('word-text')) {
                        // 显示单词详情浮层
                        showWordPopover(wordObj.word);
                    } else {
                        // 选择单词
                        selectWord(wordObj.word);
                        
                        // 在移动端隐藏单词列表面板，显示单词详情面板
                        if (window.innerWidth <= 768) {
                            const wordListPanel = document.querySelector('.word-list-panel');
                            const wordDetailPanel = document.querySelector('.word-detail-panel');
                            const backBtn = document.getElementById('back-to-word-list');
                            
                            if (wordListPanel && wordDetailPanel && backBtn) {
                                wordListPanel.classList.add('mobile-hidden');
                                wordDetailPanel.classList.remove('mobile-hidden');
                                backBtn.classList.remove('hidden');
                            }
                        }
                    }
                });
                
                // 添加键盘支持
                wordItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        wordItem.click();
                    }
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

// 显示单词详情浮层
async function showWordPopover(word) {
    const popover = document.getElementById('word-popover');
    const popoverWord = document.getElementById('popover-word');
    const popoverPhonetic = document.getElementById('popover-phonetic');
    const popoverDefinition = document.getElementById('popover-definition');
    const popoverExample = document.getElementById('popover-example');
    const closePopover = document.getElementById('close-popover');
    
    if (!popover || !popoverWord || !popoverPhonetic || !popoverDefinition || !popoverExample || !closePopover) {
        console.error('单词详情浮层元素未找到');
        return;
    }
    
    // 显示加载状态
    popoverWord.textContent = word;
    popoverPhonetic.textContent = '加载中...';
    popoverDefinition.textContent = '';
    popoverExample.textContent = '';
    
    // 显示浮层
    popover.classList.remove('hidden');
    
    // 添加背景遮罩
    let overlay = document.querySelector('.popover-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'popover-overlay';
        document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
    
    try {
        // 获取单词详细信息
        const wordDetails = await getWordDetails(word);
        
        if (wordDetails) {
            // 更新浮层内容
            popoverWord.textContent = wordDetails.word;
            popoverPhonetic.textContent = wordDetails.phonetic || '';
            
            // 渲染释义
            let definitionHTML = '';
            if (wordDetails.meanings && wordDetails.meanings.length > 0) {
                wordDetails.meanings.forEach(meaning => {
                    definitionHTML += `<p><strong>${meaning.partOfSpeech || '释义'}</strong>: ${meaning.definitions.join('; ')}</p>`;
                });
            } else {
                definitionHTML = '<p>暂无释义信息。</p>';
            }
            popoverDefinition.innerHTML = definitionHTML;
            
            // 查找并显示例句
            const example = findExampleSentence(word, appState.sentences);
            popoverExample.innerHTML = example ? 
                example.replace(new RegExp(`\\b${word}\\b`, 'ig'), `<strong>${word}</strong>`) :
                `未在影片中找到包含"${word}"的清晰例句。`;
        } else {
            popoverWord.textContent = word;
            popoverPhonetic.textContent = '';
            popoverDefinition.innerHTML = '<p>未找到该单词的详细信息。</p>';
            popoverExample.textContent = '';
        }
    } catch (error) {
        console.error('获取单词详情时出错:', error);
        popoverWord.textContent = word;
        popoverPhonetic.textContent = '';
        popoverDefinition.innerHTML = '<p>获取单词详情时出错，请检查控制台了解详情。</p>';
        popoverExample.textContent = '';
    }
    
    // 绑定关闭事件
    const closePopoverHandler = () => {
        popover.classList.add('hidden');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        closePopover.removeEventListener('click', closePopoverHandler);
        overlay.removeEventListener('click', closeOverlayHandler);
    };
    
    const closeOverlayHandler = (e) => {
        if (e.target === overlay) {
            closePopoverHandler();
        }
    };
    
    closePopover.addEventListener('click', closePopoverHandler);
    overlay.addEventListener('click', closeOverlayHandler);
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
    
    // 总是启用发音按钮，即使没有音频也允许点击（提供反馈）
    elements.pronunciationBtn.disabled = false;
    elements.pronunciationBtn.style.display = 'inline-block';
    
    if (wordData.audio) {
        elements.pronunciationBtn.title = "点击播放发音";
        elements.pronunciationBtn.onclick = () => {
            try {
                const audio = new Audio(wordData.audio);
                audio.play().catch(error => {
                    console.error('播放音频时出错:', error);
                    // 显示错误提示
                    const originalText = elements.pronunciationBtn.textContent;
                    elements.pronunciationBtn.textContent = "播放失败";
                    setTimeout(() => {
                        elements.pronunciationBtn.textContent = originalText;
                    }, 2000);
                });
            } catch (error) {
                console.error('创建音频对象时出错:', error);
                // 显示错误提示
                const originalText = elements.pronunciationBtn.textContent;
                elements.pronunciationBtn.textContent = "播放失败";
                setTimeout(() => {
                    elements.pronunciationBtn.textContent = originalText;
                }, 2000);
            }
        };
    } else {
        elements.pronunciationBtn.title = "该单词暂无发音";
        elements.pronunciationBtn.onclick = () => {
            // 即使没有音频，也提供用户反馈
            const originalText = elements.pronunciationBtn.textContent;
            elements.pronunciationBtn.textContent = "无音频";
            setTimeout(() => {
                elements.pronunciationBtn.textContent = originalText;
            }, 1000);
        };
    }
    
    // 渲染词性和释义（添加中文翻译）
    let definitionHTML = '';
    if (wordData.meanings && wordData.meanings.length > 0) {
        wordData.meanings.forEach(meaning => {
            // 添加中文翻译（如果可用）
            let translation = '';
            if (meaning.chineseTranslation) {
                translation = `<br><span class="chinese-translation">中文释义: ${meaning.chineseTranslation}</span>`;
            }
            
            definitionHTML += `<p><strong>${meaning.partOfSpeech || '释义'}</strong>: ${meaning.definitions.join('; ')}${translation}</p>`;
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
    
    // 初始隐藏例句，只显示释义
    elements.exampleSentenceElement.classList.add('hidden');
    
    // 更新进度指示器和翻面按钮
    updateStudyProgress();
    updateFlipButton();
}

// 选择单词
async function selectWord(word) {
    // 检查单词是否已在缓存中
    const cachedWordDetails = wordDetailsCache.get(word);
    
    if (cachedWordDetails) {
        // 如果单词详情已在缓存中，直接显示，无需加载状态
        setState({ 
            currentWord: word,
            currentWordDetails: cachedWordDetails
        });
    } else {
        // 如果单词详情不在缓存中，先显示加载状态
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
}

// 设置单词熟练度
function setWordProficiency(word, proficiency) {
    appState.wordProficiency[word] = proficiency;
    
    // 保存到Supabase
    if (appState.currentMovie) {
        saveWordProficiency(appState.currentMovie.id, word, proficiency);
    }
    
    // 更新单词项的熟练度属性
    const wordItems = document.querySelectorAll(`.proficiency-select[data-word="${word}"]`);
    wordItems.forEach(select => {
        const wordItem = select.closest('.word-item');
        if (wordItem) {
            wordItem.setAttribute('data-proficiency', proficiency);
        }
    });
    
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

// 切换设置面板显示
function toggleSettings(show) {
    setState({ showSettings: show });
}

// 保存设置
function saveSettings() {
    const newSettings = {
        minFrequency: parseInt(elements.minFrequencyInput.value) || 1,
        proficiencyLabels: {
            beginner: elements.beginnerLabelInput.value || '生词',
            intermediate: elements.intermediateLabelInput.value || '学习中',
            advanced: elements.advancedLabelInput.value || '已掌握'
        },
        dictionaryAPI: elements.dictionaryAPISelect.value || 'free-dictionary'
    };
    
    setState({ settings: newSettings, showSettings: false });
    
    // 保存到LocalStorage
    localStorage.setItem('linguasubs_settings', JSON.stringify(newSettings));
    
    // 重新渲染单词列表
    renderWordList();
}

// 重置设置
function resetSettings() {
    const defaultSettings = {
        minFrequency: 1,
        proficiencyLabels: {
            beginner: '生词',
            intermediate: '学习中',
            advanced: '已掌握'
        },
        dictionaryAPI: 'free-dictionary'
    };
    
    setState({ settings: defaultSettings });
    updateSettingsPanel();
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

// 导出appState、setState函数、elements对象、initializeElements函数、selectWord函数、setWordProficiency函数、renderWordList函数、renderWordDetails函数、toggleStudyMode函数、toggleSettings函数、saveSettings函数、resetSettings函数、updateStudyProgress函数和updateFlipButton函数
export { appState, setState, elements, initializeElements, selectWord, setWordProficiency, renderWordList, renderWordDetails, toggleStudyMode, toggleSettings, saveSettings, resetSettings, updateStudyProgress, updateFlipButton };
