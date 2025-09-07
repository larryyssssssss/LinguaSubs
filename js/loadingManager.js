/**
 * 全局加载状态管理器
 * 用于统一管理应用中的加载状态和进度指示
 */

// 全局加载状态
let globalLoadingCount = 0;
let loadingIndicator = null;
let loadingMessage = null;

/**
 * 显示全局加载指示器
 * @param {string} message - 加载消息
 */
function showGlobalLoading(message = '正在加载中...') {
    // 增加加载计数
    globalLoadingCount++;
    
    // 获取或创建加载指示器元素
    if (!loadingIndicator) {
        loadingIndicator = document.getElementById('global-loading-indicator');
        if (!loadingIndicator) {
            // 创建全局加载指示器
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'global-loading-indicator';
            loadingIndicator.className = 'global-loading-indicator hidden';
            loadingIndicator.innerHTML = `
                <div class="global-loading-content">
                    <div class="global-spinner"></div>
                    <div class="global-loading-text">${message}</div>
                </div>
            `;
            document.body.appendChild(loadingIndicator);
            loadingMessage = loadingIndicator.querySelector('.global-loading-text');
        }
    }
    
    // 更新消息
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
    
    // 显示加载指示器
    loadingIndicator.classList.remove('hidden');
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 隐藏全局加载指示器
 */
function hideGlobalLoading() {
    // 减少加载计数
    globalLoadingCount = Math.max(0, globalLoadingCount - 1);
    
    // 只有当所有加载都完成时才隐藏指示器
    if (globalLoadingCount === 0 && loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        // 恢复页面滚动
        document.body.style.overflow = '';
    }
}

/**
 * 检查是否正在加载
 * @returns {boolean} 是否正在加载
 */
function isLoading() {
    return globalLoadingCount > 0;
}

/**
 * 重置加载状态
 */
function resetLoading() {
    globalLoadingCount = 0;
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// 导出函数
export { showGlobalLoading, hideGlobalLoading, isLoading, resetLoading };