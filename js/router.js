/**
 * 前端路由管理模块
 * 基于window.location.hash实现简单的前端路由
 */

import { showHomePage, enterStudyMode } from './main.js';
import { setState } from './stateManager.js';

/**
 * 路由配置
 */
const routes = {
    '': 'home',           // 默认路由 - 首页
    '/': 'home',          // 首页
    '/study': 'study',    // 学习界面
};

/**
 * 解析当前URL hash
 * @returns {Object} 解析后的路由信息
 */
function parseHash() {
    const hash = window.location.hash.replace('#', '') || '';
    
    // 检查是否是学习页面路由
    if (hash.startsWith('/study/')) {
        const movieId = hash.substring(7); // 提取电影ID
        return {
            route: 'study',
            params: { movieId }
        };
    }
    
    // 检查是否是其他路由
    const route = routes[hash] || 'home';
    return {
        route: route,
        params: {}
    };
}

/**
 * 导航到指定路由
 * @param {string} path 路由路径
 */
function navigateTo(path) {
    window.location.hash = path;
}

/**
 * 处理路由变化
 */
async function handleRouteChange() {
    const { route, params } = parseHash();
    
    switch (route) {
        case 'home':
            // 显示首页
            showHomePage();
            break;
            
        case 'study':
            // 处理学习页面路由
            if (params.movieId) {
                // 进入学习模式
                await enterStudyMode(params.movieId);
            } else {
                // 如果没有电影ID，返回首页
                navigateTo('/');
            }
            break;
            
        default:
            // 默认返回首页
            navigateTo('/');
            break;
    }
}

/**
 * 初始化路由
 */
function initRouter() {
    // 监听hash变化
    window.addEventListener('hashchange', handleRouteChange);
    
    // 处理初始路由
    handleRouteChange();
}

// 导出函数
export { navigateTo, initRouter };