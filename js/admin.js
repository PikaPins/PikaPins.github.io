// 管理后台脚本
let token = '';
let configData = null;
let owner = '';
let repo = '';
let sha = '';

document.addEventListener('DOMContentLoaded', function() {
    // 初始化授权按钮
    const authButton = document.getElementById('authButton');
    authButton.addEventListener('click', authenticate);
    
    // 初始化加载仓库按钮
    const loadRepoButton = document.getElementById('loadRepoButton');
    loadRepoButton.addEventListener('click', loadRepo);
    
    // 初始化格式化和保存按钮
    const formatButton = document.getElementById('formatButton');
    formatButton.addEventListener('click', formatJSON);
    
    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', saveChanges);
    
    // 初始化选项卡切换
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // 初始化新建类别按钮
    const newCategoryButton = document.getElementById('newCategoryButton');
    newCategoryButton.addEventListener('click', function() {
        document.getElementById('newCategoryForm').style.display = 'block';
        document.getElementById('resourceForm').style.display = 'none';
    });
    
    // 初始化取消新建类别按钮
    const cancelCategoryButton = document.getElementById('cancelCategoryButton');
    cancelCategoryButton.addEventListener('click', function() {
        document.getElementById('newCategoryForm').style.display = 'none';
        document.getElementById('resourceForm').style.display = 'block';
        resetCategoryForm();
    });
    
    // 初始化添加类别按钮
    const addCategoryButton = document.getElementById('addCategoryButton');
    addCategoryButton.addEventListener('click', addNewCategory);
    
    // 初始化添加资源按钮
    const addResourceButton = document.getElementById('addResourceButton');
    addResourceButton.addEventListener('click', addNewResource);
    
    // 初始化重置表单按钮
    const resetFormButton = document.getElementById('resetFormButton');
    resetFormButton.addEventListener('click', resetResourceForm);
    
    // 初始化保存更改到GitHub按钮
    const saveChangesButton = document.getElementById('saveChangesButton');
    saveChangesButton.addEventListener('click', saveChanges);
    
    // 检查本地存储中是否有令牌
    const storedToken = localStorage.getItem('githubToken');
    if (storedToken) {
        document.getElementById('tokenInput').value = storedToken;
        token = storedToken;
        showSection('repoInfoSection');
    }
});

// 切换选项卡
function switchTab(tabName) {
    // 更新选项卡按钮状态
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 更新选项卡面板状态
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
        if (panel.id === tabName + 'Panel') {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}

// 授权函数
function authenticate() {
    const tokenInput = document.getElementById('tokenInput');
    token = tokenInput.value.trim();
    
    if (!token) {
        showToast('请输入GitHub访问令牌', 'error');
        return;
    }
    
    // 测试令牌是否有效
    fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('授权失败');
        }
        return response.json();
    })
    .then(data => {
        showToast('授权成功！', 'success');
        localStorage.setItem('githubToken', token);
        showSection('repoInfoSection');
    })
    .catch(error => {
        showToast('授权失败：' + error.message, 'error');
    });
}

// 加载仓库
function loadRepo() {
    owner = document.getElementById('ownerInput').value.trim();
    repo = document.getElementById('repoInput').value.trim();
    
    if (!owner || !repo) {
        showToast('请输入GitHub用户名和仓库名', 'error');
        return;
    }
    
    // 获取config.json文件
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents/config.json`, {
        headers: {
            'Authorization': `token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('无法加载config.json文件');
        }
        return response.json();
    })
    .then(data => {
        sha = data.sha;
        // 修复中文乱码问题：正确解码Base64内容
        const content = decodeURIComponent(escape(atob(data.content)));
        configData = JSON.parse(content);
        
        // 填充JSON编辑器
        document.getElementById('jsonEditor').value = JSON.stringify(configData, null, 2);
        
        // 填充类别选择器
        populateCategorySelect();
        
        // 显示管理和预览部分
        showSection('managementSection');
        showSection('previewSection');
        
        // 生成预览
        generatePreview();
        
        showToast('仓库加载成功！', 'success');
    })
    .catch(error => {
        showToast('加载失败：' + error.message, 'error');
    });
}

