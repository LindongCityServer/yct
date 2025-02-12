// 导入内容数据
import { contentData } from './data/content_data.js';

// 由于数据文件使用 const 声明，我们需要在这里重新导入并处理它们
let metroLines, tramLines, localRailways;

// 异步加载数据文件
async function loadTransportData() {
    try {
        // 加载地铁数据
        const metroResponse = await fetch('data/metro_data.js');
        const metroText = await metroResponse.text();
        // 提取 lines 变量的值
        const metroMatch = metroText.match(/const\s+lines\s*=\s*(\[[\s\S]*?\]);/);
        if (metroMatch) {
            metroLines = eval(metroMatch[1]);
        }

        // 加载有轨电车数据
        const tramResponse = await fetch('data/tram_data.js');
        const tramText = await tramResponse.text();
        // 提取 tramLines 变量的值
        const tramMatch = tramText.match(/export\s+const\s+tramLines\s*=\s*(\[[\s\S]*?\]);/);
        if (tramMatch) {
            tramLines = eval(tramMatch[1]);
        }

        // 加载专用线数据
        const localResponse = await fetch('data/local_railway_data.js');
        const localText = await localResponse.text();
        // 提取 localRailways 变量的值
        const localMatch = localText.match(/export\s+const\s+localRailways\s*=\s*(\[[\s\S]*?\]);/);
        if (localMatch) {
            localRailways = eval(localMatch[1]);
        }
    } catch (error) {
        console.error('加载交通数据失败:', error);
    }
}

// 获取banner数据
const bannerData = contentData.filter(item => {
    // 检查是否设置了发布时间且未到发布时间
    if (item.releaseTime) {
        const releaseTime = new Date(item.releaseTime);
        const now = new Date();
        if (now < releaseTime) {
            return false;
        }
    }
    return item.showInBanner;
});

// 按发布日期倒序排列新闻数据
const filteredContentData = contentData.filter(item => {
    // 检查是否设置了发布时间且未到发布时间
    if (item.releaseTime) {
        const releaseTime = new Date(item.releaseTime);
        const now = new Date();
        if (now < releaseTime) {
            return false;
        }
    }
    return true;
});
filteredContentData.sort((a, b) => new Date(b.date) - new Date(a.date));

// 新闻内容加载函数
function loadNewsContent() {
    const newsContent = document.querySelector('.news-content');
    const historyNewsContent = document.querySelector('.history-news-content');
    const toggleHistoryBtn = document.querySelector('.toggle-history-btn');
    const newsTemplate = document.getElementById('news-item-template');
    
    // 先移除旧的事件监听器
    const newToggleBtn = toggleHistoryBtn.cloneNode(true);
    toggleHistoryBtn.parentNode.replaceChild(newToggleBtn, toggleHistoryBtn);
    
    // 获取当前日期
    const currentDate = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    // 分离最近和历史资讯
    const recentNews = [];
    const historyNews = [];
    
    filteredContentData.forEach(news => {
        const newsDate = new Date(news.date);
        const expireDate = news.expireDate ? new Date(news.expireDate) : null;
        const currentDate = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
        
        // 更新条件：如果新闻日期早于两个月前或过期日期早于今天，则推送到历史消息
        if (newsDate < twoMonthsAgo || (expireDate && expireDate < currentDate)) {
            historyNews.push(news);
        } else {
            recentNews.push(news);
        }
    });
    
    // 创建新闻项元素的函数
    function createNewsItem(news) {
        const template = newsTemplate.content.cloneNode(true);
        const newsItem = template.querySelector('.news-item');
        const isExpired = news.expireDate && new Date(news.expireDate) < new Date();
        
        if (isExpired) {
            newsItem.classList.add('expired');
        }
        
        // 设置新闻类别和日期
        newsItem.querySelector('.news-category').textContent = news.category;
        newsItem.querySelector('.news-date').textContent = news.date;
        
        // 设置过期标签
        const expiredTag = newsItem.querySelector('.expired-tag');
        if (isExpired) {
            expiredTag.style.display = 'inline';
        } else {
            expiredTag.style.display = 'none';
        }
        
        // 设置标题和链接
        const titleLink = newsItem.querySelector('.news-title a');
        titleLink.textContent = news.title;
        titleLink.title = news.title;
        if (news.link) {
            titleLink.href = news.link;
            titleLink.classList.remove('no-link');
        } else {
            titleLink.href = '#';
            titleLink.classList.add('no-link');
        }
        
        // 设置摘要
        newsItem.querySelector('.news-summary').textContent = news.summary;
        
        return newsItem;
    }
    
    // 更新最近新闻内容
    const recentContainer = document.createElement('div');
    recentContainer.className = 'filtered-news-content';
    recentNews.forEach(news => {
        recentContainer.appendChild(createNewsItem(news));
    });
    newsContent.innerHTML = '';
    newsContent.appendChild(recentContainer);
    
    // 更新历史新闻内容
    historyNewsContent.innerHTML = '';
    historyNews.forEach(news => {
        historyNewsContent.appendChild(createNewsItem(news));
    });
    
    // 添加历史资讯切换按钮事件
    newToggleBtn.addEventListener('click', function(e) {
        console.log('Toggle history button clicked'); // 添加调试日志
        if (historyNews.length === 0) {
            showToast('暂无历史资讯');
            return;
        }
        
        const isExpanded = this.classList.toggle('expanded');
        historyNewsContent.classList.toggle('hidden');
        
        // 更新按钮图标
        const img = this.querySelector('img');
        if (img) {
            img.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            img.alt = isExpanded ? '收起' : '历史资讯';
        }
        
        // 设置合适的最大高度以实现平滑动画
        if (isExpanded) {
            historyNewsContent.style.maxHeight = historyNewsContent.scrollHeight + 'px';
        } else {
            historyNewsContent.style.maxHeight = '0';
        }
    });
    
    // 添加无链接资讯的点击事件
    document.querySelectorAll('.no-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newsItem = link.closest('.news-item');
            
            // 如果是在历史资讯中且历史资讯是收起的，先展开历史资讯
            if (newsItem.closest('.history-news-content')) {
                const historyContent = newsItem.closest('.history-news-content');
                const toggleBtn = document.querySelector('.toggle-history-btn');
                if (historyContent.classList.contains('hidden')) {
                    toggleBtn.click();
                    // 等待展开动画完成后再滚动
                    setTimeout(() => {
                        scrollToNewsItem(newsItem);
                    }, 300);
                } else {
                    scrollToNewsItem(newsItem);
                }
            } else {
                scrollToNewsItem(newsItem);
            }
        });
    });
}

// 滚动到指定新闻项
function scrollToNewsItem(newsItem) {
    // 获取右侧内容区域
    const mainRight = document.querySelector('.main-right');
    
    // 获取新闻项相对于右侧内容区域的位置
    const newsItemTop = newsItem.offsetTop;
    const containerScrollTop = mainRight.scrollTop;
    const containerRect = mainRight.getBoundingClientRect();
    const newsItemRect = newsItem.getBoundingClientRect();
    
    // 计算目标滚动位置（考虑16px的上边距）
    const targetPosition = newsItemTop - 16;
    
    // 平滑滚动到目标位置
    mainRight.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
    
    // 添加高亮效果
    newsItem.style.backgroundColor = 'rgba(0, 121, 107, 0.05)';
    setTimeout(() => {
        newsItem.style.backgroundColor = '';
    }, 2000);
    
    // 显示提示
    showToast('已显示全部内容');
}

