# LinguaSubs 变更日志

## [v1.2.6] - 2025-09-07

### 修复问题
- **示例影片显示问题**: 
  - 修复了电影海报图片URL字段名不匹配问题，正确处理`poster_url`字段
  - 修复了电影字幕文件路径字段名不匹配问题，正确处理`subtitle_url`和`srt_path`字段
  - 优化了图片加载失败时的处理逻辑，使用本地SVG数据URL替代网络图片，避免加载失败循环

## [v1.2.5] - 2025-09-07

### 修复问题
- **模块导出错误**: 
  - 修复了[srs.js](file:///Users/tantan/code/LinguaSubs/js/srs.js)文件中缺少函数导出的问题，正确导出[calculateNextReview](file:///Users/tantan/code/LinguaSubs/js/srs.js#L47-L70)和[getNextWord](file:///Users/tantan/code/LinguaSubs/js/srs.js#L79-L104)函数
  - 修复了数据库表结构，添加了[proficiency](file:///Users/tantan/code/LinguaSubs/js/stateManager.js#L5-L27)字段以支持单词熟练度功能

## [v1.2.4] - 2025-09-07

### 修复问题
- **函数重复导入错误**: 
  - 修复了[main.js](file:///Users/tantan/code/LinguaSubs/js/main.js)中[prefetchWordDetails](file:///Users/tantan/code/LinguaSubs/js/api.js#L133-L174)函数被重复导入的问题
  - 确保所有ES6模块导入不重复，避免Identifier重复声明错误

## [v1.2.3] - 2025-09-07

### 修复问题
- **模块加载错误**: 
  - 修复了[data.js](file:///Users/tantan/code/LinguaSubs/js/data.js)文件模块加载问题，正确添加type="module"属性
  - 修复了[handleFeedback](file:///Users/tantan/code/LinguaSubs/js/main.js#L718-L745)函数中[appState](file:///Users/tantan/code/LinguaSubs/js/stateManager.js#L5-L27)未导入的问题
  - 优化了数据库查询错误处理，避免因字段不存在导致的错误

## [v1.2.2] - 2025-09-07

### 修复问题
- **示例影片访问错误**: 
  - 修复了示例影片ID格式不兼容Supabase的问题，使用UUID格式ID
  - 修复了[stateManager.js](file:///Users/tantan/code/LinguaSubs/js/stateManager.js)中[getWordDetails](file:///Users/tantan/code/LinguaSubs/js/api.js#L109-L131)函数未导入的问题
  - 优化了电影列表渲染逻辑，增加对UUID格式的检查

## [v1.2.1] - 2025-09-07

### 改进功能
- **首页布局调整**: 
  - 将示例影片区域移至页面顶部
  - 将上传字幕功能移至页面底部
  - 优化了首页信息层级结构

## [v1.2.0] - 2025-09-07

### 新增功能
- **个人媒体库**: 用户现在可以上传自己的SRT字幕文件并保存学习进度
- **导出功能**: 支持将单词列表导出为CSV格式文件
- **加载指示器**: 添加了加载状态指示器，提升用户体验
- **键盘快捷键**: 实现了完整的键盘快捷键支持
- **快捷键帮助面板**: 添加了快捷键帮助面板，方便用户查看
- **移动端优化**: 改进了移动端用户体验，添加了面板切换功能

### 改进功能
- **视觉设计优化**: 
  - 强化了信息层级，优化了字体大小和粗细
  - 改进了颜色方案，为不同熟练度添加了视觉标识
  - 优化了间距和布局设计
- **设置面板**: 
  - 完善了设置面板功能
  - 添加了词频过滤、熟练度标签自定义等功能
- **用户体验**: 
  - 添加了消息提示系统
  - 优化了错误处理
  - 改进了响应式设计

### 技术优化
- **性能优化**: 
  - 实现了API缓存机制
  - 添加了预加载技术
  - 优化了状态管理
- **代码结构**: 
  - 重构了部分JavaScript代码
  - 优化了CSS样式组织

## [v1.1.0] - 2025-09-06

### 新增功能
- **SRS复习模式**: 实现了基于间隔重复算法的智能复习系统
- **熟练度标记**: 添加了单词熟练度标记功能
- **词典API集成**: 集成了Free Dictionary API获取单词详细信息
- **设置面板**: 实现了基本设置功能

### 改进功能
- **UI优化**: 
  - 优化了视觉设计和信息层级
  - 改进了按钮和面板样式
- **交互优化**: 
  - 优化了单词详情展示
  - 改进了熟练度标记交互

## [v1.0.0] - 2025-09-05

### 核心功能
- **项目初始化**: 搭建了LinguaSubs基础项目结构
- **SRT解析**: 实现了SRT字幕文件解析功能
- **词汇提取**: 完成了核心词汇提取算法
- **学习界面**: 实现了基本的学习界面和交互功能