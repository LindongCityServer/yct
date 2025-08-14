let isCoordinatesEdited = false; // 初始为未手动修改
let isDragging = false;
let dragStartX, dragStartZ;
let dragStartClientX, dragStartClientY;
let isPreviewUpdateScheduled = false; // 添加缺失的变量定义

// 开始拖拽
function startDrag(event) {
    // 只响应鼠标左键拖拽或触屏开始
    if (event.type === 'mousedown' && event.button !== 0) return;
    if (event.type === 'touchstart' && event.touches.length === 0) return;
    
    isDragging = true;
    // 处理鼠标和触屏事件
    if (event.type === 'touchstart' && event.touches.length > 0) {
        dragStartClientX = event.touches[0].clientX;
        dragStartClientY = event.touches[0].clientY;
    } else if (event.type === 'mousedown') {
        dragStartClientX = event.clientX;
        dragStartClientY = event.clientY;
    } else {
        return; // 其他情况不处理
    }
    
    // 获取当前坐标
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    dragStartX = parseFloat(xInput.value);
    dragStartZ = parseFloat(zInput.value);
    
    // 添加鼠标移动和释放事件监听器
    document.addEventListener('mousemove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);
    
    // 阻止默认行为，防止页面滚动等
    event.preventDefault();
}

// 拖拽过程中
function drag(event) {
    if (!isDragging) return;
    
    // 处理鼠标和触屏事件
    let clientX, clientY;
    if (event.type === 'touchmove') {
        // 检查触摸点是否存在
        if (event.touches.length === 0) return;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.type === 'mousemove') {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        return; // 其他事件不处理
    }
    
    // 计算鼠标/触摸点移动的距离
    const deltaX = clientX - dragStartClientX;
    const deltaY = clientY - dragStartClientY;
    
    // 根据移动距离计算新的坐标
    // 鼠标/手指向右移动时，地图向左移动，显示更右边的内容（X坐标减少）
    // 鼠标/手指向下移动时，地图向上移动，显示更下边的内容（Z坐标减少）
    const sensitivity = event.type === 'touchmove' ? 8 : 4; // 提高触屏灵敏度
    const newX = dragStartX - deltaX * sensitivity;
    const newZ = dragStartZ - deltaY * sensitivity;
    
    // 更新坐标输入框
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    xInput.value = newX;
    zInput.value = newZ;
    
    // 标记为手动修改
    isCoordinatesEdited = true;
    
    // 延迟更新预览，提高拖拽流畅度
    if (!isPreviewUpdateScheduled) {
        isPreviewUpdateScheduled = true;
        requestAnimationFrame(() => {
            updatePreview();
            triggerSearch();
            isPreviewUpdateScheduled = false;
        });
    }
    
    // 只在触屏移动时阻止默认行为，防止页面滚动
    if (event.type === 'touchmove') {
        event.preventDefault();
    }
}

// 结束拖拽
function endDrag() {
    isDragging = false;
    
    // 移除所有可能的事件监听器
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);
    document.removeEventListener('touchcancel', endDrag);
}

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
    triggerSearch();
});