// 功能图标数据
const featureIcons = [
    { id: 'metro', name: '地铁线网', icon: 'UI/res/subway_black.png', link: '/metro_map' },
    { id: 'bus', name: '公交线路', icon: 'UI/res/gjxl_black.png', link: '/bus_routemap' },
    { id: 'train', name: '临途出行', icon: 'UI/res/ltcx_black.png', link: '/ltcx' },
    { id: 'ltcx_schedule', name: '客运大屏', icon: 'UI/res/kanban_black.png', link: '/ltcx_schedule' },
    { id: 'radar', name: '实时地图', icon: 'UI/res/track_black.png', link: 'http://mc.shangxiaoguan.top' },
    { id: 'map', name: '卫星地图', icon: 'UI/res/map_preview_black.png', link: 'http://map.shangxiaoguan.top' },
    { id: 'wiki', name: '服务器wiki', icon: 'UI/res/book_black.png', link: 'https://wiki.shangxiaoguan.top' },
    { id: 'faq', name: '常见问题', icon: 'UI/res/question_black.png', link: 'https://wiki.shangxiaoguan.top/雨城通常见问题' },
    { id: 'poi', name: '周边图鉴', icon: 'UI/res/gift_black.png', link: '/product_gallery' },
    { id: 'lab', name: '实验室', icon: 'UI/res/lab_black.png', link: '/data_composer' }
];

// DOM元素
const aboutBtn = document.querySelector('.about-btn');
const searchBtn = document.querySelector('.search-btn');
const searchPanel = document.querySelector('.search-panel');
const closeSearchBtn = document.querySelector('.close-search');
const searchInput = document.querySelector('.search-header input');
const searchResults = document.querySelector('.search-results');
const applyCardBtn = document.querySelector('.apply-card-btn');
const iconsContainer = document.querySelector('.icons-container');
const showAllBtn = document.querySelector('.show-all');
let isIconsExpanded = false;
let isTripListExpanded = false;  // 添加全局变量来跟踪行程列表的展开状态

// Banner轮播相关变量
let currentSlide = 0;
let autoplayInterval;
const carouselContainer = document.querySelector('.carousel-container');
const carouselIndicators = document.querySelector('.carousel-indicators');
const carouselTitle = document.querySelector('.carousel-title');

// 添加全局变量用于控制轮播图状态
let isTransitioning = false; // 是否正在进行切换动画

// 初始化功能图标
function initFeatureIcons() {
    // 移除现有的图标
    iconsContainer.innerHTML = '';
    
    if (isIconsExpanded) {
        // 展开状态：显示所有图标
        featureIcons.forEach(icon => {
            iconsContainer.appendChild(createIconElement(icon));
        });
        
        // 如果所有图标都能在一行显示，不显示切换按钮
        if (featureIcons.length <= 4) {
            return;
        }
        
        // 计算需要添加的占位符数量
        const totalItems = featureIcons.length;
        const lastRowItems = totalItems % 4;
        
        if (lastRowItems > 0) {
            // 添加占位符使切换按钮位于最后一行最右边
            const placeholdersNeeded = 4 - lastRowItems - 1;
            for (let i = 0; i < placeholdersNeeded; i++) {
                const placeholder = document.createElement('div');
                placeholder.className = 'icon-item placeholder';
                iconsContainer.appendChild(placeholder);
            }
        }
    } else {
        // 折叠状态：只显示前3个图标
        featureIcons.slice(0, 3).forEach(icon => {
            iconsContainer.appendChild(createIconElement(icon));
        });
    }
    
    // 添加切换按钮
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'icon-item toggle-icons';
    toggleDiv.innerHTML = `
        <img src="UI/res/expand_more_black.png" alt="${isIconsExpanded ? '收起' : '显示全部'}" 
             style="transform: ${isIconsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}">
        <span>${isIconsExpanded ? '收起' : '显示全部'}</span>
    `;
    toggleDiv.addEventListener('click', toggleIcons);
    iconsContainer.appendChild(toggleDiv);
}

// 切换图标显示状态
function toggleIcons() {
    isIconsExpanded = !isIconsExpanded;
    initFeatureIcons();
}

// 创建图标元素
function createIconElement(icon) {
    const div = document.createElement('div');
    div.className = 'icon-item';
    div.dataset.feature = icon.id;
    div.innerHTML = `
        <img src="${icon.icon}" alt="${icon.name}" class="themed-icon">
        <span>${icon.name}</span>
    `;
    
    // 添加点击事件
    div.addEventListener('click', () => {
        // 检查是否是未上线的功能
        /*if (['faq'].includes(icon.id)) {
            showToast('功能暂未上线');
            return;
        }*/
        
        if (icon.link.startsWith('http')) {
            window.open(icon.link, '_blank');
        } else {
            window.open(icon.link, '_blank');
        }
    });
    
    return div;
}

// 搜索功能
function handleSearch(query) {
    const results = [];
    const stationMap = new Map(); // 用于存储合并后的站点信息
    
    // 搜索地铁线路
    if (metroLines) {
        metroLines.forEach(line => {
            if (line.name.includes(query)) {
                results.push({
                    type: 'line',
                    mode: 'metro',
                    name: line.name,
                    displayName: `地铁${line.name}`,
                    color: line.color,
                    data: line
                });
            }
            
            // 搜索地铁车站
            line.stations.forEach(station => {
                if (station.name.includes(query)) {
                    if (!stationMap.has(station.name)) {
                        stationMap.set(station.name, {
                            type: 'station',
                            name: station.name,
                            lines: [],
                            fareZone: station.fareZone
                        });
                    }
                    const stationInfo = stationMap.get(station.name);
                    if (!stationInfo.lines.find(l => l.name === line.name)) {
                        stationInfo.lines.push({
                            name: line.name,
                            displayName: line.name,
                            color: line.color,
                            mode: 'metro'
                        });
                    }
                }
            });
        });
    }

    // 搜索有轨电车线路
    if (tramLines) {
        tramLines.forEach(line => {
            if (line.name.includes(query)) {
                results.push({
                    type: 'line',
                    mode: 'tram',
                    name: line.name,
                    displayName: `${line.name}`,
                    color: line.color,
                    data: line
                });
            }
            
            // 搜索有轨电车车站
            line.stations.forEach(station => {
                if (station.name.includes(query)) {
                    if (!stationMap.has(station.name)) {
                        stationMap.set(station.name, {
                            type: 'station',
                            name: station.name,
                            lines: [],
                            fareZone: station.fareZone || '有轨电车'
                        });
                    }
                    const stationInfo = stationMap.get(station.name);
                    if (!stationInfo.lines.find(l => l.name === line.name)) {
                        stationInfo.lines.push({
                            name: line.name,
                            displayName: `${line.name}`,
                            color: line.color,
                            mode: 'tram'
                        });
                    }
                }
            });
        });
    }

    // 搜索专用线路
    if (localRailways) {
        localRailways.forEach(line => {
            if (line.name.includes(query)) {
                results.push({
                    type: 'line',
                    mode: 'local',
                    name: line.name,
                    displayName: line.name,
                    color: '#A0522D', // 使用褐色作为专用线的默认颜色
                    data: line
                });
            }
            
            // 搜索专用线车站
            line.stations.forEach(station => {
                if (station.name.includes(query)) {
                    if (!stationMap.has(station.name)) {
                        stationMap.set(station.name, {
                            type: 'station',
                            name: station.name,
                            lines: [],
                            fareZone: '专用线'
                        });
                    }
                    const stationInfo = stationMap.get(station.name);
                    if (!stationInfo.lines.find(l => l.name === line.name)) {
                        stationInfo.lines.push({
                            name: line.name,
                            displayName: line.name,
                            color: '#A0522D', // 使用褐色作为专用线的默认颜色
                            mode: 'local'
                        });
                    }
                }
            });
        });
    }
    
    // 将合并后的站点信息添加到结果中
    stationMap.forEach(station => {
        results.push(station);
    });
    
    displaySearchResults(results);
}

