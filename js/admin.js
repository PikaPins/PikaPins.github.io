document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const authSection = document.getElementById('authSection');
    const repoInfoSection = document.getElementById('repoInfoSection');
    const editorSection = document.getElementById('editorSection');
    const previewSection = document.getElementById('previewSection');
    
    const tokenInput = document.getElementById('tokenInput');
    const authButton = document.getElementById('authButton');
    
    const ownerInput = document.getElementById('ownerInput');
    const repoInput = document.getElementById('repoInput');
    const loadRepoButton = document.getElementById('loadRepoButton');
    
    const jsonEditor = document.getElementById('jsonEditor');
    const formatButton = document.getElementById('formatButton');
    const saveButton = document.getElementById('saveButton');
    const validationMessage = document.getElementById('validationMessage');
    
    const categoryTabs = document.getElementById('categoryTabs');
    const previewContainer = document.getElementById('previewContainer');
    const adminPikachu = document.getElementById('adminPikachu');
    
    // 存储GitHub令牌和仓库信息
    let githubToken = localStorage.getItem('githubToken') || '';
    let repoOwner = localStorage.getItem('repoOwner') || '';
    let repoName = localStorage.getItem('repoName') || '';
    let configData = null;
    let configSha = '';
    let currentCategory = null;
    
    // 初始化页面
    init();
    
    // 初始化函数
    function init() {
        // 如果已有令牌，自动填充并显示仓库信息部分
        if (githubToken) {
            tokenInput.value = '********'; // 不显示实际令牌
            showSection(repoInfoSection);
            
            // 如果已有仓库信息，自动填充并加载
            if (repoOwner && repoName) {
                ownerInput.value = repoOwner;
                repoInput.value = repoName;
                loadConfigFile();
            }
        }
        
        // 皮卡丘点击效果
        adminPikachu.addEventListener('click', () => {
            adminPikachu.classList.add('bounce-effect');
            setTimeout(() => {
                adminPikachu.classList.remove('bounce-effect');
            }, 1000);
            
            // 播放皮卡丘音效
            const audio = new Audio('https://www.myinstants.com/media/sounds/pikachu.mp3');
            audio.play();
        });
    }
    
    // 授权按钮点击事件
    authButton.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if (!token) {
            showToast('请输入GitHub令牌', 'error');
            return;
        }
        
        // 验证令牌
        fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('令牌无效或权限不足');
            }
            return response.json();
        })
        .then(data => {
            githubToken = token;
            localStorage.setItem('githubToken', token);
            showToast('授权成功！', 'success');
            showSection(repoInfoSection);
        })
        .catch(error => {
            showToast(`授权失败: ${error.message}`, 'error');
        });
    });
    
    // 加载仓库按钮点击事件
    loadRepoButton.addEventListener('click', () => {
        const owner = ownerInput.value.trim();
        const repo = repoInput.value.trim();
        
        if (!owner || !repo) {
            showToast('请输入GitHub用户名和仓库名', 'error');
            return;
        }
        
        repoOwner = owner;
        repoName = repo;
        localStorage.setItem('repoOwner', owner);
        localStorage.setItem('repoName', repo);
        
        loadConfigFile();
    });
    
    // 加载配置文件
    function loadConfigFile() {
        showToast('正在加载配置文件...', 'info');
        
        // 获取config.json文件
        fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/config.json`, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载配置文件，请检查仓库信息');
            }
            return response.json();
        })
        .then(data => {
            configSha = data.sha;
            // 修改这里：正确解码 base64 内容，处理 UTF-8 编码
            const content = decodeBase64UTF8(data.content);
            jsonEditor.value = formatJSON(content);
            configData = JSON.parse(content);
            
            showSection(editorSection);
            showSection(previewSection);
            renderPreview();
            
            showToast('配置文件加载成功！', 'success');
        })
        .catch(error => {
            showToast(`加载失败: ${error.message}`, 'error');
        });
    }
    
    // 格式化按钮点击事件
    formatButton.addEventListener('click', () => {
        try {
            const json = JSON.parse(jsonEditor.value);
            jsonEditor.value = JSON.stringify(json, null, 2);
            validateJSON(true);
        } catch (error) {
            showValidationError(error.message);
        }
    });
    
    // 保存按钮点击事件
    saveButton.addEventListener('click', () => {
        if (!validateJSON()) return;
        
        const newContent = jsonEditor.value;
        
        showToast('正在保存更改...', 'info');
        
        // 更新config.json文件
        fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/config.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '通过皮卡丘管理后台更新配置',
                content: encodeBase64UTF8(newContent),
                sha: configSha
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存失败，请检查您的权限');
            }
            return response.json();
        })
        .then(data => {
            configSha = data.content.sha;
            configData = JSON.parse(newContent);
            renderPreview();
            showToast('配置已成功保存！', 'success');
        })
        .catch(error => {
            showToast(`保存失败: ${error.message}`, 'error');
        });
    });
    
    // 验证JSON
    function validateJSON(silent = false) {
        try {
            const json = JSON.parse(jsonEditor.value);
            
            // 验证基本结构
            if (!json.categories || !Array.isArray(json.categories)) {
                throw new Error('配置必须包含categories数组');
            }
            
            // 验证每个分类
            json.categories.forEach((category, index) => {
                if (!category.id) throw new Error(`第${index+1}个分类缺少id字段`);
                if (!category.name) throw new Error(`第${index+1}个分类缺少name字段`);
                if (!category.resources || !Array.isArray(category.resources)) {
                    throw new Error(`第${index+1}个分类缺少resources数组`);
                }
                
                // 验证每个资源
                category.resources.forEach((resource, resIndex) => {
                    if (!resource.name) throw new Error(`${category.name}分类中第${resIndex+1}个资源缺少name字段`);
                    if (!resource.url) throw new Error(`${category.name}分类中第${resIndex+1}个资源缺少url字段`);
                });
            });
            
            if (!silent) {
                showValidationSuccess('JSON格式有效');
            }
            return true;
        } catch (error) {
            if (!silent) {
                showValidationError(error.message);
            }
            return false;
        }
    }
    
    // 显示验证错误
    function showValidationError(message) {
        validationMessage.textContent = `错误: ${message}`;
        validationMessage.className = 'error';
    }
    
    // 显示验证成功
    function showValidationSuccess(message) {
        validationMessage.textContent = message;
        validationMessage.className = 'success';
    }
    
    // 格式化JSON
    function formatJSON(jsonString) {
        try {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch (e) {
            return jsonString;
        }
    }
    
    // 渲染预览
    function renderPreview() {
        if (!configData) return;
        
        // 渲染分类标签
        categoryTabs.innerHTML = '';
        configData.categories.forEach(category => {
            const tab = document.createElement('div');
            tab.className = `category-tab ${category.id === currentCategory ? 'active' : ''}`;
            tab.dataset.id = category.id;
            tab.innerHTML = `${category.icon || ''} ${category.name}`;
            
            tab.addEventListener('click', () => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = category.id;
                renderResourceCards(category);
            });
            
            categoryTabs.appendChild(tab);
        });
        
        // 默认显示第一个分类
        if (configData.categories.length > 0) {
            currentCategory = currentCategory || configData.categories[0].id;
            const category = configData.categories.find(c => c.id === currentCategory) || configData.categories[0];
            document.querySelector(`.category-tab[data-id="${category.id}"]`)?.classList.add('active');
            renderResourceCards(category);
        }
    }
    
    // 渲染资源卡片
    function renderResourceCards(category) {
        previewContainer.innerHTML = '';
        
        if (!category.resources || category.resources.length === 0) {
            previewContainer.innerHTML = '<div class="no-resources">该分类下暂无资源</div>';
            return;
        }
        
        category.resources.forEach(resource => {
            const card = document.createElement('div');
            card.className = 'resource-card';
            card.innerHTML = `
                <div class="card-content">
                    <h3 class="card-title">${resource.name}</h3>
                    <p class="card-description">${resource.description || ''}</p>
                    <div class="card-tags">
                        ${(resource.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <a href="${resource.url}" class="card-link" target="_blank">访问网站</a>
                </div>
            `;
            
            previewContainer.appendChild(card);
        });
    }
    
    // 显示指定部分
    function showSection(section) {
        section.style.display = 'block';
    }
    
    // 显示提示框
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // 监听编辑器内容变化
    jsonEditor.addEventListener('input', () => {
        validationMessage.style.display = 'none';
    });
});

// 添加这些新函数来正确处理 UTF-8 编码的 base64 内容
function decodeBase64UTF8(base64) {
    try {
        const binary = atob(base64.replace(/\s/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error('Base64解码失败:', e);
        return atob(base64);
    }
}

function encodeBase64UTF8(str) {
    try {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.error('Base64编码失败:', e);
        return btoa(str);
    }
}