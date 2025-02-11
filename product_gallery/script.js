import productData from '../data/product_data.js';

// 创建图片查看器
function createImageViewer(images, currentIndex = 0) {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    
    function updateViewer() {
        viewer.innerHTML = `
            <img src="${images[currentIndex]}" alt="详情图片">
            <button class="nav-button prev-button" ${currentIndex === 0 ? 'disabled' : ''}>
                &#10094;
            </button>
            <button class="nav-button next-button" ${currentIndex === images.length - 1 ? 'disabled' : ''}>
                &#10095;
            </button>
            <button class="close-viewer">×</button>
            <div class="image-counter">${currentIndex + 1} / ${images.length}</div>
        `;
        
        // 添加事件监听
        viewer.querySelector('.prev-button').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateViewer();
            }
        });
        
        viewer.querySelector('.next-button').addEventListener('click', () => {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                updateViewer();
            }
        });
        
        viewer.querySelector('.close-viewer').addEventListener('click', () => {
            viewer.remove();
        });
    }
    
    // 键盘事件监听
    function handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowLeft':
                if (currentIndex > 0) {
                    currentIndex--;
                    updateViewer();
                }
                break;
            case 'ArrowRight':
                if (currentIndex < images.length - 1) {
                    currentIndex++;
                    updateViewer();
                }
                break;
            case 'Escape':
                viewer.remove();
                document.removeEventListener('keydown', handleKeyPress);
                break;
        }
    }
    
    document.addEventListener('keydown', handleKeyPress);
    
    // 点击背景关闭
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) {
            viewer.remove();
            document.removeEventListener('keydown', handleKeyPress);
        }
    });
    
    updateViewer();
    return viewer;
}

// 渲染产品卡片
function renderProducts() {
    const gallery = document.querySelector('.product-gallery');
    
    // 清除现有内容
    while (gallery.firstChild) {
        gallery.removeChild(gallery.firstChild);
    }
    
    // 计算可用高度
    const header = document.querySelector('.header');
    const availableHeight = window.innerHeight - header.offsetHeight - 60; // 60px是gallery的margin-top
    
    // 获取当前列数
    const columnCount = window.innerWidth > 1024 ? 3 : (window.innerWidth > 640 ? 2 : 1);
    
    // 按置顶和日期降序排序
    const sortedProducts = [...productData].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    // 创建列容器
    const columns = Array.from({ length: columnCount }, () => {
        const column = document.createElement('div');
        column.className = 'product-column';
        gallery.appendChild(column);
        return column;
    });
    
    // 渲染产品卡片
    sortedProducts.forEach((product, index) => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.productId = product.id;
        
        productItem.innerHTML = `
            <img src="${product.coverImage}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
        `;
        
        // 添加点击事件
        productItem.addEventListener('click', (event) => openProductDetail(product, event));
        
        // 对于前N个项目（N=列数），检查高度并决定放置位置
        if (index < columnCount) {
            const column = columns[index];
            const columnHeight = Array.from(column.children).reduce((height, child) => 
                height + child.offsetHeight + 24, 0); // 24px是margin-bottom
            
            if (columnHeight + productItem.offsetHeight > availableHeight) {
                // 如果超出可用高度，放到下一列
                const nextColumn = columns[(index + 1) % columnCount];
                nextColumn.appendChild(productItem);
            } else {
                column.appendChild(productItem);
            }
        } else {
            // 后续项目按最短列放置
            const shortestColumn = columns.reduce((shortest, current) => 
                current.offsetHeight < shortest.offsetHeight ? current : shortest, columns[0]);
            shortestColumn.appendChild(productItem);
        }
    });
    
    // 添加说明文字区域到最短列
    const captionSection = document.createElement('div');
    captionSection.className = 'caption-section';
    captionSection.innerHTML = `
        <p class="caption">"临东""临东服务器"及其相关的各类组织、品牌均为虚构，其本体基于一个《我的世界》基岩版（Minecraft Bedrock Edition）服务器。</p>
        <p class="caption">网站部分代码使用AI生成，部分图标来自<a href="https://www.icons8.com/">Icons8</a>。</p>
    `;
    
    const shortestColumn = columns.reduce((shortest, current) => 
        current.offsetHeight < shortest.offsetHeight ? current : shortest, columns[0]);
    shortestColumn.appendChild(captionSection);
}