// 显示搜索结果
function displaySearchResults(results) {
    searchResults.innerHTML = results.map(result => {
        if (result.type === 'line') {
            // 根据线路类型设置颜色和文本
            let baseColor, typeText;
            switch (result.mode) {
                case 'tram':
                    baseColor = '#E2023A';
                    typeText = '有轨';
                    break;
                case 'local':
                    baseColor = '#A0522D';
                    typeText = '专用线';
                    break;
                default: // metro
                    baseColor = '#008AED';
                    typeText = '地铁';
            }
            const style = `background-color: ${adjustColor(baseColor, 0.1)}; color: ${baseColor};`;
            return `
                <div class="search-result-item" data-type="${result.type}" data-name="${result.name}" data-mode="${result.mode}">
                    <div class="result-main">
                        <span class="line-title" style="${style}">${typeText}</span>
                        <strong>${result.name}</strong>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="search-result-item" data-type="${result.type}" data-name="${result.name}">
                    <div class="result-main">
                        <span class="fare-zone">${result.fareZone}</span>
                        <strong>${result.name}站</strong>
                    </div>
                    <div class="result-info">
                        <div class="line-list">
                            ${result.lines.map(line => {
                                const style = `background-color: ${adjustColor(line.color, 0.1)}; color: ${line.color};`;
                                return `<span class="line-title" style="${style}">${line.displayName}</span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    // 为每个搜索结果项添加点击事件
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const name = item.dataset.name;
            const mode = item.dataset.mode;
            if (type === 'station') {
                window.open(`https://wiki.shangxiaoguan.top/${encodeURIComponent(name)}站`, '_blank');
            } else if (type === 'line' && mode === 'metro') {
                window.open(`https://wiki.shangxiaoguan.top/临东地铁${name}`, '_blank');
            } else {
                window.open(`https://wiki.shangxiaoguan.top/${name}`, '_blank');
            }
        });
    });
}

