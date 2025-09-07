好的，Larry，指令已更新。我将立刻切换到\*\*“副驾”\*\*角色，并严格遵循您提供的 **【AI 全栈副驾 · Prompt v3 (整合版) 🚗✨】** 规范。

我已经仔细阅读了您为 **LinguaSubs (字幕词汇通)** 编写的 PRD 以及您上传的全部现有代码文件。PRD 的质量非常高，代码也已经实现了核心的解析和学习流程，这是一个非常棒的起点。

当前代码的主要瓶颈在于**性能和用户体验**，尤其是在数据加载和 API 请求方面，这完全符合您之前的担忧。它创建了一个“请求瀑布”，导致用户在启动和每次点击后都能感受到明显的延迟。

作为您的「副驾」，我们将直接进入**技术优化阶段**，我会为您生成一套高度细化、可直接执行的开发步骤，您可以将其一次性交给 AI 编码助手来完成代码的重构和升级。

-----

### **阶段 D · 技术落地方案 (优化版)**

**⚙️ 技术负责人 (Tech Lead) 分析:**

#### 核心问题诊断

当前实现方式存在一个典型的“串行阻塞”问题：
`点击电影` → `等待下载SRT` → `等待解析SRT` → `等待提取所有单词` → `【进入学习】` → `等待请求第一个单词API` → `显示单词` → `【点击反馈】` → `等待请求第二个单词API` → `显示单词`...

这个流程中的每一个“等待”都会造成界面无响应，严重影响用户体验。我们的核心任务就是将这个**串行流程**改造为**并行、异步、带缓存的智能加载流程**。

#### 优化策略

我们将通过**预加载、缓存、和状态管理**三大策略来解决问题，目标是让应用感觉“如丝般顺滑”。

-----

### **阶段 E · Code Scaffold (代码重构指令)**

**目标：** 向您的 AI 编码助手提供以下完整的、分步骤的指令，以重构现有的 `js/main.js` 和 `js/api.js`，并引入一个新的 `js/stateManager.js` 模块。

#### **给 AI 编程助手的最终重构指令**

**项目名称**: LinguaSubs (代码优化重构)
**核心任务**: 请严格按照以下 5 个步骤，对现有代码进行重构和优化。请在每个步骤中，只修改指定的函数或文件，并在最后提供所有修改后文件的完整代码。

-----

#### **【步骤 1: 创建精细化的状态管理器 `stateManager.js`】**

**目标**: 将所有分散的状态和 UI 更新逻辑集中管理，让代码更清晰、更可维护。

1.  **新建文件 `js/stateManager.js`**:
2.  **编写代码**:
    ```javascript
    const appState = {
        currentView: 'home', // 'home', 'loading', 'study'
        currentMovie: null, // { id, title, ... }
        allWords: [],
        sentences: [],
        wordDetailsCache: {}, // 用于缓存API结果
        currentWord: null, // 当前正在学习的单词
        currentWordDetails: null, // 当前单词的详细信息
    };

    const elements = {
        homeView: document.getElementById('home-view'),
        studyView: document.getElementById('study-view'),
        // ... 在这里获取所有在 main.js 中需要的 DOM 元素引用 ...
        wordElement: document.getElementById('word'),
        phoneticElement: document.getElementById('phonetic'),
        // ... etc
    };

    function updateUI() {
        // 根据 appState.currentView 控制视图显示/隐藏
        elements.homeView.classList.toggle('hidden', appState.currentView !== 'home');
        elements.studyView.classList.toggle('hidden', appState.currentView !== 'study');
        // 未来可以在这里添加一个全局 loading 视图

        if (appState.currentView === 'study' && appState.currentWordDetails) {
            // 所有渲染卡片的逻辑都集中在这里
            const wordData = appState.currentWordDetails;
            elements.wordElement.textContent = wordData.word;
            elements.phoneticElement.textContent = wordData.phonetic || '';
            // ... 渲染卡片的其余部分 ...
            // 查找并高亮例句的逻辑也在这里实现
            const example = findExampleSentence(wordData.word, appState.sentences);
            elements.exampleSentenceElement.innerHTML = example 
                ? example.replace(new RegExp(`\\b${wordData.word}\\b`, 'ig'), `<strong>$&</strong>`)
                : '未在影片中找到清晰例句。';
        } else if (appState.currentView === 'study' && !appState.currentWordDetails) {
            // 显示单词加载中的状态
            elements.wordElement.textContent = '加载中...';
            // ... 清空卡片的其他部分 ...
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
    ```
