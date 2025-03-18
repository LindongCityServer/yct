let isCoordinatesEdited = false; // 初始为未手动修改

// 1. 在script.js顶部添加防抖函数（如果不存在）
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// 3. 添加布局调整函数（根据需要）
function adjustPreviewLayout() {
    const preview = document.querySelector('.preview-container');
    const tileContainer = preview.querySelector('.tile-container');
    if (tileContainer) {
        // 重新计算图片位置
        updatePreview();
    }
}

// 1. 缓存数据避免重复请求
let cachedMarkers = null;

function fullToHalf(c) {
    const code = c.charCodeAt(0);
    if (code >= 0xFF10 && code <= 0xFF29) return String.fromCharCode(code - 0xfee0); // 全角数字
    if (code >= 0xFF41 && code <= 0xFF5A) return String.fromCharCode(code - 0xfee0); // 全角小写
    if (code >= 0xFF21 && code <= 0xFF3A) return String.fromCharCode(code - 0xfee0); // 全角大写
    if (code === 0xFF08 || code === 0xFF09) return String.fromCharCode(code - 0xfee0); // 全角括号
    return convertToHalfWidth(c);
}

// 2. 创建字符转换函数
function convertToHalfWidth(text) {
    return text
        .replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角符号转半角
        .replace(/\u3000/g, ' ') // 全角空格转半角空格
        .replace(/　/g, ' ');    // 全角空格的另一种编码
}

// 3. 获取并解析JS文件数据
// 优化后的 fetchMarkersData 函数
async function fetchMarkersData() {
    if (cachedMarkers) return cachedMarkers;
    
    try {
        const response = await fetch('/data/map_data/custom.markers.js');
        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        const scriptContent = await response.text();
        
        //console.log("加载的脚本内容:", scriptContent); // 调试信息
        
        // 创建安全执行环境
        const sandbox = { UnminedCustomMarkers: null };
        // ✅ 移除 exports 参数，直接执行脚本返回值
        const func = new Function(`return (${scriptContent})`);
        sandbox.UnminedCustomMarkers = func();
        
        //console.log("解析后的对象:", sandbox); // 调试信息
        
        // 验证数据结构
        if (
            !sandbox.UnminedCustomMarkers 
            || !Array.isArray(sandbox.UnminedCustomMarkers.markers)
        ) {
            throw new Error("数据格式错误：未找到markers数组");
        }
        
        // 提取所需字段
        const markers = sandbox.UnminedCustomMarkers.markers.map(marker => ({
            text: marker.text
                ? marker.text
                    .replace(/\n/g, '')          // 删除换行符
                    .replace(/　/g, '')         // 全角空格转半角空格
                    .trim()                      // 移除首尾空格
                : '',
            x: marker.x,
            z: marker.z,
            image: marker.image
        }));
        
        cachedMarkers = markers;
        return markers;
    } catch (err) {
        console.error("数据加载失败:", err);
        throw err;
    }
}

// 错误处理优化
document.getElementById('search-input').addEventListener('input', async function() {
    try {
        const query = this.value.trim();
        if (!query) return;
        const results = await searchMarkers(query);
        renderResults(results);
    } catch (err) {
        const message = 
            err.message.includes("HTTP错误") 
            ? "文件加载失败，请检查路径或网络" 
            : err.message.includes("未找到数据定义") 
            ? "数据格式错误，请检查文件内容" 
            : "未知错误，请查看控制台";
        
        console.error("搜索失败:", err);
        showToast(message);
    }
});

// 4. 搜索函数
async function searchMarkers(query, selectedCategory) {
    const markers = await fetchMarkersData();
    const normalizedQuery = convertToHalfWidth(query).trim().toLowerCase();
    
    return markers.filter(marker => {
        const processedText = marker.text 
            ? Array.from(marker.text).map(c => fullToHalf(c)).join('')
            : '';
        const category = categoryMap[marker.image.replace(/\.png$/, '')] || '其他';
        return (
            processedText.toLowerCase().includes(normalizedQuery) &&
            (!selectedCategory || category === selectedCategory) // 使用分类筛选参数
        );
    });
}