// 调整颜色透明度的辅助函数
function adjustColor(color, opacity) {
    // 如果是 rgb 格式
    if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${opacity})`;
    }
    // 如果是 hex 格式
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 添加事件监听
document.addEventListener('DOMContentLoaded', async () => {
    // 首先加载交通数据
    await loadTransportData();
    
    initFeatureIcons();
    initCarousel();
    loadNewsContent();
    
    const wechatImage = document.getElementById('wechat-image');
    const newsSection = document.querySelector('.news');
    
    // 处理微信图标点击事件
    window.handleWechatClick = () => {
        const wechatLink = document.getElementById('wechat-link');
        const rect = wechatLink.getBoundingClientRect();
        wechatImage.style.top = `${rect.bottom + window.scrollY}px`;
        wechatImage.style.display = wechatImage.style.display === 'block' ? 'none' : 'block';
    };
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (wechatImage.style.display === 'block') {
            const rect = document.getElementById('wechat-link').getBoundingClientRect();
            wechatImage.style.top = `${rect.bottom + window.scrollY}px`;
        }
    });

    aboutBtn?.addEventListener('click', () =>{
        window.open('https://wiki.shangxiaoguan.top/%E9%9B%A8%E5%9F%8E%E9%80%9A');
    })
    
    // 搜索相关事件监听
    searchBtn?.addEventListener('click', () => {
        searchPanel.classList.remove('hidden');
    });
    
    closeSearchBtn?.addEventListener('click', () => {
        searchPanel.classList.add('hidden');
    });
    
    searchInput?.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    
    // 添加乘车按钮事件监听
    document.querySelector('.header-apply-card-btn')?.addEventListener('click', handleApplyCard);
    document.querySelector('.apply-card-btn')?.addEventListener('click', handleApplyCard);
    
});

// 申请刷卡
function handleApplyCard() {
    navigator.clipboard.writeText('/tag @s add yct-ready')
        .then(() => {
            showToast('已复制指令到剪贴板，请在服务器中粘贴');
        })
        .catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请到服务器手动输入指令：/tag @s add yct-ready');
        });
}

// 显示Toast提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 初始化轮播图
function initCarousel() {
    // 如果没有轮播内容，直接返回
    if (!bannerData || bannerData.length === 0) {
        return;
    }
    
    // 设置轮播图容器的宽高比
    function updateCarouselAspectRatio() {
        const containerWidth = carouselContainer.offsetWidth;
        const minRatio = 1.5;  // 3:2 = 1.5:1
        const maxRatio = 2.35; // 最宽的情况
        
        // 计算当前容器的实际宽高比
        const containerHeight = carouselContainer.offsetHeight;
        const currentRatio = containerWidth / containerHeight;
        
        // 如果当前比例超出范围，则调整到边界值
        let targetRatio = currentRatio;
        if (currentRatio > maxRatio) {
            targetRatio = maxRatio;
        } else if (currentRatio < minRatio) {
            targetRatio = minRatio;
        }
        
        // 根据目标比例设置高度
        const height = containerWidth / targetRatio;
        carouselContainer.style.height = `${height}px`;
    }
    
    // 创建轮播内容
    carouselContainer.innerHTML = bannerData.map((banner, index) => {
        const hasImage = banner.image && banner.image.trim() !== '';
        const isColorCode = hasImage && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(banner.image);
        
        return `
            <div class="carousel-slide${(!hasImage || isColorCode) ? ' no-image' : ''}" 
                 data-index="${index}"
                 ${isColorCode ? `style="background-color: ${banner.image};"` : ''}>
                ${hasImage && !isColorCode ? `
                    <img src="${banner.image}" alt="${banner.title}" onerror="this.parentElement.classList.add('no-image')">
                    <div class="carousel-title">${banner.title}</div>
                ` : `
                    <div class="carousel-title">${banner.title}</div>
                `}
            </div>
        `;
    }).join('');

    // 初始设置宽高比
    updateCarouselAspectRatio();
    
    // 在窗口大小改变时更新宽高比
    window.addEventListener('resize', () => {
        updateCarouselAspectRatio();
    });

    // 创建指示器
    carouselIndicators.innerHTML = bannerData.map((_, index) => `
        <div class="carousel-indicator${index === 0 ? ' active' : ''}" data-index="${index}"></div>
    `).join('');

    // 添加点击事件
    carouselContainer.addEventListener('click', (e) => {
        const clickedSlide = e.target.closest('.carousel-slide');
        if (!clickedSlide) return;
        
        const slideIndex = parseInt(clickedSlide.dataset.index);
        const banner = bannerData[slideIndex];
        
        if (!banner.link || banner.link.trim() === '') {
            // 在新闻列表中查找对应的新闻项
            const newsItem = document.querySelector(`.news-item .news-title a[title="${banner.title}"]`)?.closest('.news-item');
            if (newsItem) {
                // 如果是在历史资讯中且历史资讯是收起的，先展开历史资讯
                if (newsItem.closest('.history-news-content')) {
                    const historyContent = newsItem.closest('.history-news-content');
                    const toggleBtn = document.querySelector('.toggle-history-btn');
                    if (historyContent.classList.contains('hidden')) {
                        toggleBtn.click();
                        // 等待展开动画完成后再滚动
                        setTimeout(() => {
                            scrollToNewsItem(newsItem);
                        }, 300);
                    } else {
                        scrollToNewsItem(newsItem);
                    }
                } else {
                    scrollToNewsItem(newsItem);
                }
            }
        } else if (banner.link.startsWith('http')) {
            window.open(banner.link, '_blank');
        } else {
            window.open(banner.link, '_blank');
        }
    });

    // 添加指示器点击事件
    carouselIndicators.addEventListener('click', (e) => {
        const indicator = e.target.closest('.carousel-indicator');
        if (indicator) {
            const index = parseInt(indicator.dataset.index);
            goToSlide(index);
        }
    });

    // 添加触摸事件
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    let touchStartTime = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
        if (isTransitioning) return;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        isSwiping = true;
        // 触摸开始时暂停自动播放
        clearInterval(autoplayInterval);
    }, { passive: true });

    carouselContainer.addEventListener('touchmove', (e) => {
        if (!isSwiping || isTransitioning) return;
        touchEndX = e.touches[0].clientX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', () => {
        if (!isSwiping || isTransitioning) return;
        
        const touchEndTime = Date.now();
        const timeDiff = touchEndTime - touchStartTime;
        const difference = touchStartX - touchEndX;
        
        // 添加速度检测，防止快速滑动触发多次
        if (Math.abs(difference) > 50 && timeDiff > 100) { // 最小滑动距离且最小时间间隔
            if (difference > 0) {
                // 向左滑动
                goToSlide((currentSlide + 1) % bannerData.length);
            } else {
                // 向右滑动
                goToSlide(currentSlide === 0 ? bannerData.length - 1 : currentSlide - 1);
            }
        } else {
            // 如果滑动距离不够或速度太快，重新开始自动播放
            startAutoplay();
        }
        
        isSwiping = false;
    });

    // 添加滚轮事件
    let wheelTimeout;
    let lastWheelTime = 0;
    const WHEEL_DELAY = 500; // 滚轮事件的最小间隔时间（毫秒）
    
    document.querySelector('.banner-carousel').addEventListener('wheel', (e) => {
        e.preventDefault(); // 防止页面滚动
        
        if (isTransitioning) return;
        
        const now = Date.now();
        if (now - lastWheelTime < WHEEL_DELAY) return;
        
        // 清除之前的定时器
        clearTimeout(wheelTimeout);
        
        // 设置新的定时器，防止滚动过快
        wheelTimeout = setTimeout(() => {
            if (e.deltaY > 0) {
                // 向下滚动，显示下一张
                goToSlide((currentSlide + 1) % bannerData.length);
            } else {
                // 向上滚动，显示上一张
                goToSlide(currentSlide === 0 ? bannerData.length - 1 : currentSlide - 1);
            }
            lastWheelTime = now;
        }, 50); // 50ms 的防抖
    }, { passive: false });

    // 启动自动播放（只在有多张幻灯片时启动）
    if (bannerData.length > 1) {
        startAutoplay();
    }
    
    // 当页面不可见时暂停自动播放
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(autoplayInterval);
        } else {
            startAutoplay();
        }
    });
}

// 切换到指定幻灯片
function goToSlide(index) {
    // 如果正在切换中，则不执行新的切换
    if (isTransitioning) return;
    
    // 清除之前的自动播放
    clearInterval(autoplayInterval);
    
    // 设置切换状态
    isTransitioning = true;
    
    // 移除之前幻灯片的active类
    const slides = carouselContainer.querySelectorAll('.carousel-slide');
    slides.forEach(slide => slide.classList.remove('active'));
    
    currentSlide = index;
    carouselContainer.style.transform = `translateX(-${index * 100}%)`;
    
    // 添加新幻灯片的active类
    setTimeout(() => {
        slides[index].classList.add('active');
        // 动画完成后解除锁定
        setTimeout(() => {
            isTransitioning = false;
        }, 500); // 与CSS过渡时间相匹配
    }, 50);
    
    updateIndicators();
    
    // 重新开始自动播放
    startAutoplay();
}

// 更新指示器状态
function updateIndicators() {
    const indicators = carouselIndicators.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

// 开始自动播放
function startAutoplay() {
    // 确保清除之前的定时器
    clearInterval(autoplayInterval);
    
    // 只有当有多于一张幻灯片时才启动自动播放
    if (bannerData.length > 1) {
        autoplayInterval = setInterval(() => {
            const nextSlide = (currentSlide + 1) % bannerData.length;
            goToSlide(nextSlide);
        }, 5000); // 每5秒切换一次
    }
}

// 重置自动播放
function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
}

// 在窗口大小改变时重新计算图标显示
let resizeTimeout;
let wasSmallScreen = window.innerWidth <= 639; // 记录之前是否是小屏模式

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const isSmallScreen = window.innerWidth <= 639;
        
        // 如果从小屏切换到大屏
        if (wasSmallScreen && !isSmallScreen) {
            // 滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        wasSmallScreen = isSmallScreen;
        initFeatureIcons();
    }, 100);
});

// 服务器状态
let motdHistory = []; // 存储最近的 MOTD 记录
let currentScrollText = ''; // 当前滚动的文本
let fixedText = ''; // 存储固定文本
let hasScrollingContent = false; // 标记是否已识别到滚动内容
let lastMotdUpdate = 0; // 记录上次更新MOTD的时间
let lastMotd = ''; // 存储上一次的 MOTD
let firstMotd = ''; // 存储第一条 MOTD

// 颜色映射表
const minecraftColorMap = {
    '0': 'color: var(--text-color-0)',
    '1': 'color: var(--text-color-1)',
    '2': 'color: var(--text-color-2)',
    '3': 'color: var(--text-color-3)',
    '4': 'color: var(--text-color-4)',
    '5': 'color: var(--text-color-5)',
    '6': 'color: var(--text-color-6)',
    '7': 'color: var(--text-color-7)',
    '8': 'color: var(--text-color-8)',
    '9': 'color: var(--text-color-9)',
    'a': 'color: var(--text-color-a)',
    'b': 'color: var(--text-color-b)',
    'c': 'color: var(--text-color-c)',
    'd': 'color: var(--text-color-d)',
    'e': 'color: var(--text-color-e)',
    'f': 'color: var(--text-color-f)',
    'g': 'color: var(--text-color-g)',
    'h': 'color: var(--text-color-h)',
    'i': 'color: var(--text-color-i)',
    'j': 'color: var(--text-color-j)',
    'k': 'color: var(--text-color-k)',
    'l': 'font-weight: bold;', // 粗体
    'm': 'color: var(--text-color-m)',
    'n': 'color: var(--text-color-n)',
    'o': 'font-style: italic;', // 斜体
    'p': 'color: var(--text-color-p)',
    'q': 'color: var(--text-color-q)',
    'r': 'color: inherit; font-weight: normal; text-decoration: none; font-style: normal;', // 重置所有格式
    's': 'color: var(--text-color-s)',
    't': 'color: var(--text-color-t)',
    'u': 'color: var(--text-color-u)',
    'v': 'color: var(--text-color-v)'
};

// 将 Minecraft 颜色代码转换为 HTML 颜色代码
function convertMinecraftColors(text) {
    let html = '';
    let currentStyle = '';
    let buffer = '';

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '§' && i + 1 < text.length) {
            const code = text[i + 1];
            if (minecraftColorMap[code]) {
                if (buffer) {
                    html += `<span style="${currentStyle}">${buffer}</span>`;
                    buffer = '';
                }
                if (code === 'r') {
                    currentStyle = '';
                } else {
                    currentStyle += minecraftColorMap[code] + ' ';
                }
                i++; // Skip the next character as it's part of the color code
            } else {
                buffer += text[i];
            }
        } else {
            buffer += text[i];
        }
    }

    if (buffer) {
        html += `<span style="${currentStyle}">${buffer}</span>`;
    }

    return html;
}

async function updateServerStatus() {
    // 检查必需的元素
    const requiredElements = {
        statusIndicator: document.querySelector('.status-indicator'),
        serverPlayers: document.querySelector('.server-players'),
        serverVersion: document.querySelector('.server-version')
    };

    // 可选元素
    const optionalElements = {
        serverMotd: document.querySelector('.server-motd')
    };

    // 检查是否有缺失的必需元素
    const missingRequired = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingRequired.length > 0) {
        // 只在第一次检查时输出警告
        if (!window.hasLoggedMissingElements) {
            console.warn('Missing required server status elements:', missingRequired.join(', '));
            window.hasLoggedMissingElements = true;
        }
        return;
    }

    const SERVER_ADDRESS = 'ld.cmsy.xyz';
    const SERVER_PORT = '19132';
    const API_URL = 'https://wiki.shangxiaoguan.top/api.php';

    try {
        // 简化请求，移除可能导致问题的选项
        const response = await fetch(`${API_URL}?action=lindongrequest&address=${SERVER_ADDRESS}&port=${SERVER_PORT}&format=json`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 尝试解析 JSON
        const data = await response.json();

        // 检查响应数据结构
        if (!data || !data.lindongrequest) {
            throw new Error('Invalid response format');
        }

        const serverData = data.lindongrequest;

        if (serverData.status === 'online') {
            // 更新状态指示器
            requiredElements.statusIndicator.classList.remove('offline');
            requiredElements.statusIndicator.classList.add('online');

            // 更新在线人数
            requiredElements.serverPlayers.textContent = `${serverData.online}/${serverData.max}`;

            // 更新服务器信息
            if (optionalElements.serverMotd) {
                optionalElements.serverMotd.innerHTML = convertMinecraftColors(serverData.motd);
            }
            requiredElements.serverVersion.textContent = `游戏版本：${serverData.version} | 延迟：${serverData.delay}ms`;
        } else {
            throw new Error('Server offline');
        }
    } catch (error) {
        // 详细的错误日志
        console.error('服务器状态获取失败:', {
            error: error.message,
            type: error.name,
            stack: error.stack
        });

        // 显示错误状态
        requiredElements.statusIndicator.classList.remove('online');
        requiredElements.statusIndicator.classList.add('offline');
        requiredElements.serverPlayers.textContent = '离线';
        if (optionalElements.serverMotd) {
            optionalElements.serverMotd.textContent = '服务器当前不可用';
        }
        requiredElements.serverVersion.textContent = '';
    }
}

// 定期更新服务器状态（每5秒更新一次）
function initServerStatus() {
    // 检查是否存在服务器状态容器
    const serverStatusContainer = document.querySelector('.server-status');
    if (!serverStatusContainer) {
        console.warn('Server status container not found, skipping status updates');
        return;
    }

    // 添加重试机制
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒

    async function updateWithRetry() {
        try {
            await updateServerStatus();
            retryCount = 0; // 重置重试计数
        } catch (error) {
            console.error(`Update failed (attempt ${retryCount + 1}/${maxRetries}):`, error);
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(updateWithRetry, retryDelay);
            }
        }
    }

    updateWithRetry(); // 立即更新一次
    setInterval(updateWithRetry, 5000); // 每5秒更新一次
}

// 初始化服务器状态
document.addEventListener('DOMContentLoaded', () => {
    initServerStatus();
});

// 从localStorage获取行程信息
function getTripsFromStorage() {
    try {
        // 确保正确读取数据
        const savedOrders = localStorage.getItem('orders');
        console.log('Raw orders from localStorage:', savedOrders); // 调试日志
        
        let orders = [];
        try {
            orders = savedOrders ? JSON.parse(savedOrders) : [];
        } catch (e) {
            console.error('解析orders数据失败:', e);
            return [];
        }
        
        if (!Array.isArray(orders)) {
            console.error('Invalid orders data format');
            return [];
        }
        
        console.log('所有订单数据:', orders);
        
        // 按时间正序排序
        return orders.sort((a, b) => {
            const [yearA, monthA, dayA] = a.date.split('-').map(Number);
            const [hoursA, minutesA] = a.route.time.split(':').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
            
            const [yearB, monthB, dayB] = b.date.split('-').map(Number);
            const [hoursB, minutesB] = b.route.time.split(':').map(Number);
            const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
            
            return dateA - dateB;
        });
        
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
}

// 获取交通方式对应的图标
function getTransportIcon(type) {
    switch (type) {
        case 'metro':
            return 'UI/res/subway_black.png';
        default:
            return 'UI/res/bus_black.png';
    }
}

// 格式化时间
function formatTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    // 获取日期的0点时间用于比较
    const dateStart = new Date(year, month - 1, day);
    
    // 格式化日期部分
    let formattedDate = '';
    if (dateStart.getTime() === dayBeforeYesterday.getTime()) {
        formattedDate = '前天';
    } else if (dateStart.getTime() === yesterday.getTime()) {
        formattedDate = '昨天';
    } else if (dateStart.getTime() === today.getTime()) {
        formattedDate = '今天';
    } else if (dateStart.getTime() === tomorrow.getTime()) {
        // 对于0-3点的车次，在20点后显示"稍后"
        if (hours >= 0 && hours <= 3 && now.getHours() >= 20) {
            formattedDate = '稍后';
        } else {
            formattedDate = '明天';
        }
    } else if (dateStart.getTime() === dayAfterTomorrow.getTime()) {
        formattedDate = '后天';
    } else {
        formattedDate = `${month}月${day}日`;
    }

    // 处理0-3点车次的候车提示
    let waitingNote = '';
    if (hours >= 0 && hours <= 3) {
        const tripDate = new Date(year, month - 1, day);
        const prevDate = new Date(year, month - 1, day);
        prevDate.setDate(prevDate.getDate() - 1);
        
        // 如果是今天或已经过去的行程，不显示候车提示
        if (tripDate > now) {
            if (formattedDate === '明天' || formattedDate === '稍后') {
                if (now.getHours() >= 20) {
                    formattedDate = '稍后';
                    waitingNote = '(今晚候车)';
                } else {
                    waitingNote = '(今晚候车)';
                }
            } else if (formattedDate === '后天') {
                waitingNote = '(明晚候车)';
            } else {
                waitingNote = `(${prevDate.getMonth() + 1}月${prevDate.getDate()}日晚候车)`;
            }
        }
    }
    
    return `${formattedDate} ${timeStr}${waitingNote}`;
}

// 渲染行程函数
function renderTrip(trip, now) {
    const [year, month, day] = trip.date.split('-').map(Number);
    const [hours, minutes] = trip.route.time.split(':').map(Number);
    const orderDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // 根据订单状态设置显示
    let statusText, statusClass;
    if (trip.status === 'completed') {
        statusText = '已完成';
        statusClass = 'completed';
    } else if (trip.type === 'metro') {
        if (orderDateTime <= now || trip.status === 'ongoing') {
            statusText = trip.status === 'ongoing' ? '进行中' : '未出行';
            statusClass = 'ongoing';  // 地铁行程到时间或已进站就显示为ongoing
        } else {
            statusText = '未出行';
            statusClass = 'upcoming';
        }
    } else {
        if (orderDateTime <= now) {
            statusText = '进行中';
            statusClass = 'ongoing';
        } else {
            statusText = '未出行';
            statusClass = 'upcoming';
        }
    }
    
    // 获取行程ID
    const tripId = trip.id;
    
    // 处理线路显示文本
    const lineText = trip.route.id ? `${trip.route.id}次` : trip.route.line;
    
    // 根据状态和类型决定显示的按钮
    let actionButton;
    if (trip.type === 'metro') {
        // 地铁行程的特殊处理
        if (trip.status === 'completed') {
            actionButton = `
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    <span>删除</span>
                </button>
            `;
        } else if (trip.status === 'ongoing') {
            actionButton = `
                <button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/logout_black.png" alt="标记出站">
                    <span>标记</span>
                    <span>出站</span>
                </button>
            `;
        } else {
            actionButton = `
                <button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/enter_black.png" alt="标记进站">
                    <span>标记</span>
                    <span>进站</span>
                </button>
            `;
        }
    } else {
        // 其他行程的原有处理逻辑
        if (statusClass === 'ongoing') {
            actionButton = `
                <button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/check_black.png" alt="标记完成">
                    <span>标记</span>
                    <span>完成</span>
                </button>
            `;
        } else if (statusClass === 'completed') {
            actionButton = `
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    <span>删除</span>
                </button>
            `;
        } else {
            actionButton = `
                <button class="view-code-btn" onclick="event.stopPropagation(); window.open('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${trip.lines}', '_blank')">
                    <img src="UI/res/qr_code_black.png" alt="查看乘车码">
                    <span>乘车码</span>
                </button>
            `;
        }
    }
    
    return `
        <div class="trip-item ${statusClass}" data-type="${trip.type}" onclick="if('${trip.type}' === 'metro') { localStorage.setItem('metroTransferQuery', '${tripId}'); window.location.href='/metro_map'; } else { window.location.href='/ltcx#${trip.lines}' }">
            <div class="trip-left">
                <img src="${getTransportIcon(trip.type)}" alt="交通工具" class="trip-icon">
                <span class="trip-status ${statusClass}">${statusText}</span>
                ${actionButton}
            </div>
            <div class="trip-details">
                <div class="trip-route">
                    <span class="trip-station" title="${trip.route.departure}">${trip.route.departure}</span>
                    <span class="trip-arrow">→</span>
                    <span class="trip-station" title="${trip.route.arrival}">${trip.route.arrival}</span>
                </div>
                <div class="trip-info-row">
                    <span class="trip-time">${formatTime(trip.date, trip.route.time)}</span>
                    <span class="trip-line" title="${lineText}">${lineText}</span>
                </div>
                <div class="trip-company" title="临途出行·${trip.route.company}">
                    ${trip.type !== 'metro' ? '临途出行·' : ''}${trip.route.company}
                </div>
            </div>
        </div>
    `;
}

// 处理行程完成标记
window.handleTripComplete = function(tripId) {
    const savedOrders = localStorage.getItem('orders');
    if (!savedOrders) return;
    
    try {
        const orders = JSON.parse(savedOrders);
        const updatedOrders = orders.map(order => {
            if (order.id === tripId) {
                // 如果是地铁行程，根据当前状态决定新状态
                if (order.type === 'metro') {
                    const newStatus = order.status === 'upcoming' ? 'ongoing' : 
                                    order.status === 'ongoing' ? 'completed' : 
                                    order.status;
                    return { ...order, status: newStatus };
                } else {
                    return { ...order, status: 'completed' };
                }
            }
            return order;
        });
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // 根据行程类型和状态显示不同的提示
        const trip = updatedOrders.find(order => order.id === tripId);
        if (trip && trip.type === 'metro') {
            const statusText = trip.status === 'ongoing' ? '已标记为进站' : 
                             trip.status === 'completed' ? '已标记为出站' : '';
            showToast(statusText);
        } else {
            showToast('已标记为完成');
        }
        
        // 重新加载行程信息以更新显示
        loadTripInfo();
    } catch (error) {
        console.error('更新行程状态失败:', error);
        showToast('操作失败，请重试');
    }
};

// 处理行程删除
window.handleTripDelete = function(tripId) {
    const savedOrders = localStorage.getItem('orders');
    if (!savedOrders) {
        console.log('No orders found in localStorage');
        return;
    }
    
    try {
        const orders = JSON.parse(savedOrders);
        console.log('Before deletion:', orders);
        console.log('Deleting trip with ID:', tripId);
        
        // 在删除前先确认是否存在该行程
        const tripExists = orders.some(order => order.id === tripId);
        if (!tripExists) {
            console.log('Trip not found:', tripId);
            showToast('删除失败：未找到行程');
            return;
        }
        
        // 确保使用严格相等进行比较
        const updatedOrders = orders.filter(order => order.id !== tripId);
        console.log('After deletion:', updatedOrders);
        
        if (orders.length === updatedOrders.length) {
            console.log('No trip was deleted');
            showToast('删除失败：未能删除行程');
            return;
        }
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log('Successfully updated localStorage');
        
        showToast('已删除行程');
        loadTripInfo(); // 重新加载行程信息
    } catch (error) {
        console.error('删除行程失败:', error);
        console.error('Error details:', error.message);
        showToast('操作失败，请重试');
    }
};

// 加载行程信息
function loadTripInfo() {
    const tripSection = document.querySelector('.trip-info');
    const tripContent = document.querySelector('.trip-content');
    const moreLink = document.querySelector('.trip-info .more-link');
    
    if (!tripSection || !tripContent || !moreLink) {
        console.warn('Trip info elements not found');
        return;
    }
    
    // 获取并记录行程数据
    const trips = getTripsFromStorage();
    console.log('Loaded trips:', trips);
    
    if (trips.length === 0) {
        // 隐藏整个行程信息模块
        tripSection.style.display = 'none';
        return;
    }
    
    // 显示行程信息模块
    tripSection.style.display = 'flex';
    
    // 获取当前时间
    const now = new Date();
    
    // 找到最近的进行中和未来行程
    let ongoingTrip = null;
    let upcomingTrip = null;
    
    // 统计未完成订单数量
    let pendingTrips = 0;
    
    // 按时间排序所有行程
    const sortedTrips = trips.sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split('-').map(Number);
        const [hoursA, minutesA] = a.route.time.split(':').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        
        const [yearB, monthB, dayB] = b.date.split('-').map(Number);
        const [hoursB, minutesB] = b.route.time.split(':').map(Number);
        const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        
        return dateA - dateB;
    });
    
    // 遍历排序后的行程
    for (const trip of sortedTrips) {
        const [year, month, day] = trip.date.split('-').map(Number);
        const [hours, minutes] = trip.route.time.split(':').map(Number);
        const tripDateTime = new Date(year, month - 1, day, hours, minutes);
        
        if (trip.status !== 'completed') {
            if (tripDateTime <= now) {
                // 找到最近的进行中行程
                if (!ongoingTrip) ongoingTrip = trip;
                pendingTrips++; // 将进行中的行程也计入未完成数量
            } else {
                // 找到最近的未来行程
                if (!upcomingTrip) upcomingTrip = trip;
                pendingTrips++; // 未来行程计入未完成数量
            }
        }
    }
    
    // 如果有未完成订单，显示圆点提示
    if (pendingTrips > 0) {
        const tripTitle = document.querySelector('.trip-info .trip-header h3');
        if (tripTitle) {
            tripTitle.innerHTML = `本机行程 <span class="pending-count">${pendingTrips}</span>`;
        }
    }
    
    // 更新行程显示
    function updateTripDisplay() {
        if (!isTripListExpanded) {
            let tripsToShow = [];
            if (ongoingTrip) tripsToShow.push(ongoingTrip);
            if (upcomingTrip) tripsToShow.push(upcomingTrip);
            tripContent.innerHTML = tripsToShow.map(trip => renderTrip(trip, now)).join('');
        } else {
            // 分离不同状态的行程
            const ongoingTrips = [];
            const upcomingTrips = [];
            const completedTrips = [];
            
            sortedTrips.forEach(trip => {
                const [year, month, day] = trip.date.split('-').map(Number);
                const [hours, minutes] = trip.route.time.split(':').map(Number);
                const tripDateTime = new Date(year, month - 1, day, hours, minutes);
                
                if (trip.status === 'completed') {
                    completedTrips.push(trip);
                } else if (tripDateTime <= now) {
                    ongoingTrips.push(trip);
                } else {
                    upcomingTrips.push(trip);
                }
            });
            
            // 对已完成行程按时间倒序排序
            completedTrips.sort((a, b) => {
                const [yearA, monthA, dayA] = a.date.split('-').map(Number);
                const [hoursA, minutesA] = a.route.time.split(':').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
                
                const [yearB, monthB, dayB] = b.date.split('-').map(Number);
                const [hoursB, minutesB] = b.route.time.split(':').map(Number);
                const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
                
                return dateB - dateA;  // 倒序排列
            });
            
            // 组合所有行程：进行中 + 未出行 + 已完成
            const orderedTrips = [...ongoingTrips, ...upcomingTrips, ...completedTrips];
            tripContent.innerHTML = orderedTrips.map(trip => renderTrip(trip, now)).join('');
        }
        
        // 更新更多行程按钮的显示
        moreLink.innerHTML = `
            <span>${isTripListExpanded ? '收起' : '显示全部'}</span>
            <img src="UI/res/expand_more_black.png" alt="${isTripListExpanded ? '收起' : '显示全部'}" style="transform: rotate(${isTripListExpanded ? '180deg' : '0'})">
        `;
        
        // 检查 tripContent 是否为空，并调整 display 属性
        if (tripContent.innerHTML.trim() === '') {
            tripContent.style.display = 'none';
        } else {
            tripContent.style.display = 'flex';
        }
    }
    
    // 初始显示
    updateTripDisplay();
    
    // 添加更多行程按钮的点击事件
    moreLink.onclick = (e) => {
        e.preventDefault();
        isTripListExpanded = !isTripListExpanded;
        updateTripDisplay();
    };
}

// 更新样式以包含完成按钮
const tripStyle = document.createElement('style');
tripStyle.textContent = `
    .trip-info {
        background: var(--card-background);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;    
        display: flex;
        gap: 12px;
        flex-direction: column;
    }
    
    .trip-item {
        display: flex;
        gap: 12px;
        border-left: 4px solid transparent;
        cursor: pointer;
        transition: background-color 0.2s;
        padding: 12px;
    }
    
    .trip-item:hover {
        background-color: var(--hover-background);
    }
    
    .trip-item.completed {
        opacity: 0.8;
        border-left-color: var(--secondary-text);
    }
    
    .trip-item.completed .trip-time,
    .trip-item.completed .trip-line,
    .trip-item.completed .trip-company,
    .trip-item.completed .trip-station,
    .trip-item.completed .trip-arrow {
        color: var(--secondary-text);
    }
    
    .trip-item.upcoming {
        border-left-color: #2c9678;
    }
    
    .trip-item.ongoing {
        border-left-color: #185b49;
        background-color: var(--hover-background);
    }
    
    .trip-item.ongoing .trip-time,
    .trip-item.ongoing .trip-line,
    .trip-item.ongoing .trip-company {
        color: var(--primary-color);
    }

    /* 添加地铁行程的特殊样式 */
    .trip-item[data-type="metro"].ongoing {
        border-left-color: #005cb2;
        background-color: var(--hover-background);
    }
    
    .trip-item[data-type="metro"].ongoing .trip-time,
    .trip-item[data-type="metro"].ongoing .trip-line,
    .trip-item[data-type="metro"].ongoing .trip-company {
        color: var(--primary-color);
    }
    
    .trip-item[data-type="metro"].ongoing .trip-status {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .trip-item[data-type="metro"].upcoming {
        border-left-color: var(--primary-color);
    }
    
    .trip-item[data-type="metro"].upcoming .trip-status {
        background-color: var(--hover-background);
        color: var(--primary-color);
    }
    
    .trip-item[data-type="metro"] .complete-btn {
        color: var(--primary-color);
    }
    
    .trip-item[data-type="metro"] .complete-btn:hover {
        background-color: var(--hover-background);
    }
    
    .trip-left {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        width: 48px;
    }
    
    .trip-icon {
        width: 24px;
        height: 24px;
        opacity: 0.7;
    }
    
    .view-code-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        font-size: 12px;
        color: var(--secondary-text);
        border-radius: 4px;
        transition: background-color 0.2s;
        width: 100%;
    }
    
    .view-code-btn:hover {
        background-color: var(--hover-background);
    }
    
    .view-code-btn img {
        width: 20px;
        height: 20px;
        opacity: 0.7;
    }
    
    .complete-btn {
        color: #00796b;
    }
    
    .complete-btn:hover {
        background-color: rgba(0, 121, 107, 0.05);
    }
    
    .trip-details {
        flex: 1;
        min-width: 0;
    }
    
    .trip-status {
        font-size: 10px;
        padding: 0 4px;
        border-radius: 12px;
        background-color: var(--hover-background);
        color: var(--secondary-text);
        text-align: center;
        margin: 4px 0;
    }
    
    .trip-status.completed {
        background-color: var(--hover-background);
        color: var(--secondary-text);
    }
    
    .trip-status.ongoing {
        background-color: #00796b;
        color: white;
    }
    
    .trip-status.upcoming {
        background-color: #e0f2f1;
        color: #00796b;
    }
    
    .delete-btn {
        color: var(--secondary-text);
    }
    
    .delete-btn:hover {
        background-color: var(--hover-background);
    }
    
    .delete-btn img {
        opacity: 0.4;
    }
