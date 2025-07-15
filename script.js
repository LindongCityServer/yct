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
        const releaseTime = item.releaseTime 
            ? new Date(item.releaseTime) 
            : new Date(item.date); // 使用 date 作为默认发布时间
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

    let recentUnexpiredCount = 0;
    const recentNews = [];
    const historyNews = [];

    filteredContentData.forEach(news => {
        const newsDate = new Date(news.date);
        const expireDate = news.expireDate ? new Date(news.expireDate) : null;
        const isUnexpired = !expireDate || expireDate >= currentDate;

        if (isUnexpired && recentUnexpiredCount < 3) {
            recentNews.push(news);
            recentUnexpiredCount++;
        } else {
            if (newsDate < twoMonthsAgo || (expireDate && expireDate < currentDate)) {
                historyNews.push(news);
            } else {
                recentNews.push(news);
            }
        }
    });
    
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
        //console.log('Toggle history button clicked'); // 添加调试日志
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
    { id: 'lab', name: '实验室', icon: 'UI/res/lab_black.png', link: '/lab' }
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
    // 在initFeatureIcons函数中修改切换按钮的img标签
    toggleDiv.innerHTML = `
        <img src="UI/res/expand_more_black.png" 
            alt="${isIconsExpanded ? '收起' : '显示全部'}" 
            style="transform: ${isIconsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};">
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
    // 添加乘车按钮事件监听
    document.querySelector('.header-apply-card-btn').addEventListener('click', handleApplyCard);
    document.querySelector('.apply-card-btn').addEventListener('click', handleApplyCard);    

    // 首先加载交通数据
    await loadTransportData();
    
    initFeatureIcons();
    
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
    //document.querySelector('.header-apply-card-btn')?.addEventListener('click', handleApplyCard);
    //document.querySelector('.apply-card-btn')?.addEventListener('click', handleApplyCard);    
});

// 新增旧版复制方法
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // 隐藏输入框
  textarea.style.opacity = 0;
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, 99999); // 移动端兼容
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);
  return success;
}

async function handleApplyCard() {
  try {
    // 优先使用现代API
    await navigator.clipboard.writeText('/tag @s add yct-ready');
    showToast('已复制指令到剪贴板，请在服务器中粘贴');
  } catch (err) {
    console.error('复制失败:', err);
    let message = '';
    
    if (err.name === 'SecurityError') {
      message = '请在 HTTPS 环境下使用复制功能';
    } else if (err.name === 'NotAllowedError') {
      message = '浏览器阻止了剪贴板操作，请检查权限';
    } else {
      // 尝试旧版回退方法
      const success = fallbackCopy('/tag @s add yct-ready');
      message = success 
        ? '已通过旧版方法复制'
        : '复制失败，请手动输入指令：/tag @s add yct-ready';
    }
    
    showToast(message);
  }
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
        let targetRatio;

        // 检查屏幕宽度
        if (window.innerWidth <= 639) {
            targetRatio = 2.35; // 小屏模式下为2.35:1
        } else {
            targetRatio = 16 / 9; // 大屏模式下为16:9
        }

        // 根据目标比例设置高度
        const height = containerWidth / targetRatio;
        carouselContainer.style.height = `${height}px`;
    }
    
    // 创建轮播内容
    carouselContainer.innerHTML = bannerData.map((banner, index) => {
        const hasImage = banner.image && banner.image.trim() !== '';
        const isColorCode = hasImage && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(banner.image);
        const isCssVariable = hasImage && /^--[\w-]+$/.test(banner.image); // 检查是否为CSS变量
        
        //将banner.title中的特殊字符进行转义，并替换为<wbr>标签
        const sanitizedTitle = banner.title.replace(/\|/g, '<wbr>')

        return `
            <div class="carousel-slide${(!hasImage || isColorCode || isCssVariable) ? ' no-image' : ''}" 
                 data-index="${index}"
                 ${isColorCode ? `style="background-color: ${banner.image};"` : ''}
                 ${isCssVariable ? `style="background-color: var(${banner.image});"` : ''}>
                ${hasImage && !isColorCode && !isCssVariable ? `
                    <img src="${banner.image}" alt="${sanitizedTitle}" onerror="this.parentElement.classList.add('no-image')">
                    <div class="carousel-title">${sanitizedTitle}</div>
                ` : `
                    <div class="carousel-title">${sanitizedTitle}</div>
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

        // 阻止事件冒泡
        e.stopPropagation();

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

    updateAutoPrimaryColor(); // 轮播初始化时更新
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
    carouselContainer.style.transform = `translateX(calc(-${index * 100}% - ${index * 16}px))`;
    
    // 添加新幻灯片的active类
    setTimeout(() => {
        slides[index].classList.add('active');
        // 动画完成后解除锁定
        setTimeout(() => {
            isTransitioning = false;
        }, 500); // 与CSS过渡时间相匹配
    }, 50);
    
    slides.forEach((slide, i) => {
        const slideImg = slide.querySelector('img');
        if (slideImg) {slideImg.style.transformOrigin = `calc(${(index - i) * 50}% + 50%) top`;}
    });
    
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
    let formatState = {
        color: '',
        bold: false,
        italic: false
    };
    let buffer = '';

    function applyFormat() {
        let style = [];
        if (formatState.color) style.push(`color: ${formatState.color}`);
        if (formatState.bold) style.push('font-weight: bold');
        if (formatState.italic) style.push('font-style: italic');
        return style.join('; ');
    }

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '§' && i + 1 < text.length) {
            const code = text[i + 1];
            if (minecraftColorMap[code]) {
                if (buffer) {
                    html += `<span style="${applyFormat().trim()}">${buffer}</span>`;
                    buffer = '';
                }
                if (code === 'r') {
                    formatState = {
                        color: '',
                        bold: false,
                        italic: false
                    };
                } else {
                    if (code.startsWith('color:')) {
                        formatState.color = `var(--text-color-${code[1]})`;
                    } else if (code === 'l') {
                        formatState.bold = true;
                    } else if (code === 'm') {
                        formatState.color = `var(--text-color-m)`;
                    } else if (code === 'n') {
                        formatState.color = `var(--text-color-n)`;
                    } else if (code === 'o') {
                        formatState.italic = true;
                    } else if (code === 'p') {
                        formatState.color = `var(--text-color-p)`;
                    } else if (code === 'q') {
                        formatState.color = `var(--text-color-q)`;
                    } else if (code === 'r') {
                        formatState = {
                            color: '',
                            bold: false,
                            italic: false
                        };
                    } else {
                        formatState.color = `var(--text-color-${code})`;
                    }
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
        html += `<span style="${applyFormat().trim()}">${buffer}</span>`;
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

    const SERVER_ADDRESS = 'router.cmsy.xyz';
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

document.addEventListener('DOMContentLoaded', () => {
  const permissionBanner = document.querySelector('.permission-banner');
  
  if ('Notification' in window) {
    switch (Notification.permission) {
      case 'granted':
        permissionBanner.style.display = 'none'; // 已允许，隐藏提示
        break;
      case 'denied':
        permissionBanner.querySelector('.expired-tag').textContent = '已拒绝';
        break;
      default:
        // 显示提示并请求权限
        permissionBanner.querySelector('.notification-permission').addEventListener('click', () => {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              permissionBanner.style.display = 'none';
            }
          });
        });
    }
  } else {
    permissionBanner.style.display = 'none';
  }
});

// 从localStorage获取行程信息
function getTripsFromStorage() {
    try {
        // 确保正确读取数据
        const savedOrders = localStorage.getItem('orders');
        //console.log('Raw orders from localStorage:', savedOrders); // 调试日志
        
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
        
        //console.log('所有订单数据:', orders);
        
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
    } else if (trip.type === 'metro' || trip.type === 'bus') {
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
    if (trip.type === 'metro' || trip.type === 'bus') {
        // 地铁行程的特殊处理
        if (trip.status === 'completed') {
            actionButton = `
                ${trip.type === 'metro' ? `<button class="view-code-btn route-btn" onclick="if('${trip.type}' === 'metro') { localStorage.setItem('metroTransferQuery', '${tripId}'); window.location.href='/metro_map'; }">
                    <img src="UI/res/route_black.png" alt="路线">
                    路线
                </button>
                ` : ''}<button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        } else if (trip.status === 'ongoing') {
            actionButton = `
                ${trip.type === 'metro' ? `<button class="view-code-btn route-btn" onclick="if('${trip.type}' === 'metro') { localStorage.setItem('metroTransferQuery', '${tripId}'); window.location.href='/metro_map'; }">
                    <img src="UI/res/route_black.png" alt="路线">
                    路线
                </button>
                ` : ''}<button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/logout_black.png" alt="标记出站">
                    标记出站
                </button>
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        } else {
            actionButton = `
                ${trip.type === 'metro' ? `<button class="view-code-btn route-btn" onclick="if('${trip.type}' === 'metro') { localStorage.setItem('metroTransferQuery', '${tripId}'); window.location.href='/metro_map'; }">
                    <img src="UI/res/route_black.png" alt="路线">
                    路线
                </button>
                ` : ''}<button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/enter_black.png" alt="标记进站">
                    标记进站
                </button>
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        }
    } else {
        // 其他行程的原有处理逻辑
        if (statusClass === 'ongoing') {
            actionButton = `
                <button class="view-code-btn complete-btn" onclick="event.stopPropagation(); handleTripComplete('${tripId}')">
                    <img src="UI/res/check_black.png" alt="标记完成">
                    标记完成
                </button>
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        } else if (statusClass === 'completed') {
            actionButton = `
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        } else {
            actionButton = `
                <button class="view-code-btn" onclick="event.stopPropagation(); window.open('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${trip.lines}', '_blank')">
                    <img src="UI/res/qr_code_black.png" alt="查看乘车码">
                    乘车码
                </button>
                <button class="view-code-btn delete-btn" onclick="event.stopPropagation(); handleTripDelete('${tripId}')">
                    <img src="UI/res/delete_black.png" alt="删除行程">
                    删除
                </button>
            `;
        }
    }
    
    return `
        <div class="trip-item ${statusClass}" data-type="${trip.type}" onclick="if('${trip.type}' === 'metro') { localStorage.setItem('metroTransferQuery', '${tripId}'); window.location.href='/metro_map'; } else { window.location.href='/ltcx#${trip.lines}' }">
            <div class="trip-item-header">
                <img src="${getTransportIcon(trip.type)}" alt="交通工具" class="trip-icon">
                <span class="trip-time">${formatTime(trip.date, trip.route.time)}</span>
                <span class="trip-status ${statusClass}">${statusText}</span>
            </div>
            <div class="trip-details">
                <div class="trip-route">
                    <span class="trip-station" title="${trip.route.departure}">${trip.route.departure}</span>
                    <span class="trip-arrow">→</span>
                    <span class="trip-station" title="${trip.route.arrival}">${trip.route.arrival}</span>
                </div>
                <div class="trip-info-row">
                    <span class="trip-line" title="${lineText}">${lineText}</span>
                    <span class="trip-company" title="临途出行·${trip.route.company}">
                        ${!trip.type ? '临途出行·' : ''}${trip.route.company}
                    </span>
                </div>
            </div>            
            <div class="trip-actions">
                <!--标记进站（出站）按钮、乘车码按钮、删除按钮-->                
                ${actionButton}
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
                if (order.type) {
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
        if (trip && trip.type) {
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
        //console.log('No orders found in localStorage');
        return;
    }
    
    try {
        const orders = JSON.parse(savedOrders);
        //console.log('Before deletion:', orders);
        //console.log('Deleting trip with ID:', tripId);
        
        // 在删除前先确认是否存在该行程
        const tripExists = orders.some(order => order.id === tripId);
        if (!tripExists) {
            //console.log('Trip not found:', tripId);
            showToast('删除失败：未找到行程');
            return;
        }
        
        // 确保使用严格相等进行比较
        const updatedOrders = orders.filter(order => order.id !== tripId);
        //console.log('After deletion:', updatedOrders);
        
        if (orders.length === updatedOrders.length) {
            //console.log('No trip was deleted');
            showToast('删除失败：未能删除行程');
            return;
        }
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        //console.log('Successfully updated localStorage');
        
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
    //console.log('Loaded trips:', trips);
    
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

// 定时刷新loadTripInfo函数
setInterval(loadTripInfo, 3000);
setInterval(loadPendingCount, 3000);


// 更新样式以包含完成按钮
const tripStyle = document.createElement('style');
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

    /* 添加功能图标滤镜 */
    .themed-icon {
        filter: var(--icon-filter);
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
        <div class="user-panel-item theme-settings" onclick="handleLogin()">
            <img src="UI/res/theme_black.png" alt="主题设置">
            <span>主题设置</span>
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

    // 确保 user-panel 已加载
    if (!userPanel) {
        console.warn('User panel not found, skipping initialization.');
        return;
    }

    // 确保 theme-settings 按钮已加载
    const themeSettingsBtn = userPanel.querySelector('.theme-settings');
    if (!themeSettingsBtn) {
        console.warn('Theme settings button not found, skipping initialization.');
        return;
    }
    
    // 在 initUserPanel 函数开头：
    let overlay = document.querySelector('.settings-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        document.body.appendChild(overlay);
    }
    overlay.className = 'settings-overlay';
    document.body.appendChild(overlay);
    
    // 获取登录按钮和通知设置按钮
    const loginBtn = document.querySelector('.login-btn');
    const notificationSettingsBtn = userPanel.querySelector('.notification-settings');
    const notificationPermissionBtn = document.querySelector('.notification-permission');
    
    // 切换面板显示状态
    if (!loginBtn) {
        console.error("登录按钮未找到，无法绑定事件监听器");
        return;
    }
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userPanel.classList.toggle('show');
        });
    }
    const themeSettingsPanel = initThemeSettingsPanel(); // 确保调用初始化函数

    // 绑定主题设置按钮点击事件
    themeSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        userPanel.classList.remove('show');
        const panel = initThemeSettingsPanel(); // 确保调用初始化函数
        document.body.appendChild(themeSettingsPanel); // 确保追加到DOM
        themeSettingsPanel.classList.add('show');
        overlay.classList.add('show');
    });
    
    // 点击通知设置
    if (notificationSettingsBtn) {
        notificationSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            userPanel.classList.remove('show');
            notificationSettingsPanel.classList.add('show');
            overlay.classList.add('show');
        });
    }
    if (notificationPermissionBtn) {
        notificationPermissionBtn.addEventListener('click', (e) => {
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
        if (themeSettingsPanel && !themeSettingsPanel.contains(e.target)) {
            themeSettingsPanel.classList.remove('show');
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
    // 关闭设置面板时隐藏遮罩层
    const closeThemeBtn = themeSettingsPanel.querySelector('.close-settings');
    if (closeThemeBtn) {
        closeThemeBtn.addEventListener('click', () => {
            themeSettingsPanel.classList.remove('show');
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
    const saveThemeBtn = themeSettingsPanel.querySelector('.save-settings');
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', async () => {   
            const themeModeSelect = document.querySelector('.theme-mode-select');
            const primaryColorSelect = document.querySelector('.primary-color-select'); 
            const selectedThemeMode = themeModeSelect.querySelector('.tab-button.active').value;
            const selectedPrimaryColor = primaryColorSelect.querySelector('.tab-button.active').value;

            // 保存到 localStorage
            localStorage.setItem('theme-mode', selectedThemeMode);
            localStorage.setItem('primary-color', selectedPrimaryColor);

            // 应用主题
            applyTheme(selectedThemeMode, selectedPrimaryColor);
            console.log(`已应用主题：${selectedThemeMode}，主色调：${selectedPrimaryColor}`);

            // 隐藏设置面板
            themeSettingsPanel.classList.remove('show');
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
                <label>检票开始或值机结束前前提醒时间（分钟）</label>
                <input type="number" id="advance-time" value="${settings.advanceTime}" min="1" max="120">
            </div>
            <div class="settings-item">
                <label>
                    <input type="checkbox" id="check-in-notification" ${settings.checkInNotification ? 'checked' : ''}>
                    检票（提前15分）、登机（提前40分）开始提醒
                </label>
            </div>
            <div class="settings-item">
                <label>
                    <input type="checkbox" id="check-in-end-notification" ${settings.checkInEndNotification ? 'checked' : ''}>
                    检票、登机（提前15分）、值机（提前45分）截止提醒
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
function loadPendingCount() {
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
}


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
    initThemeSettingsPanel();
    initServerButtons(); // 移到最后，确保其他组件都已初始化
    syncSelectValues();
    
    // 确保面板已创建后再操作
    const themeSettingsPanel = initThemeSettingsPanel();
    document.body.appendChild(themeSettingsPanel); // 确保面板已添加到DOM

    // 移除过早的设置操作（原代码中的themeModeSelect.value = ...）
    // 将主题应用逻辑移到面板初始化后
    applyTheme(localStorage.getItem('theme-mode') || 'system', 
            localStorage.getItem('primary-color') || 'auto');
    console.log(`已应用主题：${localStorage.getItem('theme-mode') || 'system'}，主色调：${localStorage.getItem('primary-color') || 'auto'}`);
    
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
        
        if (trip.route.type === 'air') {
            // 提前指定时间通知
            if (timeUntilDeparture === settings.advanceTime + 45) {
                sendNotification('从' + trip.route.departure + '机场出发的航班已开放值机', {
                    body: `计划${trip.route.time}起飞 ${trip.route.company} ${trip.route.id + '→' + trip.route.arrival}`,
                    icon: 'UI/res/checkin_notification.png'
                });
            }

            // 提前45分钟通知值机即将截止
            if (settings.checkInEndNotification && timeUntilDeparture === 45) {
                sendNotification(trip.route.departure + '机场的值机即将截止', {
                    body: `计划${trip.route.time}起飞 ${trip.route.company} ${trip.route.id + '→' + trip.route.arrival}