// 全局作用域（文件顶部）
const categoryMap = {
    'bank': '银行',
    'bookstore': '书店',
    'building': '办公楼',
    'business': '商业',
    'bus-stop': '公交车站',
    'cafe': '咖啡厅/茶馆',
    'cinema': '电影院',
    'coach-station': '客运站',
    'drinks': '饮品店',
    'eastern-restaurant': '中餐',
    'factory': '工厂/基地',
    'ferry-port': '轮渡码头',
    'fireman': '消防站',
    'fix': '维修',
    'gas-station': '加油站',
    'gov1': '政府机构',
    'hospital': '医院',
    'hotel': '宾馆',
    'hot-spring': '洗浴',
    'lindong-metro': '地铁站',
    'lindong-metro-transfer': '地铁站',
    'local-railway-station': '专用线车站',
    'museum': '文教设施',
    'park': '公园',
    'parking': '停车场',
    'pharmacy': '药店',
    'photo': '照相馆/复印社',
    'police': '警察局',
    'post-office': '邮局',
    'public-service': '政府机构',
    'railway-station': '火车站',
    'residence': '住宅',
    'scenery': '景点',
    'school': '学校',
    'shop': '店铺',
    'songshanhu-tram': '有轨车站',
    'stadium': '体育场馆',
    'toll-gate': '收费站',
    'way-in': '入口',
    'way-out': '出口',
    'western-restaurant': '西餐',
};

// 5. 结果渲染函数
// 修改后的 renderResults 函数
function renderResults(results) {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    const x = parseFloat(xInput.value);
    const z = parseFloat(zInput.value);

    // 按距离排序（升序）
    results.sort((a, b) => {
        const distA = Math.sqrt((a.x - x) ** 2 + (a.z - z) ** 2);
        const distB = Math.sqrt((b.x - x) ** 2 + (b.z - z) ** 2);
        return distA - distB;
    });

    // 清空结果容器
    const resultContainer = document.querySelector('.search-result');
    resultContainer.innerHTML = '';
    
    results.forEach((marker) => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.dataset.x = marker.x;
        item.dataset.z = marker.z;

        // 计算并显示距离
        const distance = Math.sqrt(
            (marker.x - x) ** 2 + 
            (marker.z - z) ** 2
        ).toFixed(0);

        const categoryName = categoryMap[marker.image.replace(/\.png$/, '')] || '其他';
        
        item.innerHTML = `
            <div class="search-item-name">${marker.text}</div>
            <div class="caption">
                <div class="search-item-category">${categoryName}</div>
                <div class="search-item-coordinate">距离${distance}格</div>
            </div>
        `;
        
        // 点击事件处理
        item.addEventListener('click', function(e) {
            // 移除所有选中项
            const allItems = document.querySelectorAll('.search-item');
            allItems.forEach(item => item.classList.remove('selected'));

            // 添加当前选中状态
            this.classList.add('selected');

            // 更新输入框和预览
            document.getElementById('coordinates-x').value = marker.x;
            document.getElementById('coordinates-z').value = marker.z;
            updatePreview();

            // 重新触发搜索以重新排序
            triggerSearch();
        });
        
        resultContainer.appendChild(item);
    });

    // 自动选中逻辑（保留原有条件判断）
    if (results.length > 0) {
        const firstItem = resultContainer.querySelector('.search-item');
        if (firstItem) {
            const allItems = document.querySelectorAll('.search-item');
            allItems.forEach(item => item.classList.remove('selected'));
            firstItem.classList.add('selected');

            // 仅在非手动输入时自动选中首个结果
            if (!isManualInput()) {
                firstItem.click(); // 触发点击事件以更新预览
            }
        }
    } else {
        const allItems = document.querySelectorAll('.search-item');
        allItems.forEach(item => item.classList.remove('selected'));
    }

    // 显示/隐藏逻辑保持不变
    if (results.length === 0) {
        resultContainer.style.display = 'none';
    } else {
        resultContainer.style.display = 'block';
    }

    // ✅ 滚动到最顶部
    resultContainer.scrollIntoView({ behavior: 'smooth' });

    // ✅ 滚动整个页面到最顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 修改 triggerSearch 函数以处理空查询
async function triggerSearch() {
    const query = document.getElementById('search-input').value.trim();
    const selectedCategory = document.getElementById('category-filter').value; // 获取分类筛选参数
    
    try {
        const results = await searchMarkers(query, selectedCategory); // 传递分类筛选参数
        renderResults(results);
    } catch (err) {
        console.error("搜索失败:", err);
        showToast(err.message);
    }
}

// 修改检测手动输入的函数
function isManualInput() {
    return isCoordinatesEdited; // 直接返回标志变量
}

