document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const categoryList = document.getElementById('categoryList');
    const resourceGrid = document.getElementById('resourceGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const pikachuImg = document.getElementById('pikachu');
    
    // 存储所有分类和资源
    let categories = [];
    let currentCategory = null;
    let allResources = [];
    
    // 加载配置文件
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            categories = data.categories;
            
            // 提取所有资源用于搜索
            categories.forEach(category => {
                category.resources.forEach(resource => {
                    allResources.push({
                        ...resource,
                        categoryId: category.id,
                        categoryName: category.name
                    });
                });
            });
            
            // 渲染分类列表
            renderCategories();
            
            // 默认显示第一个分类的资源
            if (categories.length > 0) {
                showCategoryResources(categories[0].id);
            }
        })
        .catch(error => {
            console.error('加载配置文件失败:', error);
            resourceGrid.innerHTML = `
                <div class="error-message">
                    <p>加载资源失败，请稍后再试。</p>
                    <p>错误详情: ${error.message}</p>
                </div>
            `;
        });
    
    // 渲染分类列表
    function renderCategories() {
        categoryList.innerHTML = '';
        
        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = `category-item ${category.id === currentCategory ? 'active' : ''}`;
            categoryItem.dataset.id = category.id;
            categoryItem.innerHTML = `
                <span class="category-icon">${category.icon}</span>
                <span class="category-name">${category.name}</span>
            `;
            
            categoryItem.addEventListener('click', () => {
                showCategoryResources(category.id);
            });
            
            categoryList.appendChild(categoryItem);
        });
    }
    
    // 显示指定分类的资源
    function showCategoryResources(categoryId) {
        currentCategory = categoryId;
        
        // 更新分类列表的激活状态
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === categoryId);
        });
        
        // 查找当前分类
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        // 渲染资源卡片
        renderResources(category.resources);
    }
    
    // 渲染资源卡片
    function renderResources(resources) {
        resourceGrid.innerHTML = '';
        
        if (resources.length === 0) {
            resourceGrid.innerHTML = '<div class="no-results">没有找到相关资源</div>';
            return;
        }
        
        resources.forEach(resource => {
            const card = document.createElement('div');
            card.className = 'resource-card';
            card.innerHTML = `
                <div class="card-content">
                    <h3 class="card-title">${resource.name}</h3>
                    <p class="card-description">${resource.description}</p>
                    <div class="card-tags">
                        ${resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <a href="${resource.url}" class="card-link" target="_blank">访问网站</a>
                </div>
            `;
            
            resourceGrid.appendChild(card);
        });
    }
    
    // 搜索功能
    function searchResources(query) {
        if (!query.trim()) {
            // 如果搜索框为空，显示当前分类的所有资源
            if (currentCategory) {
                const category = categories.find(cat => cat.id === currentCategory);
                if (category) {
                    renderResources(category.resources);
                }
            }
            return;
        }
        
        // 搜索所有资源
        const normalizedQuery = query.toLowerCase().trim();
        const results = allResources.filter(resource => {
            return resource.name.toLowerCase().includes(normalizedQuery) ||
                   resource.description.toLowerCase().includes(normalizedQuery) ||
                   resource.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
        });
        
        renderResources(results);
    }
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', () => {
        searchResources(searchInput.value);
    });
    
    // 搜索框回车事件
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchResources(searchInput.value);
        }
    });
    
    // 皮卡丘点击效果
    pikachuImg.addEventListener('click', () => {
        pikachuImg.classList.add('bounce-effect');
        setTimeout(() => {
            pikachuImg.classList.remove('bounce-effect');
        }, 1000);
        
        // 播放皮卡丘音效
        const audio = new Audio('https://www.myinstants.com/media/sounds/pikachu.mp3');
        audio.play();
    });
});