`;
document.head.appendChild(tripStyle);

// 清理过期行程
function cleanExpiredTrips() {
    try {
        const savedOrders = localStorage.getItem('orders');
        if (!savedOrders) return;
        
        const orders = JSON.parse(savedOrders);
        if (!Array.isArray(orders)) return;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 获取今天的0点
        
        // 只清理早于今天的行程
        const updatedOrders = orders.map(order => {
            const [year, month, day] = order.date.split('-').map(Number);
            const tripDate = new Date(year, month - 1, day);
            if (tripDate < today && order.status === 'upcoming') {
                return { ...order, status: 'completed' };
            }
            return order;
        });
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (error) {
        console.error('清理过期行程失败:', error);
    }
}

// 添加用户面板相关样式
const userPanelStyle = document.createElement('style');
userPanelStyle.textContent = `
    .user-panel {
        position: fixed;
        top: 60px;
        right: 16px;
        background: var(--card-background);
        border-radius: 8px;
        box-shadow: 0 2px 8px var(--shadow-color);
        padding: 8px 0;
        display: none;
        z-index: 1000;
    }
    
    .user-panel.show {
        display: block;
    }
    
    .user-panel-item {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .user-panel-item:hover {
        background-color: var(--hover-background);
    }
    
    .user-panel-item img {
        width: 16px;
        height: 16px;
        opacity: 0.7;
    }
`;
document.head.appendChild(userPanelStyle);

// 将这些函数定义为全局函数
window.handleLogin = function() {
    showToast('功能暂未上线');
};

window.handleClearData = function() {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
        localStorage.clear();
        location.reload();
    }
};

// 初始化用户面板
function initUserPanel() {
    // 创建用户面板
    const userPanel = document.createElement('div');
    userPanel.className = 'user-panel';
    userPanel.innerHTML = `
        <div class="user-panel-item" onclick="handleLogin()">
            <span>登录</span>
        </div>
        <div class="user-panel-item notification-settings">
            <img src="UI/res/notification_black.png" alt="通知设置">
            <span>通知设置</span>
        </div>
        <div class="user-panel-item" onclick="window.open('https://wiki.shangxiaoguan.top/雨城通', '_blank')">
            <img src="UI/res/info_black.png" alt="关于">
            <span>关于</span>
        </div>
        <div class="user-panel-item" onclick="handleClearData()">
            <img src="UI/res/delete_black.png" alt="清除数据">
            <span>清除数据</span>
        </div>
    `;
    document.body.appendChild(userPanel);

    // 初始化通知设置面板
    const notificationSettingsPanel = initNotificationSettingsPanel();
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    document.body.appendChild(overlay);
    
    // 获取登录按钮和通知设置按钮
    const loginBtn = document.querySelector('.login-btn');
    const notificationSettingsBtn = userPanel.querySelector('.notification-settings');
    
    // 切换面板显示状态
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userPanel.classList.toggle('show');
        });
    }
    
    // 点击通知设置
    if (notificationSettingsBtn) {
        notificationSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            userPanel.classList.remove('show');
            notificationSettingsPanel.classList.add('show');
            overlay.classList.add('show');
        });
    }
    
    // 点击其他地方关闭面板
    document.addEventListener('click', (e) => {
        if (!userPanel.contains(e.target) && (!loginBtn || !loginBtn.contains(e.target))) {
            userPanel.classList.remove('show');
        }
        if (notificationSettingsPanel && !notificationSettingsPanel.contains(e.target) && 
            (!notificationSettingsBtn || !notificationSettingsBtn.contains(e.target))) {
            notificationSettingsPanel.classList.remove('show');
            overlay.classList.remove('show');
        }
    });
    
    // 关闭设置面板时隐藏遮罩层
    const closeBtn = notificationSettingsPanel.querySelector('.close-settings');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notificationSettingsPanel.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
    
    // 点击遮罩层时关闭设置面板
    overlay.addEventListener('click', () => {
        notificationSettingsPanel.classList.remove('show');
        overlay.classList.remove('show');
    });
    
    // 保存设置时也隐藏遮罩层
    const saveBtn = notificationSettingsPanel.querySelector('.save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const enabled = document.getElementById('notification-enabled').checked;
            
            if (enabled) {
                const hasPermission = await requestNotificationPermission();
                if (!hasPermission) {
                    showToast('需要通知权限才能启用此功能');
                    return;
                }
            }
            
            const newSettings = {
                enabled,
                advanceTime: parseInt(document.getElementById('advance-time').value, 10),
                checkInNotification: document.getElementById('check-in-notification').checked,
                checkInEndNotification: document.getElementById('check-in-end-notification').checked
            };
            
            saveNotificationSettings(newSettings);
            notificationSettingsPanel.classList.remove('show');
            overlay.classList.remove('show');
            showToast('设置已保存');
        });
    }
}

// 初始化通知设置面板
function initNotificationSettingsPanel() {
    const settings = getNotificationSettings();
    
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'notification-settings-panel';
    settingsPanel.innerHTML = `
        <div class="settings-header">
            <h3>通知设置</h3>
            <button class="close-settings">×</button>
        </div>
        <div class="settings-content">
            <div class="settings-item">
                <label>
                    <input type="checkbox" id="notification-enabled" ${settings.enabled ? 'checked' : ''}>
                    启用通知
                </label>
            </div>
            <div class="settings-item">
                <label>提前提醒时间（分钟）</label>
                <input type="number" id="advance-time" value="${settings.advanceTime}" min="1" max="120">
            </div>
            <div class="settings-item">
                <label>
                    <input type="checkbox" id="check-in-notification" ${settings.checkInNotification ? 'checked' : ''}>
                    开始检票提醒（提前15分钟）
                </label>
            </div>
            <div class="settings-item">
                <label>
                    <input type="checkbox" id="check-in-end-notification" ${settings.checkInEndNotification ? 'checked' : ''}>
                    停止检票提醒（提前5分钟）
                </label>
            </div>
        </div>
        <div class="settings-footer">
            <button class="save-settings">保存设置</button>
        </div>
    `;
    
    document.body.appendChild(settingsPanel);
    return settingsPanel;
}

// 添加未完成订单圆点提示的样式
const pendingStyle = document.createElement('style');
pendingStyle.textContent = `
    .pending-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-color);
        color: var(--white);
        border-radius: 12px; 
        font-size: 12px;
        line-height: 16px;
        margin-left: 4px;
        font-weight: normal;
        min-width: 20px;
        height: 20px;
    }

    /* 添加文本溢出样式 */
    .trip-station, .trip-line, .trip-company {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
        display: inline-block;
    }

    .trip-company {
        max-width: 100%;
        font-size: 14px;
    }

    /* 添加状态标签样式 */
    .trip-status {
        font-size: 10px;
        padding: 0 4px;
        border-radius: 12px;
        background-color: #f5f5f5;
        color: #666;
        text-align: center;
        margin: 4px 0;
    }

    .trip-status.completed {
        background-color: #e0e0e0;
        color: #666;
    }

    .trip-status.ongoing {
        background-color: #00796b;
        color: white;
    }

    .trip-status.upcoming {
        background-color: #e0f2f1;
        color: #00796b;
    }