// 填充类别选择器
function populateCategorySelect() {
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '';
    
    configData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.icon} ${category.name}`;
        categorySelect.appendChild(option);
    });
}

// 添加新类别
function addNewCategory() {
    const categoryId = document.getElementById('categoryId').value.trim();
    const categoryName = document.getElementById('categoryName').value.trim();
    const categoryIcon = document.getElementById('categoryIcon').value.trim();
    
    if (!categoryId || !categoryName || !categoryIcon) {
        showToast('请填写所有类别信息', 'error');
        return;
    }
    
    // 检查ID是否已存在
    const existingCategory = configData.categories.find(cat => cat.id === categoryId);
    if (existingCategory) {
        showToast('类别ID已存在', 'error');
        return;
    }
    
    // 创建新类别
    const newCategory = {
        id: categoryId,
        name: categoryName,
        icon: categoryIcon,
        resources: []
    };
    
    // 添加到配置数据
    configData.categories.push(newCategory);
    
    // 更新JSON编辑器
    document.getElementById('jsonEditor').value = JSON.stringify(configData, null, 2);
    
    // 更新类别选择器
    populateCategorySelect();
    
    // 更新预览
    generatePreview();
    
    // 重置表单并隐藏
    resetCategoryForm();
    document.getElementById('newCategoryForm').style.display = 'none';
    document.getElementById('resourceForm').style.display = 'block';
    
    // 选择新创建的类别
    document.getElementById('categorySelect').value = categoryId;
    
    showToast('类别添加成功！', 'success');
}

// 添加新资源
function addNewResource() {
    const categoryId = document.getElementById('categorySelect').value;
    const resourceName = document.getElementById('resourceName').value.trim();
    const resourceDescription = document.getElementById('resourceDescription').value.trim();
    const resourceUrl = document.getElementById('resourceUrl').value.trim();
    const resourceTags = document.getElementById('resourceTags').value.trim();
    
    if (!categoryId || !resourceName || !resourceDescription || !resourceUrl) {
        showToast('请填写所有必要的资源信息', 'error');
        return;
    }
    
    // 解析标签
    const tags = resourceTags ? resourceTags.split(',').map(tag => tag.trim()) : [];
    
    // 创建新资源
    const newResource = {
        name: resourceName,
        description: resourceDescription,
        url: resourceUrl,
        tags: tags
    };
    
    // 找到对应的类别
    const category = configData.categories.find(cat => cat.id === categoryId);
    if (category) {
        // 添加资源到类别
        category.resources.push(newResource);
        
        // 更新JSON编辑器
        document.getElementById('jsonEditor').value = JSON.stringify(configData, null, 2);
        
        // 更新预览
        generatePreview();
        
        // 重置表单
        resetResourceForm();
        
        showToast('资源添加成功！', 'success');
    } else {
        showToast('找不到选定的类别', 'error');
    }
}

// 重置类别表单
function resetCategoryForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = '';
}

// 重置资源表单
function resetResourceForm() {
    document.getElementById('resourceName').value = '';
    document.getElementById('resourceDescription').value = '';
    document.getElementById('resourceUrl').value = '';
    document.getElementById('resourceTags').value = '';
}

// 格式化JSON
function formatJSON() {
    try {
        const jsonEditor = document.getElementById('jsonEditor');
        const jsonData = JSON.parse(jsonEditor.value);
        jsonEditor.value = JSON.stringify(jsonData, null, 2);
        document.getElementById('validationMessage').textContent = '格式化成功！';
        document.getElementById('validationMessage').className = 'success';
    } catch (error) {
        document.getElementById('validationMessage').textContent = '无效的JSON: ' + error.message;
        document.getElementById('validationMessage').className = 'error';
    }
}

// 保存更改
function saveChanges() {
    try {
        // 验证JSON
        const jsonEditor = document.getElementById('jsonEditor');
        configData = JSON.parse(jsonEditor.value);
        
        // 准备提交数据 - 修复中文编码问题
        const jsonString = JSON.stringify(configData, null, 2);
        const content = btoa(unescape(encodeURIComponent(jsonString)));
        
        // 提交到GitHub
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/config.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '更新资源配置',
                content: content,
                sha: sha
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存失败');
            }
            return response.json();
        })
        .then(data => {
            sha = data.content.sha;
            showToast('保存成功！', 'success');
            
            // 更新预览
            generatePreview();
        })
        .catch(error => {
            showToast('保存失败：' + error.message, 'error');
        });
    } catch (error) {
        showToast('无效的JSON: ' + error.message, 'error');
    }
}

// 生成预览
function generatePreview() {
    const categoryTabs = document.getElementById('categoryTabs');
    const previewContainer = document.getElementById('previewContainer');
    
    // 清空现有内容
    categoryTabs.innerHTML = '';
    previewContainer.innerHTML = '';
    
    // 生成类别选项卡
    configData.categories.forEach((category, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = 'category-tab' + (index === 0 ? ' active' : '');
        tabButton.setAttribute('data-category', category.id);
        tabButton.innerHTML = `${category.icon} ${category.name}`;
        tabButton.addEventListener('click', function() {
            // 切换选项卡
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应的资源
            showCategoryResources(category.id);
        });
        
        categoryTabs.appendChild(tabButton);
    });
    
    // 显示第一个类别的资源
    if (configData.categories.length > 0) {
        showCategoryResources(configData.categories[0].id);
    }
}

// 显示类别资源
function showCategoryResources(categoryId) {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';
    
    const category = configData.categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    category.resources.forEach(resource => {
        const resourceCard = document.createElement('div');
        resourceCard.className = 'resource-card';
        
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        
        const cardTitle = document.createElement('h3');
        cardTitle.className = 'card-title';
        cardTitle.textContent = resource.name;
        
        const cardDescription = document.createElement('p');
        cardDescription.className = 'card-description';
        cardDescription.textContent = resource.description;
        
        const cardTags = document.createElement('div');
        cardTags.className = 'card-tags';
        
        resource.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            cardTags.appendChild(tagSpan);
        });
        
        const cardLink = document.createElement('a');
        cardLink.className = 'card-link';
        cardLink.href = resource.url;
        cardLink.target = '_blank';
        cardLink.textContent = '访问网站';
        
        cardContent.appendChild(cardTitle);
        cardContent.appendChild(cardDescription);
        cardContent.appendChild(cardTags);
        cardContent.appendChild(cardLink);
        
        resourceCard.appendChild(cardContent);
        previewContainer.appendChild(resourceCard);
    });
}

// 显示指定部分
function showSection(sectionId) {
    document.getElementById(sectionId).style.display = 'block';
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3000);
}