// 欢迎动画功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取欢迎动画元素
    const welcomeAnimation = document.getElementById('welcomeAnimation');
    
    // 检查用户是否是首次访问
    const isFirstVisit = !localStorage.getItem('hasVisited');
    
    // 如果是首次访问，显示欢迎动画
    if (isFirstVisit) {
        // 设置已访问标记
        localStorage.setItem('hasVisited', 'true');
        
        // 显示欢迎动画
        welcomeAnimation.classList.add('show');
        
        // 播放皮卡丘音效（可选）
        try {
            const audio = new Audio('sounds/pikachu-welcome.mp3');
            audio.volume = 0.5; // 设置音量为50%
            audio.play();
        } catch (error) {
            console.log('无法播放音频:', error);
        }
        
        // 2.5秒后自动隐藏欢迎动画
        setTimeout(function() {
            welcomeAnimation.classList.add('hide');
            
            // 动画结束后移除元素
            setTimeout(function() {
                welcomeAnimation.style.display = 'none';
            }, 500); // 等待淡出动画完成
        }, 2500);
    } else {
        // 非首次访问，直接隐藏欢迎动画
        welcomeAnimation.style.display = 'none';
    }
});