// 4. 搜索函数
async function searchMarkers(query, selectedCategory) {
    const markers = await fetchMarkersData();
    const normalizedQuery = convertToHalfWidth(query).trim().toLowerCase();
    
    return markers.filter(marker => {
        const processedText = marker.text 
            ? Array.from(marker.text).map(c => fullToHalf(c)).join('')
            : '';
        const category = categoryMap[marker.image.replace(/\.png$/, '').replace(/-\w+$/, '')] || '其他';
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
    'exit': '出口',
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

        // 获取分类名称：除了去掉图标后缀名，还需要去掉-a、-b、-c1等文件名后缀
        const categoryName = categoryMap[marker.image.replace(/\.png$/, '').replace(/-\w+$/, '')] || '其他';
        
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

// 新增：检查指定坐标附近是否有标记点
async function checkNearbyMarkers(x, z) {
    const markers = await fetchMarkersData();
    return markers.some(marker => {
        const distance = Math.sqrt((marker.x - x) ** 2 + (marker.z - z) ** 2);
        return distance < 1;
    });
}

// 修改 triggerSearch 函数以处理空查询
async function triggerSearch() {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    const x = parseFloat(xInput.value);
    const z = parseFloat(zInput.value);
    
    const query = document.getElementById('search-input').value.trim();
    const selectedCategory = document.getElementById('category-filter').value; // 获取分类筛选参数
    
    // 检查附近是否有标记点（使用完整数据集）
    const hasNearbyMarkers = await checkNearbyMarkers(x, z);
    const noResultsElement = document.querySelector('.no-results');
    if (!hasNearbyMarkers) {
        // 1格范围内没有标记点，显示提示
        noResultsElement.style.display = 'block';
    } else {
        // 1格范围内有标记点，隐藏提示
        noResultsElement.style.display = 'none';
    }
    
    try {
        const results = await searchMarkers(query, selectedCategory); // 传递分类筛选参数
        renderResults(results);
        updatePreview();
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

    const pinLabel = document.querySelector('.pin-label');
    const currentLocation = document.querySelector('.search-item.selected .search-item-name');
    const locationDistance = document.querySelector('.search-item.selected .search-item-coordinate');
    if (!currentLocation || !locationDistance) { 
        //pinLabel.style.color = 'transparent';
    } else {
        const distance = locationDistance.textContent.match(/\d+/)[0];
        //console.log(distance);
        if (distance > 0) {
            //pinLabel.style.color = 'transparent';
            console.log('隐藏地址');
            if (window.location.href.includes('map.html')) {
                pinLabel.style.color = 'transparent';
                pinLabel.style.textShadow = 'none';
            }
        } else {
            pinLabel.textContent = currentLocation.textContent
            console.log('显示地址',pinLabel.textContent)
            // 对map.html执行以下代码
            if (window.location.href.includes('map.html')) {
                pinLabel.style.color = 'white';
                pinLabel.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }
        }
    }
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

// 添加拖拽事件监听器
const previewContainer = document.querySelector('.preview-container');
previewContainer.addEventListener('mousedown', startDrag);
previewContainer.addEventListener('touchstart', startDrag, { passive: false });
previewContainer.addEventListener('click', async (event) => {
    // 只有在非拖拽情况下才执行点击事件
    if (!isDragging) {
        const locationName = document.querySelector('.search-item.selected .search-item-name').textContent;
        await savePreviewImage(locationName);
    }
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

document.querySelector('.add-new-point').addEventListener('click', () => {
    const xCoordinate = document.getElementById('coordinates-x').value;
    const zCoordinate = document.getElementById('coordinates-z').value;
    openAddPointModal(xCoordinate, zCoordinate);
});

// 添加新标记点模态框相关功能
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

    // 生成添加标记点模态框中的分类选项
    const pointCategorySelect = document.getElementById('point-category');
    // 添加一个默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择分类';
    pointCategorySelect.appendChild(defaultOption);
    
    // 添加所有分类选项
    Object.keys(categoryMap).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = categoryMap[key];
        pointCategorySelect.appendChild(option);
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
        if (!queryParam) {
            setTimeout(() => {
                showToast('需要输入查询参数（q=）才能触发按分类搜索', 5000);
            }, 1000);
        }
    }

    const coordinateInputs = document.querySelectorAll('.coordinates');
    coordinateInputs.forEach(input => {
        input.addEventListener('input', () => {
            const x = xInput.value;
            const z = zInput.value;
            triggerSearch();
        });
    });

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
    triggerSearch();

    // 新增窗口大小监听
    window.addEventListener('resize', debounce(() => {
        adjustPreviewLayout();
    }, 200));
    
    // 添加模态框相关事件监听器
    document.getElementById('close-modal').addEventListener('click', closeAddPointModal);
    
    document.getElementById('copy-point-code').addEventListener('click', () => {
        const pointName = document.getElementById('point-name').value.trim();
        const pointCategory = document.getElementById('point-category').value;
        const xCoordinate = document.getElementById('coordinates-x').value;
        const zCoordinate = document.getElementById('coordinates-z').value;
        
        if (!pointName) {
            showToast('请输入标记点名称');
            return;
        }
        
        if (!pointCategory) {
            showToast('请选择分类');
            return;
        }
        
        // 生成标记点代码
        const markerCode = `{
    x: ${xCoordinate},
    z: ${zCoordinate},
    text: "${pointName}",
    image: "${pointCategory}.png"
},`;
        
        navigator.clipboard.writeText(markerCode).then(() => {
            showToast('标记点代码已复制到剪贴板');
        });
    });
    
    document.getElementById('send-via-email').addEventListener('click', () => {
        const pointName = document.getElementById('point-name').value.trim();
        const pointCategory = document.getElementById('point-category').value;
        const xCoordinate = document.getElementById('coordinates-x').value;
        const zCoordinate = document.getElementById('coordinates-z').value;
        
        // 生成标记点代码
        const markerCode = `{
    x: ${xCoordinate},
    z: ${zCoordinate},
    text: "${pointName}",
    image: "${pointCategory}.png"
},`;
        
        if (!pointName) {
            showToast('请输入标记点名称');
            return;
        }
        
        if (!pointCategory) {
            showToast('请选择分类');
            return;
        }
        
        // 生成邮件内容
        const subject = encodeURIComponent(`【新标记点申请】${pointName}`);
        const categoryName = categoryMap[pointCategory] || '其他';
        const body = encodeURIComponent(markerCode);
        const mailtoLink = `mailto:2020340248@qq.com?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoLink;
    });
    
    // 点击模态框外部关闭模态框
    document.getElementById('add-point-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAddPointModal();
        }
    });
    
    // 添加键盘事件监听器实现快捷键功能
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
});

// 处理键盘快捷键（保持原有函数名以确保向后兼容）
function handleKeyboardShortcuts(event) {
    handleKeyDown(event);
}

// 存储当前按下的键
const keysPressed = new Set();

// 处理键盘按下事件
function handleKeyDown(event) {
    // 检查是否在输入框中，如果在输入框中则不处理快捷键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
    }
    
    // 添加按下的键到集合中
    keysPressed.add(event.key.toLowerCase());
    
    // 处理移动
    processMovement(event);
}

// 处理键盘释放事件
function handleKeyUp(event) {
    // 从集合中移除释放的键
    keysPressed.delete(event.key.toLowerCase());
}

// 处理移动逻辑
function processMovement(event) {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    
    // 确保坐标输入框存在
    if (!xInput || !zInput) return;
    
    let x = parseFloat(xInput.value);
    let z = parseFloat(zInput.value);
    
    // 检查数值是否有效
    if (isNaN(x) || isNaN(z)) return;
    
    // 移动步长
    let step = 10; // 默认步长
    
    // 检查修饰键
    if (event.shiftKey) {
        step = 100; // Shift键按下时步长为100
    } else if (event.altKey) {
        step = 1; // Alt键按下时步长为1
    }
    
    // 检查对角线移动组合
    const isWPressed = keysPressed.has('w');
    const isAPressed = keysPressed.has('a');
    const isSPressed = keysPressed.has('s');
    const isDPressed = keysPressed.has('d');
    
    // 计算移动方向
    let moved = false;
    
    // 垂直方向
    if (isWPressed && !isSPressed) {
        z -= step;
        moved = true;
    } else if (isSPressed && !isWPressed) {
        z += step;
        moved = true;
    }
    
    // 水平方向
    if (isAPressed && !isDPressed) {
        x -= step;
        moved = true;
    } else if (isDPressed && !isAPressed) {
        x += step;
        moved = true;
    }
    
    // 如果有移动，则更新坐标
    if (moved) {
        // 更新坐标输入框
        xInput.value = x;
        zInput.value = z;
        
        // 标记为手动修改
        isCoordinatesEdited = true;
        
        // 触发更新
        xInput.dispatchEvent(new Event('input'));
        zInput.dispatchEvent(new Event('input'));
        
        // 触发搜索更新
        triggerSearch();
        
        // 阻止默认行为（如页面滚动）
        event.preventDefault();
    }
}

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

async function savePreviewImage(name) {
    triggerSearch();
    // 将.preview-container的图片下载
    const previewContainer = document.querySelector('.preview-container');
    const pinLabel = document.querySelector('.pin-label');
    const previewFooter = document.querySelector('.preview-footer');
    const locationDistance = document.querySelector('.search-item.selected .search-item-coordinate').textContent.match(/\d+/)[0];
    console.log(locationDistance);
    if (locationDistance == 0) {
        pinLabel.style.color = 'white';
        pinLabel.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    }
    previewFooter.style.display = 'flex';
    html2canvas(previewContainer, {
        backgroundColor: 'transparent',
        lineHeight: 1,
    }).then(canvas => {        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${name}${locationDistance > 0?'附近':''}卫星图像.png`;
        link.click();
    });
    // 不对map.html执行以下代码
    if (window.location.href.indexOf('map.html') === -1) {
        pinLabel.style.color = 'transparent';
        previewFooter.style.display = 'none';
        pinLabel.style.textShadow = 'none';
    }
}

function openAddPointModal(x,z) {
    const modal = document.getElementById('add-point-modal');
    modal.style.display = 'flex';
    
    // 设置坐标值
    document.getElementById('coordinates-x').value = x;
    document.getElementById('coordinates-z').value = z;
    
    // 设置模态框标题显示坐标
    const modalTitle = document.querySelector('.modal-title');
    modalTitle.textContent = `向(${x}, ${z})添加标记`;
    
    // 清空之前输入
    document.getElementById('point-name').value = '';
    document.getElementById('point-category').selectedIndex = 0;
}

function closeAddPointModal() {
    const modal = document.getElementById('add-point-modal');
    modal.style.display = 'none';
}
