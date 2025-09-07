// 模拟电影数据
// 使用UUID格式的ID以兼容Supabase
const movies = [
    { 
        id: '11111111-1111-1111-1111-111111111111', // 使用UUID格式的ID
        title: '盗梦空间', 
        posterUrl: 'assets/Inception.2010.Bluray.1080p.DTS-HD.x264-Grym.英文.png', 
        srtPath: 'data/Inception.2010.Bluray.1080p.DTS-HD.x264-Grym.英文.srt' 
    }
    // 其他电影暂时注释掉，因为我们只有盗梦空间的资源
    // { 
    //     id: '22222222-2222-2222-2222-222222222222', 
    //     title: '心灵奇旅', 
    //     posterUrl: 'assets/soul.jpg', 
    //     srtPath: 'data/soul.srt' 
    // },
    // {
    //     id: '33333333-3333-3333-3333-333333333333',
    //     title: '星际穿越',
    //     posterUrl: 'assets/interstellar.jpg',
    //     srtPath: 'data/interstellar.srt'
    // },
    // {
    //     id: '44444444-4444-4444-4444-444444444444',
    //     title: '玩具总动员',
    //     posterUrl: 'assets/toy-story.jpg',
    //     srtPath: 'data/toy-story.srt'
    // }
];

// 确保导出movies数组
window.movies = movies;

// 同时使用ES6模块导出
export { movies };