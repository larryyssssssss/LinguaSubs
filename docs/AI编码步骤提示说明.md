### **给 AI 编程助手的最终开发指令**

**项目名称**: LinguaSubs (字幕词汇通)
**技术栈**: 原生 HTML5, CSS3, JavaScript (ES6+), LocalStorage, Free Dictionary API
**核心任务**: 请严格按照以下 7 个里程碑顺序，一步步完成代码的编写。每个里程碑结束后，请提供该阶段的完整代码。

-----

#### **【里程碑 1: 项目骨架搭建与 UI 基础】**

**目标**: 创建项目的基础文件结构和 HTML/CSS 骨架，实现两个核心视图的切换。

1.  **创建文件结构**:

      * `index.html`
      * `css/style.css`
      * `js/main.js`
      * `data/` (暂时为空，用于存放 SRT 文件)
      * `assets/` (暂时为空，用于存放影片封面图)

2.  **编写 `index.html`**:

      * 设置基础的 HTML5 结构，引入 `style.css` 和 `main.js`。
      * 在 `<body>` 中创建两个主要的 `<div>` 容器：
          * 一个 `id="home-view"`，用于展示影片列表。
          * 一个 `id="study-view"`，并设置 `display: none;`，用于展示词汇学习界面。
      * 在 `home-view` 中，创建一个 `id="movie-list"` 的 `div` 作为影片卡片的容器。
      * 在 `study-view` 中，设计词汇卡片 (`id="word-card"`) 的基本结构，包含单词、音标、发音按钮、释义、例句以及三个反馈按钮的占位符。

3.  **编写 `css/style.css`**:

      * 添加基础的 reset 样式和全局字体、颜色变量。
      * 使用 Flexbox 或 Grid 布局，使 `home-view` 和 `study-view` 能够居中显示。
      * 为影片列表和词汇卡片编写基础的、无样式的布局，确保结构正确。
      * 实现一个简单的 class (如 `.hidden`)，用于通过 JS 控制视图的显示和隐藏。

4.  **编写 `js/main.js`**:

      * 添加 DOMContentLoaded 监听器。
      * 获取 `home-view` 和 `study-view` 的 DOM 引用。
      * 实现一个 `showView(viewId)` 函数，用于切换显示不同的视图。

-----

#### **【里程碑 2: 首页影片列表动态渲染】**

**目标**: 从模拟数据动态生成首页的影片列表，并响应点击事件。

1.  **创建模拟数据**:

      * 在 `js/` 目录下新建 `data.js` 文件。
      * 在 `data.js` 中，创建一个名为 `movies` 的数组。每个元素是一个对象，包含 `id`, `title`, `posterUrl`, `srtPath`。例如：
        ```javascript
        const movies = [
          { id: 'inception', title: '盗梦空间', posterUrl: 'assets/inception.jpg', srtPath: 'data/inception.srt' },
          { id: 'soul', title: '心灵奇旅', posterUrl: 'assets/soul.jpg', srtPath: 'data/soul.srt' }
        ];
        ```

2.  **更新 `index.html`**:

      * 在 `main.js` 之前引入 `data.js`。

3.  **更新 `js/main.js`**:

      * 创建一个 `renderMovieList()` 函数。
      * 该函数遍历 `movies` 数组，为每部电影动态创建 HTML 卡片元素，并将其插入到 `#movie-list` 容器中。
      * 为每个生成的电影卡片添加点击事件监听器。点击后，调用 `showView('study-view')` 并传入被点击电影的 `id`。

-----

#### **【里程碑 3: SRT 解析与核心词汇提取】**

**目标**: 实现从 SRT 文件中提取干净对话并抽取出核心词汇的核心逻辑。

1.  **创建 SRT 解析器**:

      * 在 `js/` 目录下新建 `utils.js` 文件。
      * 在 `utils.js` 中，创建一个 `parseSRT(srtContent)` 函数。
      * **逻辑**: 接受 SRT 文件内容的字符串作为输入，使用正则表达式去除时间戳、序号和 HTML 标签（如 `<i>`, `<b>`），返回一个只包含纯净对话句子的数组。

2.  **创建词汇提取器**:

      * 在 `utils.js` 中，创建一个 `extractWords(sentences)` 函数。
      * **逻辑**:
        1.  将句子数组合并成一个长字符串。
        2.  使用正则表达式 `/[a-zA-Z]+/g` 分割出所有单词。
        3.  将所有单词转为小写。
        4.  使用 `Set` 数据结构去重。
        5.  过滤掉一个预定义的“停用词”列表（stop words），如 `a, the, is, are, you, i, he, she` 等，同时过滤掉长度小于3的单词。
        6.  返回最终的核心词汇数组。