// 新增：处理预览功能（支持多图拼接）
function updatePreview() {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    const x = parseFloat(xInput.value);
    const z = parseFloat(zInput.value);
    
    if (isNaN(x) || isNaN(z)) {
        //clearPreview();
        return;
    }
    
    // 计算当前tile坐标
    const tileX = Math.floor(x / 1024);
    const tileZ = Math.floor(z / 1024);
    
    // 需要加载的tile列表：当前及周围8个方向
    const tilesToLoad = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            tilesToLoad.push({
                x: tileX + dx,
                z: tileZ + dz
            });
        }
    }
    
    // 清除之前的预览
    clearPreview();
    
    // 创建父容器
    const previewContainer = document.querySelector('.preview-container');
    const tileContainer = document.createElement('div');
    tileContainer.className = 'tile-container';
    previewContainer.appendChild(tileContainer);
    
    // 加载所有图片
    const promises = tilesToLoad.map(tile => {
        return new Promise((resolve, reject) => {
            const { x: tx, z: tz } = tile;
            
            // 计算路径
            const xDir = Math.floor(tx / 10);
            const zDir = Math.floor(tz / 10);
            const imageUrl = `/data/map_data/tiles/zoom.-2/${xDir}/${zDir}/tile.${tx}.${tz}.jpeg`;
            
            const img = new Image();
            img.src = imageUrl;
            
            img.onload = () => {
                // 计算容器尺寸
                const containerWidth = previewContainer.offsetWidth;
                const containerHeight = previewContainer.offsetHeight;
                
                // 当前tile的地理左上角坐标
                const tileLeftGeo = tx * 1024;
                const tileTopGeo = tz * 1024;
                
                // 用户坐标到当前tile左上角的偏移量（地理单位）
                const dxGeo = x - tileLeftGeo;
                const dzGeo = z - tileTopGeo;
                
                // 转换为像素坐标（1像素=4地理单位）
                const dxPixel = dxGeo / 4 - 128;
                const dzPixel = dzGeo / 4 - 128;
                
                // 图片左上角相对于容器中心的偏移
                const imgLeft = containerWidth / 2 - dxPixel - img.width / 2;
                const imgTop = containerHeight / 2 - dzPixel - img.height / 2;
                
                // 设置绝对定位
                img.style.position = 'absolute';
                img.style.left = `${imgLeft}px`;
                img.style.top = `${imgTop}px`;
                
                // 防止图片被截断
                img.style.maxWidth = 'none';
                img.style.maxHeight = 'none';
                
                tileContainer.appendChild(img);
                resolve(img);
            };
            
            img.onerror = () => {
                resolve(null);
            };
        });
    });
    
    Promise.all(promises).then(() => {
        // 显示加载完成状态
        tileContainer.style.display = 'block';
    });
}

// 清除预览
function clearPreview() {
    const previewContainer = document.querySelector('.preview-container');
    // 仅移除动态创建的 .tile-container 元素
    const tileContainer = previewContainer.querySelector('.tile-container');
    if (tileContainer) {
        tileContainer.remove();
    }
}

// 添加事件监听
// 修改坐标输入事件监听器
document.getElementById('coordinates-x').addEventListener('input', function() {
    isCoordinatesEdited = true; // 标记为手动修改
    updatePreview();
});

document.getElementById('coordinates-z').addEventListener('input', function() {
    isCoordinatesEdited = true; // 标记为手动修改
    updatePreview();
});
document.querySelector('.preview-container').addEventListener('click', async () => {
  await savePreviewImage();
});