`;
document.head.appendChild(pendingStyle);

// 初始化按钮事件（只在页面加载时添加一次）
function initServerButtons() {
    const SERVER_ADDRESS = 'ld.cmsy.xyz';
    const SERVER_PORT = '19132';
    
    const joinBtn = document.querySelector('.join-btn');
    if (!joinBtn) {
        console.warn('Join button not found');
        return;
    }

    // 加入游戏按钮
    joinBtn.addEventListener('click', () => {
        window.location.href = `minecraft://?addExternalServer=临东服务器|${SERVER_ADDRESS}:${SERVER_PORT}`;
        setTimeout(() => {
            showToast('如果没有自动打开游戏，请确保已安装我的世界基岩版');
        }, 3000);
    });
}

// 移除页面加载时的登录按钮点击事件
document.addEventListener('DOMContentLoaded', () => {
    // 按照依赖顺序调整初始化顺序
    cleanExpiredTrips();
    initServerStatus();
    initFeatureIcons();
    initCarousel();
    loadNewsContent();
    loadTripInfo();
    initUserPanel();
    initNotificationSettingsPanel();
    initServerButtons(); // 移到最后，确保其他组件都已初始化
    
    // 移除登录按钮的点击事件
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && loginBtn.onclick) {
        loginBtn.removeEventListener('click', loginBtn.onclick);
    }
}); 