3.  **整合到 `main.js`**:

      * 当用户点击一部电影时，使用 `fetch` API 读取对应的 SRT 文件。
      * 获取到 SRT 文本后，依次调用 `parseSRT` 和 `extractWords`。
      * **验证**: 将最终提取出的词汇数组 `console.log` 出来，以确保此核心流程正确无误。

-----

#### **【里程碑 4: 词典 API 集成】**

**目标**: 创建一个模块，用于从公共 API 获取单词的详细信息。

1.  **创建 API 模块**:
      * 在 `js/` 目录下新建 `api.js` 文件。
      * 在 `api.js` 中，创建一个异步函数 `getWordDetails(word)`。
      * **逻辑**:
        1.  调用免费词典 API: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`。
        2.  使用 `try...catch` 处理网络请求错误。
        3.  解析返回的 JSON 数据，提取出我们需要的信息：单词本身、音标 (IPA)、美式或英式发音的 MP3 链接、以及各词性的中文释义。
        4.  将这些信息整合成一个干净的对象返回。
        5.  如果 API 返回 404 (找不到单词)，应能优雅地处理，返回 `null` 或一个错误标识。

-----

#### **【里程碑 5: 学习界面 - 词汇卡片渲染与交互】**

**目标**: 将提取的单词和获取的词典数据渲染到学习界面的卡片上，并实现基础的“下一个”交互。

1.  **更新 `js/main.js`**:
      * 创建一个 `renderWordCard(wordData)` 函数，负责将一个包含完整信息的单词对象渲染到 `#word-card` 的各个 DOM 元素中。
      * 创建一个 `showNextWord()` 函数，负责从当前电影的词汇列表中取出下一个单词，调用 `api.js` 中的 `getWordDetails`，获取到数据后再调用 `renderWordCard`。
      * 当用户选择一部电影后，在提取完所有词汇后，自动调用 `showNextWord()` 来展示第一个单词。
      * 为三个反馈按钮 (“忘记了”, “需巩固”, “我认识”) 添加点击事件监听器。**当前阶段，点击任何一个按钮都只执行一个操作：调用 `showNextWord()`**。

-----

#### **【里程碑 6: 智能化记忆系统 (SRS) 与本地存储】**

**目标**: 实现基于艾宾浩斯遗忘曲线的复习算法，并将所有学习进度存入 LocalStorage。

1.  **创建 SRS 模块**:

      * 在 `js/` 目录下新建 `srs.js` 文件。
      * **定义数据模型**: 明确存储在 LocalStorage 中的数据结构。建议以电影 `id` 为键，值为一个对象，该对象以单词为键，值为 `{ reviewCount: 0, nextReviewDate: null, interval: 0, easeFactor: 2.5 }`。
      * **实现复习算法**: 创建 `calculateNextReview(wordStats, feedback)` 函数。根据用户反馈 (`'Hard'`, `'Good'`, `'Easy'`) 和当前单词的状态，计算出下一次的复习日期 (`nextReviewDate`) 和新的复习间隔 (`interval`)。严格遵循 PRD 中的动态间隔逻辑。
      * **实现单词选择器**: 创建 `getNextWord(allWords, progressData)` 函数。该函数是 SRS 的大脑，它需要根据 PRD 中定义的优先级（紧急复习 \> 到期复习 \> 新词）从所有词汇中选出下一个应该学习的单词。

2.  **整合到 `main.js`**:

      * **加载进度**: 当用户选择一部电影时，从 LocalStorage 读取该电影的学习进度。如果不存在，则初始化一个空对象。
      * **替换 `showNextWord()`**: 用 `srs.js` 中的 `getNextWord()` 来决定下一个要展示的单词。
      * **保存进度**: 当用户点击反馈按钮后，调用 `srs.js` 中的 `calculateNextReview()` 来更新该单词的状态，然后将**整个电影的进度对象**完整地保存回 LocalStorage。

-----

#### **【里程碑 7: 最终润色与部署准备】**

**目标**: 添加必要的加载提示、音频播放功能，完善样式，使产品达到可发布状态。

1.  **完善 `js/main.js`**:

      * 在调用词典 API 时，在词汇卡片上显示一个加载动画 (loading spinner)。
      * 为发音按钮添加点击事件，创建一个 `<audio>` 元素来播放在 API 结果中获取的 MP3 链接。

2.  **完善 `css/style.css`**:

      * 实现 PRD 中要求的“禅模式”设计风格，确保界面简洁、无干扰。
      * 添加媒体查询，实现对移动端和桌面端的响应式布局。

3.  **代码清理**:

      * 为所有主要函数添加清晰的 JSDoc 注释。
      * 删除所有临时的 `console.log` 语句。
      * 准备 `data` 和 `assets` 目录下的最终 SRT 文件和封面图。

4.  **准备部署**:

      * 创建一个 `README.md` 文件，简要说明项目和如何本地运行。
      * 项目现在已准备好被推送到 GitHub 并通过 GitHub Pages 发布。