document.getElementById('share-btn').addEventListener('click', () => {
    const x = document.getElementById('coordinates-x').value;
    const z = document.getElementById('coordinates-z').value;
    const query = document.getElementById('search-input').value.trim(); // 获取当前搜索词

    const urlBase = window.location.href.split('?')[0];
    let url = `${urlBase}?x=${x}&z=${z}`;
    if (query) {
        url += `&q=${encodeURIComponent(query)}`; // 添加关键词参数
    }

    navigator.clipboard.writeText(url).then(() => {
        showToast('链接已复制到剪贴板');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');

    // 设置默认坐标（保留原逻辑）
    xInput.value = -1334;
    zInput.value = -490;

    // 解析URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const xParam = parseFloat(urlParams.get('x'));
    const zParam = parseFloat(urlParams.get('z'));
    const queryParam = urlParams.get('q'); // 新增：获取关键词参数
    const categoryParam = urlParams.get('cat'); // 新增：获取分类参数

    // 优先使用URL参数覆盖默认值
    if (!isNaN(xParam)) xInput.value = xParam;
    if (!isNaN(zParam)) zInput.value = zParam;

    // ✅ 新增：如果坐标由URL参数设置，则不标记为手动输入
    if (urlParams.has('x') || urlParams.has('z')) {
        isCoordinatesEdited = false; // 重置为非手动输入
    }

    // 触发输入事件以更新预览
    xInput.dispatchEvent(new Event('input'));
    zInput.dispatchEvent(new Event('input'));

    // 新增：处理关键词参数
    if (queryParam) {
        const searchInput = document.getElementById('search-input');
        searchInput.value = queryParam;
        searchInput.dispatchEvent(new Event('input')); // 触发搜索逻辑
    }

    // 生成分类选项
    const categoryFilter = document.getElementById('category-filter');
    const uniqueCategories = Array.from(new Set(Object.values(categoryMap)));
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // 监听分类选择变化
    categoryFilter.addEventListener('change', async () => {
        updateURLCategory(categoryFilter.value);
        await triggerSearch(); // 触发搜索逻辑
    });

    // 初始化时解析URL参数中的分类
    if (categoryParam) {
        categoryFilter.value = categoryParam;
        triggerSearch(); // 触发搜索逻辑
    }

    // 触发初始搜索
    triggerSearch().then(() => {
        // 如果URL有搜索参数但没有坐标参数，设置第一个搜索结果的坐标
        if (queryParam && (isNaN(xParam) || isNaN(zParam))) {
            const firstItem = document.querySelector('.search-item');
            if (firstItem) {
                const x = firstItem.dataset.x;
                const z = firstItem.dataset.z;
                xInput.value = x;
                zInput.value = z;
                xInput.dispatchEvent(new Event('input')); // 触发预览更新
                zInput.dispatchEvent(new Event('input')); // 触发预览更新
            }
        }
    });

    // 初始化预览
    updatePreview();

    // 新增窗口大小监听
    window.addEventListener('resize', debounce(() => {
        adjustPreviewLayout();
    }, 200));
});

function updateURLCategory(category) {
    const urlParams = new URLSearchParams(window.location.search);
    if (category) {
        urlParams.set('cat', category);
    } else {
        urlParams.delete('cat');
    }
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    history.pushState(null, '', newUrl);
}

async function savePreviewImage() {
    const preview = document.querySelector('.preview-container');
    const x = document.getElementById('coordinates-x').value;
    const z = document.getElementById('coordinates-z').value;

    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.opacity = '0'; // 替代 visibility:hidden
    tempContainer.style.width = '100vw'; // 全屏宽度
    tempContainer.style.height = '100vh'; // 全屏高度
    tempContainer.style.overflow = 'visible'; // 避免截断
    document.body.appendChild(tempContainer);

    // 复制预览内容
    const previewClone = preview.cloneNode(true);
    tempContainer.appendChild(previewClone);

    // 在复制预览内容后：
    previewClone.style.position = 'relative'; // 确保子元素绝对定位以它为基准
    previewClone.style.width = preview.offsetWidth + 'px';
    previewClone.style.height = preview.offsetHeight + 'px';
    tempContainer.appendChild(previewClone);

    // 创建临时容器时：
    tempContainer.style.backgroundColor = 'rgba(255,0,0,0.1)'; // 半透明红色背景辅助定位
    previewClone.style.backgroundColor = 'rgba(0,255,0,0.1)'; // 绿色背景辅助定位

    // 添加坐标信息
    const coordDiv = document.createElement('div');
    coordDiv.className = 'temp-coords';
    coordDiv.style.marginTop = '16px';
    coordDiv.innerHTML = `坐标：X${x}, Z${z}`;
    tempContainer.appendChild(coordDiv);

    // 添加选中地名
    const selectedName = document.querySelector('.search-item.selected')?.textContent;
    if (selectedName) {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'temp-name';
        nameDiv.style.marginTop = '8px';
        nameDiv.textContent = `地名：${selectedName}`;
        tempContainer.appendChild(nameDiv);
    }

    // 添加页脚
    const footer = document.createElement('div');
    footer.className = 'temp-footer';
    footer.innerHTML = `
        <div class="footer-content">
        <div class="footer-left">
            <img src="/UI/res/雨城通logo带文字浅色.png" class="footer-logo">
            <p class="footer-caption">位置仅供参考,"临东"及相关组织品牌等均为虚构</p>
        </div>
        </div>
    `;
    footer.style.marginTop = '24px';
    tempContainer.appendChild(footer);

    let images;

    // 等待所有图片加载
    await new Promise(resolve => {
        let loadedCount = 0;
        images = tempContainer.querySelectorAll('img');
        if (!images.length) return resolve();

        images.forEach(img => {
        if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) resolve();
        } else {
            img.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) resolve();
            };
        }
        });
    });

    // 渲染canvas
    const canvas = await html2canvas(tempContainer, {
        backgroundColor: null, // 保持透明背景
        scale: 1, // 调整缩放比例测试
        useCORS: true,
        logging: true // 开启调试日志
    });

    // 在等待图片加载的Promise中：
    console.log('所有图片加载完成:', tempContainer.querySelectorAll('img').length);
    images.forEach((img, index) => {
        console.log(`图片${index}路径: ${img.src}, 是否加载: ${img.complete}`);
    });

    // 清理
    tempContainer.remove();

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `map_preview_${new Date().getTime()}.png`;
    link.click();
}