// 打开产品详情
async function openProductDetail(product, event) {
    // 创建详情弹窗
    const modal = document.createElement('div');
    modal.className = 'product-modal';
    
    // 确保 detailImages 包含 coverImage 作为第一张图片
    const images = [product.coverImage];
    if (product.detailImages) {
        product.detailImages.forEach(img => {
            if (img !== product.coverImage) {
                images.push(img);
            }
        });
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-button">×</button>
            <div class="content-wrapper">
                <h2>${product.title}</h2>
                <p class="detail-description">${product.description}</p>
                <p class="detail-date">发布时间：${formatDate(product.date)}</p>
                <div class="detail-images">
                    ${images.map((img, index) => 
                        `<img src="${img}" alt="${product.title}" loading="lazy" data-index="${index}">`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 获取点击的卡片和模态框内容元素
    const clickedItem = event.currentTarget;
    const modalContent = modal.querySelector('.modal-content');
    
    // 获取卡片的位置和尺寸
    const itemRect = clickedItem.getBoundingClientRect();
    
    // 设置初始位置和尺寸
    modalContent.style.position = 'fixed';
    modalContent.style.top = `${itemRect.top}px`;
    modalContent.style.left = `${itemRect.left}px`;
    modalContent.style.width = `${itemRect.width}px`;
    modalContent.style.height = `${itemRect.height}px`;
    modalContent.style.margin = '0';
    
    // 触发重排
    void modalContent.offsetHeight;
    
    // 添加active类开始动画
    requestAnimationFrame(() => {
        modal.classList.add('active');
        modalContent.classList.add('active');
        modalContent.style.position = '';
        modalContent.style.top = '';
        modalContent.style.left = '';
        modalContent.style.width = '';
        modalContent.style.height = '';
        modalContent.style.margin = '';
    });
    
    // 为所有图片添加点击事件
    modal.querySelectorAll('.detail-images img').forEach(img => {
        img.addEventListener('click', () => {
            const index = parseInt(img.dataset.index);
            const viewer = createImageViewer(images, index);
            document.body.appendChild(viewer);
        });
    });
    
    // 添加关闭事件
    function closeModal() {
        const modalContent = modal.querySelector('.modal-content');
        modal.classList.remove('active');
        modalContent.classList.remove('active');
        
        // 等待动画完成后移除元素
        setTimeout(() => {
            modal.remove();
            document.removeEventListener('keydown', handleEscKey);
        }, 300);
    }
    
    modal.querySelector('.close-button').addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 添加ESC键关闭
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
    
    document.addEventListener('keydown', handleEscKey);
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月';
}

// 页面加载完成后渲染产品
document.addEventListener('DOMContentLoaded', renderProducts);

// 监听窗口大小变化，重新布局
window.addEventListener('resize', debounce(renderProducts, 250));

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function createProductItem(product) {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.setAttribute('data-id', product.id);

    const img = new Image();
    img.src = product.coverImage;
    img.alt = product.title;
    img.onload = () => {
        // 图片加载完成后重新计算布局
        updateLayout();
    };

    const title = document.createElement('h3');
    title.textContent = product.title;

    const description = document.createElement('p');
    description.textContent = product.description;

    item.appendChild(img);
    item.appendChild(title);
    item.appendChild(description);

    return item;
}

function updateLayout() {
    const columns = document.querySelectorAll('.product-column');
    if (!columns.length) return;

    // 获取所有列的高度
    const columnHeights = Array.from(columns).map(col => col.offsetHeight);
    
    // 找出最短的列
    const minHeight = Math.min(...columnHeights);
    const shortestColumnIndex = columnHeights.indexOf(minHeight);
    
    // 找出最高的列
    const maxHeight = Math.max(...columnHeights);
    
    // 如果列高差异超过一定阈值（例如一个产品项的平均高度），则重新分配产品项
    if (maxHeight - minHeight > 100) {
        const allItems = Array.from(document.querySelectorAll('.product-item'));
        columns.forEach(col => col.innerHTML = '');
        
        // 重新分配产品项
        allItems.forEach((item, index) => {
            const targetColumn = columns[index % columns.length];
            targetColumn.appendChild(item);
        });
    }
}

// 监听窗口大小变化
window.addEventListener('resize', debounce(updateLayout, 250));

// 搜索功能
function initSearch() {
    // 使用已存在的搜索按钮
    const searchButton = document.getElementById('search-button');
    if (!searchButton) {
        console.warn('Search button not found');
        return;
    }

    // 创建搜索容器
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div class="search-box">
            <div class="search-input-container">
                <input type="text" class="search-input" placeholder="搜索周边或设计…">
                <button class="search-close">×</button>
            </div>
            <div class="search-results"></div>
        </div>
    `;
    document.body.appendChild(searchContainer);

    // 获取搜索框元素
    const searchInput = searchContainer.querySelector('.search-input');
    const searchResults = searchContainer.querySelector('.search-results');
    const closeButton = searchContainer.querySelector('.search-close');

    // 打开搜索框
    function openSearch() {
        searchContainer.classList.add('active');
        searchInput.focus();
    }

    // 关闭搜索框
    function closeSearch() {
        searchContainer.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    }

    // 搜索函数
    function performSearch(query) {
        if (!query.trim()) {
            searchResults.innerHTML = '';
            return;
        }

        const results = productData.filter(product => {
            const searchText = `${product.title} ${product.description} ${product.date}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item"><p>未找到相关内容</p></div>';
            return;
        }

        searchResults.innerHTML = results.map(product => {
            const highlightedTitle = highlightText(product.title, query);
            const highlightedDesc = highlightText(product.description, query);
            return `
                <div class="search-result-item" data-product-id="${product.id}">
                    <h4>${highlightedTitle}</h4>
                    <p>${highlightedDesc}</p>
                </div>
            `;
        }).join('');

        // 为搜索结果添加点击事件
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.dataset.productId;
                const productElement = document.querySelector(`.product-item[data-product-id="${productId}"]`);
                if (productElement) {
                    closeSearch();
                    productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 添加高亮效果
                    productElement.style.animation = 'highlight 2s';
                }
            });
        });
    }

    // 高亮搜索文本
    function highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-result-highlight">$1</span>');
    }

    // 添加事件监听
    searchButton.addEventListener('click', openSearch);
    closeButton.addEventListener('click', closeSearch);
    searchContainer.addEventListener('click', (e) => {
        if (e.target === searchContainer) {
            closeSearch();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
            closeSearch();
        }
    });

    // 添加搜索输入防抖
    searchInput.addEventListener('input', debounce((e) => {
        performSearch(e.target.value);
    }, 300));
}

// 添加高亮动画
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { background-color: rgba(44, 150, 120, 0.2); }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化搜索功能
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    initSearch();
});
