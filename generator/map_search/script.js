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
        
        console.log("加载的脚本内容:", scriptContent); // 调试信息
        
        // 创建安全执行环境
        const sandbox = { UnminedCustomMarkers: null };
        // ✅ 移除 exports 参数，直接执行脚本返回值
        const func = new Function(`return (${scriptContent})`);
        sandbox.UnminedCustomMarkers = func();
        
        console.log("解析后的对象:", sandbox); // 调试信息
        
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
async function searchMarkers(query) {
    const markers = await fetchMarkersData();
    const normalizedQuery = convertToHalfWidth(query).trim().toLowerCase();
    
    return markers.filter(marker => {
        const processedText = marker.text 
            ? Array.from(marker.text).map(c => fullToHalf(c)).join('')
            : '';
        return processedText.toLowerCase().includes(normalizedQuery);
    });
}

// 5. 结果渲染函数
function renderResults(results) {
    const resultContainer = document.querySelector('.search-result');
    resultContainer.innerHTML = '';
    
    results.forEach((marker) => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.dataset.x = marker.x;  // 存储x坐标
        item.dataset.z = marker.z;  // 存储z坐标
        
        item.innerHTML = `
            <div class="search-item-name">${marker.text}</div>
            <div class="caption search-item-coordinate">${marker.x}, ${marker.z}</div>
        `;
        
        // 点击事件处理
        item.addEventListener('click', () => {
            // 更新输入框
            document.getElementById('coordinates-x').value = marker.x;
            document.getElementById('coordinates-z').value = marker.z;
            
            // 更新预览
            updatePreview();
        });
        
        resultContainer.appendChild(item);
    });
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
document.getElementById('coordinates-x').addEventListener('input', updatePreview);
document.getElementById('coordinates-z').addEventListener('input', updatePreview);
document.querySelector('.preview-container').addEventListener('click', async () => {
  await savePreviewImage();
});

document.addEventListener('DOMContentLoaded', () => {
    // 设置默认坐标
    document.getElementById('coordinates-x').value = -1334;
    document.getElementById('coordinates-z').value = -490;
    
    // 初始化预览
    updatePreview();
});

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