// 通知设置的默认值
const DEFAULT_NOTIFICATION_SETTINGS = {
    enabled: true,
    advanceTime: 30, // 提前多少分钟开始通知
    checkInNotification: true, // 是否通知检票
    checkInEndNotification: true // 是否通知停止检票
};

// 获取通知设置
function getNotificationSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_NOTIFICATION_SETTINGS;
}

// 保存通知设置
function saveNotificationSettings(settings) {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
}

// 请求通知权限
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showToast('您的浏览器不支持通知功能');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    } catch (error) {
        console.error('请求通知权限失败:', error);
        return false;
    }
}

// 发送通知
function sendNotification(title, options) {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
        new Notification(title, options);
    }
}

// 检查行程并发送通知
function checkTripsForNotification() {
    const settings = getNotificationSettings();
    if (!settings.enabled) return;
    
    const trips = getTripsFromStorage();
    const now = new Date();
    
    trips.forEach(trip => {
        if (trip.status === 'completed') return;
        
        const [year, month, day] = trip.date.split('-').map(Number);
        const [hours, minutes] = trip.route.time.split(':').map(Number);
        const tripTime = new Date(year, month - 1, day, hours, minutes);
        
        // 计算距离发车的分钟数
        const timeUntilDeparture = Math.floor((tripTime - now) / (1000 * 60));
        
        // 提前指定时间通知
        if (timeUntilDeparture === settings.advanceTime) {
            sendNotification('您关注的行程即将检票', {
                body: `您关注的${trip.route.time}出发前往${trip.route.arrival}的${trip.route.id + '次车' || trip.route.line + '行程'}还有${settings.advanceTime}分钟发车，请前往${trip.route.departure}准备候车`,
                icon: 'UI/res/bus_black.png'
            });
        }
        
        // 检票通知（提前15分钟）
        if (settings.checkInNotification && timeUntilDeparture === 15) {
            sendNotification('您关注的行程已开始检票', {
                body: `您关注的${trip.route.time}出发前往${trip.route.arrival}的${trip.route.id + '次车' || trip.route.line + '行程'}已经开始检票，请前往${trip.route.departure}准备候车`,
                icon: 'UI/res/bus_black.png'
            });
        }
        
        // 停止检票通知（提前5分钟）
        if (settings.checkInEndNotification && timeUntilDeparture === 5) {
            sendNotification('检票即将结束', {
                body: `您关注的${trip.route.time}出发前往${trip.route.arrival}的${trip.route.id + '次车' || trip.route.line + '行程'}即将停止检票`,
                icon: 'UI/res/bus_black.png'
            });
        }
    });
}

// 添加通知相关样式
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification-settings-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card-background);
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        padding: 20px;
        display: none;
        z-index: 1001;
        min-width: 300px;
    }
    
    .notification-settings-panel.show {
        display: block;
    }
    
    .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .settings-header h3 {
        margin: 0;
        font-size: 18px;
    }
    
    .close-settings {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        color: var(--secondary-text);
    }
    
    .settings-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .settings-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .settings-item input[type="number"] {
        width: 80px;
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--card-background);
        color: var(--text-color);
    }
    
    .settings-footer {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
    
    .save-settings {
        background: var(--primary-color);
        color: var(--white);
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .save-settings:hover {
        background: var(--primary-dark);
    }

    .notification-settings {
        cursor: pointer;
    }

    .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 1000;
    }
    
    .settings-overlay.show {
        display: block;
    }
`;
document.head.appendChild(notificationStyle);

// 在页面加载时初始化通知系统
document.addEventListener('DOMContentLoaded', () => {
    // 每分钟检查一次行程
    setInterval(checkTripsForNotification, 60000);
    
    // 立即检查一次
    checkTripsForNotification();
});

// ... rest of the code ... 