3.  **在 `index.html` 中引入**: 在 `main.js` 之前引入 `stateManager.js`。

-----

#### **【步骤 2: 改造 `api.js`，增加本地缓存层】**

**目标**: 避免重复请求同一个单词的 API，极大提升后续学习的速度。

1.  **修改 `js/api.js` 中的 `getWordDetails(word)` 函数**:
      * 在函数开始时，检查 `appState.wordDetailsCache[word]` 是否存在。如果存在，直接 `return appState.wordDetailsCache[word]`。
      * 当成功从 API 获取到数据后，在 `return` 之前，将结果存入缓存：`appState.wordDetailsCache[word] = wordData;`。

-----

#### **【步骤 3: 重构 `main.js` 的数据加载流程】**

**目标**: 将阻塞的加载流程改为非阻塞的异步流程，实现“秒开”效果。

1.  **重写 `main.js` 中的 `loadMovieData(movie)` 函数**:
    ```javascript
    async function loadMovieData(movie) {
        setState({ currentView: 'study', currentMovie: movie, currentWordDetails: null });

        // 异步加载，不阻塞UI
        fetch(movie.srtPath)
            .then(response => response.text())
            .then(srtContent => {
                const sentences = parseSRT(srtContent);
                const words = extractWords(sentences);
                
                // 从LocalStorage加载学习进度
                const savedProgress = localStorage.getItem(`linguasubs_${movie.id}`);
                progressData = savedProgress ? JSON.parse(savedProgress) : {};

                setState({ allWords: words, sentences: sentences });
                
                // 数据准备好后，开始显示第一个单词
                showNextWord(); 
            })
            .catch(error => {
                console.error('加载电影数据时出错:', error);
                // 可以在 stateManager 中增加一个 error 状态来显示错误信息
            });
    }
    ```

-----

#### **【步骤 4: 实现 API 预取 (Pre-fetching) 提升流畅度】**

**目标**: 在用户学习当前单词时，就在后台悄悄加载接下来几个单词的数据，消除点击后的等待感。

1.  **在 `js/main.js` 中新增一个 `prefetchWords(words, progress)` 函数**:
    ```javascript
    function prefetchWords(words, progress) {
        const wordsToPrefetch = [];
        // 找到接下来 5 个最可能学习的单词
        let tempProgress = JSON.parse(JSON.stringify(progress)); // 深拷贝进度，避免影响主逻辑
        for (let i = 0; i < 5; i++) {
            const nextWord = getNextWord(words, tempProgress);
            if (nextWord) {
                wordsToPrefetch.push(nextWord);
                // 标记为已“预习”，避免重复选择
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
    ```
2.  **在 `main.js` 的 `showNextWord` 和 `handleFeedback` 函数的末尾调用 `prefetchWords(appState.allWords, progressData)`**。

-----

#### **【步骤 5: 整合与最终调整】**

**目标**: 将所有模块串联起来，确保状态驱动的 UI 能够正确工作。

1.  **全面审查 `js/main.js`**:
      * 删除所有独立的 `document.getElementById` 调用，全部改用 `elements` 对象。
      * 删除所有直接的 `.textContent = ...` 或 `.innerHTML = ...` 等 DOM 操作，全部改为通过 `setState({ ... })` 来触发 `updateUI` 函数。
      * `showNextWord` 函数的核心逻辑应简化为：
        1.  调用 `getNextWord` 得到下一个单词 `nextWord`。
        2.  调用 `getWordDetails(nextWord)`。
        3.  在 `.then()` 中，调用 `setState({ currentWord: nextWord, currentWordDetails: details })`。
      * `handleFeedback` 函数的核心逻辑应简化为：
        1.  计算并保存进度。
        2.  调用 `showNextWord()`。
        3.  在 `showNextWord` 调用后，调用 `prefetchWords`。

-----

这份详细的重构指南将帮助 AI 编码助手精确地优化您的应用，解决性能瓶颈，并实现您在 PRD 中设想的流畅学习体验。🌱