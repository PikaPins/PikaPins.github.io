// 打赏功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const donateButton = document.getElementById('donateButton');
    const donateModal = document.getElementById('donateModal');
    const thankModal = document.getElementById('thankModal');
    const donateTabs = document.querySelectorAll('.donate-tab');
    const qrcodeContainers = document.querySelectorAll('.qrcode-container');
    const donateCompleteButton = document.getElementById('donateCompleteButton');
    const closeButtons = document.querySelectorAll('.close-button');
    const closeThankButton = document.querySelector('.close-thank-button');
    
    // 打开打赏模态框
    donateButton.addEventListener('click', function() {
        donateModal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            donateModal.querySelector('.modal-content').style.opacity = '1';
            donateModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
    });
    
    // 切换支付方式选项卡
    donateTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有选项卡的活动状态
            donateTabs.forEach(t => t.classList.remove('active'));
            // 添加当前选项卡的活动状态
            this.classList.add('active');
            
            // 获取选项卡对应的二维码容器
            const tabId = this.getAttribute('data-tab');
            
            // 隐藏所有二维码容器
            qrcodeContainers.forEach(container => {
                container.classList.remove('active');
            });
            
            // 显示当前选项卡对应的二维码容器
            document.getElementById(`${tabId}-qrcode`).classList.add('active');
        });
    });
    
    // 完成打赏按钮点击事件
    donateCompleteButton.addEventListener('click', function() {
        // 关闭打赏模态框
        donateModal.style.display = 'none';
        
        // 显示感谢模态框
        thankModal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            thankModal.querySelector('.modal-content').style.opacity = '1';
            thankModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        
        // 播放皮卡丘音效
        const audio = new Audio('https://www.myinstants.com/media/sounds/pikachu-happy.mp3');
        audio.play().catch(e => console.log('无法播放音频:', e));
    });
    
    // 关闭按钮点击事件
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前模态框
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // 关闭感谢模态框按钮点击事件
    closeThankButton.addEventListener('click', function() {
        thankModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', function(event) {
        if (event.target === donateModal) {
            donateModal.style.display = 'none';
        }
        if (event.target === thankModal) {
            thankModal.style.display = 'none';
        }
    });
});