如您确认无法赶到${trip.route.departure}机场，请提前规划好备选行程。`,
                    icon: 'UI/res/checkin_notification.png'
                });
            }
            
            // 提前40分钟通知登机开始
            if (settings.checkInNotification && timeUntilDeparture === 40) {
                sendNotification(trip.route.id + '航班已开放登机', {
                    body: `计划${trip.route.time}起飞 ${trip.route.company} ${trip.route.id + '→' + trip.route.arrival}
实际登机位置请留意机场大屏或广播。`,
                    icon: trip.route.id ? 'UI/res/checkin_notification.png' : 'UI/res/waiting_notification.png'
                });
            }
            
            // 提前15分钟通知即将起飞
            if (settings.checkInEndNotification && timeUntilDeparture === 5) {
                sendNotification(trip.route.id + '航班即将起飞', {
                    body: `计划${trip.route.time}起飞 ${trip.route.company} ${trip.route.id + '→' + trip.route.arrival}
如您已经登机，请听从机上工作人员指示。如您尚未登机，请留意机场催促登机广播。`,
                    icon: 'UI/res/takeoff_notification.png'
                });
            }
        } else {
            // 提前指定时间通知
            if (timeUntilDeparture === settings.advanceTime) {
                sendNotification(trip.route.id ? trip.route.id + '次即将发车' : '前往' + trip.route.arrival + '的行程即将开始', {
                    body: `${trip.route.time} ${trip.route.departure}${trip.route.id ? '发车→' + trip.route.arrival : '出发 乘坐' + trip.route.line}`,
                    icon: trip.route.id ? 'UI/res/waiting_notification.png' : 'UI/res/agenda_notification.png'
                });
            }
            
            // 提前15分钟通知检票开始（客运行程）或提醒最晚上车时间
            if (settings.checkInNotification && timeUntilDeparture === 15) {
                sendNotification(trip.route.id ? trip.route.id + '次开始检票' : '15分钟内出发可按时到达' + trip.route.arrival, {
                    body: `${trip.route.time} ${trip.route.departure}${trip.route.id ? '发车→' + trip.route.arrival : '出发 乘坐' + trip.route.line}
实际检票位置请留意车站大屏或广播。`,
                    icon: trip.route.id ? 'UI/res/checkin_notification.png' : 'UI/res/waiting_notification.png'
                });
            }
            
            // 提前5分钟通知检票即将截止（客运行程）或提醒最晚上车时间
            if (settings.checkInEndNotification && timeUntilDeparture === 5) {
                sendNotification(trip.route.id ? trip.route.id + '次的检票即将截止' : '可能无法按时到达' + trip.route.arrival, {
                    body: `${trip.route.time} ${trip.route.departure}${trip.route.id ? '发车→' + trip.route.arrival : '出发 乘坐' + trip.route.line}
如您确认无法赶到${trip.route.departure}候车，请提前规划好备选行程。`,
                    icon: 'UI/res/boarding_notification.png'
                });
            }
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

// 在script.js中添加筛选初始化和事件处理
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.filter;
            filterNews(category);
            toggleActiveFilter(btn);
        });
    });
});

function toggleActiveFilter(currentBtn) {
    document.querySelector('.filter-btn.active')
        ?.classList.remove('active');
    currentBtn.classList.add('active');
}

function filterNews(category) {
    // 根据分类过滤所有新闻
    const filteredByCategory = filteredContentData.filter(news => 
        category === 'all' || news.category === category
    );

    // 获取当前时间
    const currentDate = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

    let recentUnexpiredCount = 0;
    const filteredRecent = [];
    const filteredHistory = [];

    filteredByCategory.forEach(news => {
        const newsDate = new Date(news.date);
        const expireDate = news.expireDate ? new Date(news.expireDate) : null;
        const isUnexpired = !expireDate || expireDate >= currentDate;

        if (isUnexpired && recentUnexpiredCount < 3) {
            filteredRecent.push(news);
            recentUnexpiredCount++;
        } else {
            if (newsDate < twoMonthsAgo || (expireDate && expireDate < currentDate)) {
                filteredHistory.push(news);
            } else {
                filteredRecent.push(news);
            }
        }
    });

    // 更新最近资讯区域
    const recentContainer = document.querySelector('.filtered-news-content');
    recentContainer.innerHTML = '';
    filteredRecent.forEach(news => {
        recentContainer.appendChild(createNewsItem(news));
    });

    // 更新历史资讯区域
    const historyContainer = document.querySelector('.history-news-content');
    historyContainer.innerHTML = '';
    filteredHistory.forEach(news => {
        historyContainer.appendChild(createNewsItem(news));
    });
}

// 在 script.js 的全局作用域中定义 createNewsItem
function createNewsItem(news) {
    const newsTemplate = document.getElementById('news-item-template');
    const template = newsTemplate.content.cloneNode(true);
    const newsItem = template.querySelector('.news-item');
    
    // 原函数的剩余代码（保持与片段1、片段3中的逻辑一致）
    const isExpired = news.expireDate && new Date(news.expireDate) < new Date();
    if (isExpired) {
        newsItem.classList.add('expired');
    }
    
    newsItem.dataset.category = news.category;
    
    const categoryClass = {
        '通知公告': 'notice',
        '公交运营': 'bus',
        '地铁运营': 'metro',
        '有轨运营': 'tram',
        '铁路运营': 'local',
    }[news.category] || 'default';
    
    newsItem.querySelector('.news-category').classList.add(categoryClass);
    newsItem.querySelector('.news-category').textContent = news.category;
    newsItem.querySelector('.news-date').textContent = news.date;
    
    const expiredTag = newsItem.querySelector('.expired-tag');
    expiredTag.style.display = isExpired ? 'inline' : 'none';
    
    const titleLink = newsItem.querySelector('.news-title a');
    titleLink.textContent = news.title.replace(/\|/g, '');
    titleLink.title = news.title;
    titleLink.href = news.link || '#';
    titleLink.classList.toggle('no-link', !news.link);
    
    newsItem.querySelector('.news-summary').textContent = news.summary;
    
    return newsItem;
}

document.addEventListener('DOMContentLoaded', () => {
    const themeSettingsBtn = document.getElementById('theme-settings-btn');
    const themeSettingsPanel = document.querySelector('theme-settings-panel');
    const themeModeSelect = document.querySelector('theme-mode-select');
    const themeModeSelectTabs = themeModeSelect.querySelectorAll('.tab-button');
    const themeModeSelectActive = themeModeSelect.querySelector('.tab-button.active');
    const primaryColorSelect = document.querySelector('primary-color-select');
    const primaryColorSelectTabs = primaryColorSelect.querySelectorAll('.tab-button');
    const primaryColorSelectActive = primaryColorSelect.querySelector('.tab-button.active');
    const saveButton = document.getElementById('save-theme-settings');
    const cancelButton = document.getElementById('cancel-theme-settings');

    // 加载保存的设置
    const savedThemeMode = localStorage.getItem('theme-mode') || 'system';
    const savedPrimaryColor = localStorage.getItem('primary-color') || 'auto';
    console.log('加载的主题模式:', savedThemeMode);
    console.log('加载的强调色:', savedPrimaryColor);

    themeModeSelect.value = savedThemeMode;
    primaryColorSelect.value = savedPrimaryColor;

    applyTheme(savedThemeMode, savedPrimaryColor);
    console.log(`已应用主题：${savedThemeMode}，主色调：${savedPrimaryColor}`);

    // 显示/隐藏设置窗口
    themeSettingsBtn.addEventListener('click', () => {
        themeSettingsPanel.classList.toggle('hidden');
    });

    cancelButton.addEventListener('click', () => {
        themeSettingsPanel.classList.add('hidden');
        themeSettingsPanel.classList.remove('show');
    });

    if (!themeModeSelect || !primaryColorSelect) {
        console.error('未能找到主题模式或强调色选择器');
        return;
    }

    // 切换主题模式
    themeModeSelectTabs.addEventListener('click', (e) => {
        applyTheme(e.target.value, primaryColorSelectActive.value);
        localStorage.setItem('theme-mode', e.target.value);
        console.log('已切换主题模式:', e.target.value);
    });

    // 切换强调色
    primaryColorSelectTabs.addEventListener('click', (e) => {
        applyTheme(themeModeSelectActive.value, e.target.value);
        localStorage.setItem('primary-color', e.target.value);
        console.log('已切换强调色:', e.target.value);
    });

    // 保存设置
    saveButton.addEventListener('click', () => {
        const selectedThemeMode = themeModeSelect.value;
        const selectedPrimaryColor = primaryColorSelect.value;

        localStorage.setItem('theme-mode', selectedThemeMode);
        localStorage.setItem('primary-color', selectedPrimaryColor);

        applyTheme(selectedThemeMode, selectedPrimaryColor);
        console.log(`已保存主题模式: ${selectedThemeMode}, 强调色: ${selectedPrimaryColor}`);
        themeSettingsPanel.classList.add('hidden');
    });

    themeModeSelect.value = savedThemeMode;
    primaryColorSelect.value = savedPrimaryColor;

    applyTheme(savedThemeMode, savedPrimaryColor);
    console.log(`已应用主题：${savedThemeMode}，主色调：${savedPrimaryColor}`);

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme-mode') === 'system') {
        applyTheme('system', localStorage.getItem('primary-color'));
        console.log('系统主题已更改，应用新的主题模式');
        }
    });  
});

/*function initThemeSettingsPanel() {
    const panel = document.createElement('div');
    panel.className = 'theme-settings-panel hidden';
    panel.innerHTML = `
        <div class="settings-header">
            <h3>主题与配色设置</h3>
            <button class="close-settings">×</button>
        </div>
        <div class="settings-content">
            <!-- 主题模式选择 -->
            <div class="settings-item themed-select">
                <div class="select-label">主题模式：</div>
                <div class="theme-mode-select direction-tabs">
                    <div class="tab-button active" data-value="system">跟随系统</div>
                    <div class="tab-button" data-value="light">手动浅色</div>
                    <div class="tab-button" data-value="dark">手动深色</div>
                </div>
            </div>
            <!-- 强调色选择 -->
            <div class="settings-item themed-select">
                <div class="select-label">强调色：</div>
                <div class="primary-color-select direction-tabs">
                    <div class="tab-button active" data-value="auto">自动</div>
                    <div class="tab-button" data-value="cyan">雨城青</div>
                    <div class="tab-button" data-value="red">中国红</div>
                    <div class="tab-button" data-value="gray">水墨灰</div>
                </div>
            </div>
        </div>
        <div class="settings-footer">
            <button class="save-settings">保存设置</button>
        </div>
    `;
    return panel;
}*/

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    themeSettingsPanel = initThemeSettingsPanel();
    document.body.appendChild(themeSettingsPanel); // 确保追加到 DOM
    const themeModeSelect = document.querySelector('.theme-mode-select');
    const primaryColorSelect = document.querySelector('.primary-color-select');

    if (!themeModeSelect || !primaryColorSelect) {
        console.error('未能找到主题模式或强调色选择器');
        return;
    }

    // 加载保存的设置
    const savedThemeMode = localStorage.getItem('theme-mode') || 'system';
    const savedPrimaryColor = localStorage.getItem('primary-color') || 'auto';
    console.log('加载的主题模式:', savedThemeMode);
    console.log('加载的强调色:', savedPrimaryColor);

    themeModeSelect.value = savedThemeMode;
    primaryColorSelect.value = savedPrimaryColor;

    applyTheme(savedThemeMode, savedPrimaryColor);
    console.log(`已应用主题：${savedThemeMode}，主色调：${savedPrimaryColor}`);

    const themeSettingsPanel = document.querySelector('.theme-settings-panel');
    const closeButton = themeSettingsPanel.querySelector('.close-settings');
    const saveButton = themeSettingsPanel.querySelector('.save-settings');

    // 关闭按钮事件
    closeButton.addEventListener('click', () => {
        themeSettingsPanel.classList.remove('show');
        overlay.classList.remove('show');
    });

    // 保存按钮事件(弃用)
    saveButton.addEventListener('click', () => {
        const selectedThemeMode = themeModeSelect.value;
        const selectedPrimaryColor = primaryColorSelect.value;

        // 保存到 localStorage
        localStorage.setItem('theme-mode', selectedThemeMode);
        localStorage.setItem('primary-color', selectedPrimaryColor);

        // 应用主题
        applyTheme(selectedThemeMode, selectedPrimaryColor);
        console.log(`已保存主题模式: ${selectedThemeMode}, 强调色: ${selectedPrimaryColor}`);

        // 隐藏设置面板
        themeSettingsPanel.classList.remove('show');
        overlay.classList.remove('show');
    });
});

// 工具函数：切换 tab 按钮状态
function toggleTab(container, target) {
    container.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
}

// 工具函数：获取选中的 tab 值
function getSelectedTabValue(container) {
    const activeTab = container.querySelector('.tab-button.active');
    return activeTab ? activeTab.dataset.value : 'system';
}

// 辅助函数：创建遮罩层（如果不存在）
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    document.body.appendChild(overlay);
    return overlay;
}

function applyTheme(themeMode, primaryColor) {
    console.log(`应用主题模式: ${themeMode}, 强调色: ${primaryColor}`);
    // 设置主题模式
    if (themeMode === 'system') {
        document.documentElement.removeAttribute('data-force-theme');
    } else {
        document.documentElement.setAttribute('data-force-theme', themeMode);
    }

    // 设置强调色
    const rootStyles = document.documentElement.style;
    if (primaryColor === 'auto') {
        updateAutoPrimaryColor();
    } else {
        const baseColor = getPrimaryColorValue(primaryColor); // 调用新函数
        rootStyles.setProperty('--primary-color', baseColor);
        rootStyles.setProperty('--primary-color-hover', adjustColor(baseColor, 0.8));
    }
}

// 新增：根据主题和颜色计算图标滤镜
function getIconFilter() {
    const currentPrimaryColor = localStorage.getItem('primary-color') || 'auto';
    const themeMode = localStorage.getItem('theme-mode') || 'system';

    if (currentPrimaryColor === 'gray') {
        return 'grayscale(100%)';
    } else if (currentPrimaryColor === 'red') {
        return 'hue-rotate(4deg)';
    } else {
        return themeMode === 'dark' ? 'brightness(0.9)' : 'none';
    }
}

function getCurrentColorType() {
  const currentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color').trim();
  return currentColor === '#888888' ? 'gray' : 
         currentColor === '#A61B29' ? 'red' : 'cyan';
}

function getPrimaryColorValue(color) {
    switch(color) {
        case 'cyan':
            return '#2C9678';
        case 'red':
            return '#A61B29';
        case 'gray':
            return '#888888';
        default:
            return '#2C9678'; // 默认雨城青色
    }
}

// 自动更新强调色
function updateAutoPrimaryColor() {
    // 新增模式检查：仅在“自动模式”下运行
    const currentPrimaryColor = localStorage.getItem('primary-color');
    if (currentPrimaryColor !== 'auto') return;

    // 原逻辑保持不变
    const rootStyles = document.documentElement.style;
    const today = new Date();
    let color = '#2C9678'; // 默认青色

    bannerData.forEach(item => {
        // 新增：同时检查颜色代码（#开头）和 CSS 变量（--开头）
        if (item.image.startsWith('#') || item.image.startsWith('--')) {
            const releaseTime = item.releaseTime ? new Date(item.releaseTime) : new Date(item.date);
            const expireDate = new Date(item.expireDate);
            
            // 检查当前时间是否在发布和过期时间之间
            if (today >= releaseTime && today <= expireDate) {
                if (item.image === '#888888') {
                    color = '#888888'; // 灰色优先级最高
                } else if (item.image === '#A61B29' && color !== '#888888') {
                    color = '#A61B29'; // 中国红次之
                }
            }
        }
    });

    // 设置滤镜和强调色
    if (color === '#888888') {
        document.body.style.filter = 'grayscale(100%)';
    } else {
        document.body.style.filter = 'none';
    }

    rootStyles.setProperty('--primary-color', color);
    rootStyles.setProperty('--primary-color-hover', adjustColor(color, 0.8));
    const colorType = 
        color === '#888888' ? 'gray' : 
        color === '#A61B29' ? 'red' : 
        'cyan';
    updateLogoTone(colorType);
}

// 更新 logo 图片色调
function updateLogoTone(color) {
    const logoImages = document.querySelectorAll('.logo img');
    logoImages.forEach(img => {
        if (color === 'gray') {
            img.style.filter = 'grayscale(100%)';
        } else if (color === 'red') {
            img.style.filter = 'hue-rotate(185deg)';
        } else {
            img.style.filter = 'none'; // 明确清除其他情况
        }
    });
    const featureIcons = document.querySelectorAll('.themed-icon img');
    featureIcons.forEach(img => {
        if (color === 'gray') {
            img.style.filter = 'grayscale(100%)';
        } else if (color === 'red') {
            img.style.filter = 'hue-rotate(4deg)';
        } else {
            img.style.filter = 'hue-rotate(185deg)'; // 明确清除其他情况
        }
    });
}

// 初始化主题模式选择
const themeSettingsPanel = document.querySelector('.theme-settings-panel');
const themeModeTabs = themeSettingsPanel.querySelector('.theme-mode-select');
themeModeTabs.addEventListener('click', (e) => {
    const target = e.target.closest('.tab-button');
    if (target) {
        Array.from(themeModeTabs.children).forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        themeModeSelect.value = target.dataset.value;
    }
});

// 初始化强调色选择
const primaryColorTabs = themeSettingsPanel.querySelector('.primary-color-select');
primaryColorTabs.addEventListener('click', (e) => {
    const target = e.target.closest('.tab-button');
    if (target) {
        Array.from(primaryColorTabs.children).forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        primaryColorSelect.value = target.dataset.value;
    }
});

// 自动同步tab按钮状态
function syncSelectValues() {
    const selectedThemeMode = localStorage.getItem('theme-mode') || 'system';
    const selectedPrimaryColor = localStorage.getItem('primary-color') || 'auto';
    
    // 同步主题模式
    const themeButtons = themeModeTabs.querySelectorAll('.tab-button');
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === selectedThemeMode);
    });
    
    // 同步强调色
    const colorButtons = primaryColorTabs.querySelectorAll('.tab-button');
    colorButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === selectedPrimaryColor);
    });
}