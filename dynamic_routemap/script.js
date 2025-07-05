let lineData = null;
let currentLine = null;
let currentDirection = false;
let currentStationIndex = -1;
let carCount = 6;
let selectedCar = 1;

// 添加一个标记来追踪动画触发来源
let shouldAnimate = false;

// 添加一个标记来追踪是否已显示站点剖面图功能提示
let hasShownSectionNotice = false;

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', function() {
    try {
        // 在DOMContentLoaded事件监听器中添加
        window.metro_name = metro_name; // 新增
        window.metro_name_en = metro_name_en; // 新增
        window.metro_logo = metro_logo;
        // 确保正确加载默认数据
        if (typeof lines !== 'undefined') {
        lineData = { lines: lines };
            // 初始化各个组件
        initializeLineSelect();
            initializeCarControls();
            initializeDisplayMode();
            initializeDoorButtons();
            initializeStationButtons();
            initializeFileUpload();
            initializeKeyboardShortcuts();
            initializeToggleButtons();

            // 自动选择第一条线路和第一个站点
            const lineSelect = document.getElementById('lineSelect');
            if (lineSelect && lineSelect.options.length > 1) {
                lineSelect.value = "0";
                currentLine = lineData.lines[0];
                currentStationIndex = 0;
                
                // 触发线路选择变化事件
                const event = new Event('change');
                lineSelect.dispatchEvent(event);
            }
        } else {
            console.error('未能加载默认线路数据');
            showToast('未能加载默认线路数据');
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('初始化失败，请刷新页面重试');
    }
});

// 事件监听器添加错误处理
function addSafeEventListener(element, event, handler) {
    element.addEventListener(event, function(e) {
        try {
            handler(e);
        } catch (error) {
            console.error(`${event} 处理出错:`, error);
        }
    });
}


// 添加线路颜色映射函数
function getLineColorByName(lineName) {
    const line = lines.find(l => l.name === lineName);
    return line ? line.color : null;
}

// 初始化线路选择下拉菜单
function initializeLineSelect() {
    const lineSelect = document.getElementById('lineSelect');
    lineSelect.innerHTML = '<option value="">选择线路</option>';
    
    if (lineData && lineData.lines) {
        // 过滤掉使用透明颜色的线路
        const visibleLines = lineData.lines.filter(line => !/^#[0-9A-Fa-f]{6}00$/.test(line.color));
        
        visibleLines.forEach((line, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = line.name;
            lineSelect.appendChild(option);
        });
        lineSelect.disabled = false;
        
        // 自动选择第一条线路
        lineSelect.value = "0";
        currentLine = visibleLines[0];
        
        // 设置起点站为第一站
        document.getElementById('startStation').value = "0";
        
        // 设置终点站为最后一站
        const lastStationIndex = currentLine.stations.length - 1;
        document.getElementById('endStation').value = lastStationIndex.toString();
        
        // 更新站点选择
        updateStationSelects();
        
        // 设置当前站为起点站并启用相关控件
        const currentSelect = document.getElementById('currentStation');
        currentSelect.value = "0";
        currentStationIndex = 0;
        
        // 启用上一站/下一站按钮
        document.getElementById('prevStation').disabled = false;
        document.getElementById('nextStation').disabled = false;
        
        // 更新路线图和站点详情
        updateRouteMap();
        if (document.getElementById('stationDetail').style.display === 'flex') {
            updateStationDetail();
        }
    }
}

// 线路选择变化处理
addSafeEventListener(document.getElementById('lineSelect'), 'change', function(e) {
    const lineIndex = e.target.value;
    if (lineIndex !== '') {
        currentLine = lineData.lines[lineIndex];
        
        // 获取当前线路的 maxCarCount
        const lineDetail = window.stationDetail.find(line => line.name === currentLine.name);
        const maxCarCount = lineDetail?.maxCarCount || 6;

        // 更新 carCount 并重置车厢控件
        carCount = maxCarCount;
        document.getElementById('carCount').textContent = carCount;
        updateCarSelection(); // 重新生成车厢选择按钮
        
        console.log('线路变化:', {
            线路: currentLine.name,
            总站点数: currentLine.stations.length,
            站点列表: currentLine.stations.map(s => s.name)
        });

        updateStationSelects();
        
        document.getElementById('startStation').value = "0";
        const lastStationIndex = currentLine.stations.length - 1;
        document.getElementById('endStation').value = lastStationIndex.toString();
        
        // 强制更新当前站列表
        const currentSelect = document.getElementById('currentStation');
        currentSelect.innerHTML = '<option value="">当前站</option>';
        
        // 添加所有站点
        currentLine.stations.forEach((station, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = station.name;
            currentSelect.appendChild(option);
        });
        
        // 设置为第一站
        currentSelect.value = "0";
        currentStationIndex = 0;
        currentSelect.disabled = false;
        
        updateRouteMap();
        // 如果当前是详情视图，更新站点序列
        if (document.getElementById('showDetail').checked) {
            updateStationDetail();
        }
    }
});

// 起终点站变化处理
['startStation', 'endStation'].forEach(id => {
    addSafeEventListener(document.getElementById(id), 'change', function() {
        if (!currentLine) return;

        // 获取当前选中的值
        const startIndex = parseInt(document.getElementById('startStation').value);
        const endIndex = parseInt(document.getElementById('endStation').value);

        console.log('起终点变化:', {
            线路: currentLine.name,
            起点站序号: startIndex,
            起点站名: currentLine.stations[startIndex]?.name || '无效',
            终点站序号: endIndex,
            终点站名: currentLine.stations[endIndex]?.name || '无效',
            方向: startIndex > endIndex ? '返程' : '正向'
        });

        // 只有当起点和终点都有效时才更新
        if (!isNaN(startIndex) && !isNaN(endIndex)) {
            // 先更新当前站下拉菜单
            const currentSelect = document.getElementById('currentStation');
            const shouldReverse = startIndex > endIndex;

            // 清空并重新填充选项
            currentSelect.innerHTML = '<option value="">当前站</option>';
            
            // 记录更新前的选项数量
            const beforeCount = currentSelect.options.length;

            // 按照实际运行顺序添加站点
            if (shouldReverse) {
                for (let i = startIndex; i >= endIndex; i--) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = currentLine.stations[i].name;
                    currentSelect.appendChild(option);
                }
            } else {
                for (let i = startIndex; i <= endIndex; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = currentLine.stations[i].name;
                    currentSelect.appendChild(option);
                }
            }

            // 记录更新后的信息
            console.log('当前站列表更新:', {
                更新前选项数: beforeCount,
                更新后选项数: currentSelect.options.length,
                应有选项数: Math.abs(endIndex - startIndex) + 2, // +2是因为包含起终点和空选项
                选项内容: Array.from(currentSelect.options).map(opt => opt.textContent)
            });

            // 设置当前站为起点站
            currentSelect.value = startIndex.toString();
            currentStationIndex = startIndex;
            
            // 启用相关控件
            currentSelect.disabled = false;
            document.getElementById('prevStation').disabled = false;
            document.getElementById('nextStation').disabled = false;

            // 更新路线图显示
            updateRouteMap();
            updateInfoBar();
        }
        // 如果当前是详情视图，更新站点序列
        if (document.getElementById('showDetail').checked) {
            updateStationDetail();
        }
    });
});

// 更新站点选择下拉菜单
function updateStationSelects() {
    const stations = currentLine.stations;
    
    // 更新起点站和终点站选择
    ['startStation', 'endStation'].forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;  // 保存当前选中的值
        
        select.innerHTML = `<option value="">${selectId === 'startStation' ? '起点站' : '终点站'}</option>`;
        stations.forEach((station, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = station.name;
            select.appendChild(option);
        });
        select.disabled = false;
        
        // 如果之前有选中的值，保持选中状态；否则设置默认值
        if (currentValue !== '') {
            select.value = currentValue;
        } else {
            // 默认选择第一站或最后一站
            select.value = selectId === 'startStation' ? "0" : (stations.length - 1).toString();
        }
    });

    // 更新当前站选择
    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    
    if (!isNaN(startIndex) && !isNaN(endIndex)) {
        const currentSelect = document.getElementById('currentStation');
        const currentValue = currentSelect.value;
        
        currentSelect.innerHTML = '<option value="">当前站</option>';
        
        // 根据起终点方向决定站点顺序
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const shouldReverse = startIndex > endIndex;
        
        // 按正确顺序添加站点
        for (let i = start; i <= end; i++) {
            const index = shouldReverse ? end - (i - start) : i;
            const option = document.createElement('option');
            option.value = index;
            option.textContent = stations[index].name;
            currentSelect.appendChild(option);
        }
        
        // 恢复之前选中的值，如果不在范围内则设为起点站
        if (currentValue !== '' && 
            ((shouldReverse && parseInt(currentValue) <= startIndex && parseInt(currentValue) >= endIndex) ||
             (!shouldReverse && parseInt(currentValue) >= startIndex && parseInt(currentValue) <= endIndex))) {
            currentSelect.value = currentValue;
            currentStationIndex = parseInt(currentValue);
        } else {
            currentSelect.value = startIndex.toString();
            currentStationIndex = startIndex;
        }
        
        currentSelect.disabled = false;
        document.getElementById('prevStation').disabled = false;
        document.getElementById('nextStation').disabled = false;
    }
}

// 方向变化处理
function initializeDoorButtons() {
    const doorToggle = document.getElementById('doorToggle');
    let isRightDoor = false;

    doorToggle.addEventListener('click', () => {
        isRightDoor = !isRightDoor;
        // 保持快捷键标识
        doorToggle.innerHTML = (isRightDoor ? '右侧车门' : '左侧车门') + '<span class="shortcut-key">D</span>';
        doorToggle.classList.toggle('right', isRightDoor);
        
        // 更新方向和显示
        currentDirection = isRightDoor;
        document.getElementById('routeMap').classList.toggle('direction-reverse', isRightDoor);
        updateRouteMap();
        
        if (document.getElementById('stationDetail').style.display === 'flex') {
            updateStationDetail();
        }
    });
}

// 当前站变化处理
addSafeEventListener(document.getElementById('currentStation'), 'change', function(e) {
    const stationIndex = e.target.value;
    if (stationIndex !== '') {
        updateCurrentStation(parseInt(stationIndex));
    }
});

// 上一站/下一站按钮处理
function initializeStationButtons() {
    const prevButton = document.getElementById('prevStation');
    const nextButton = document.getElementById('nextStation');

    prevButton.addEventListener('click', () => {
    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    const shouldReverse = startIndex > endIndex;

        // 计算当前站的前一站
        let prevIndex;
        if (shouldReverse) {
            prevIndex = currentStationIndex + 1;
            if (prevIndex <= startIndex && prevIndex >= endIndex) {
                updateCurrentStation(prevIndex);
            }
        } else {
            prevIndex = currentStationIndex - 1;
            if (prevIndex >= startIndex && prevIndex <= endIndex) {
                updateCurrentStation(prevIndex);
            }
        }
    });

    nextButton.addEventListener('click', () => {
    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    const shouldReverse = startIndex > endIndex;

        // 计算当前站的下一站
        let nextIndex;
        if (shouldReverse) {
            nextIndex = currentStationIndex - 1;
            if (nextIndex <= startIndex && nextIndex >= endIndex) {
                updateCurrentStation(nextIndex);
            }
        } else {
            nextIndex = currentStationIndex + 1;
            if (nextIndex >= startIndex && nextIndex <= endIndex) {
                updateCurrentStation(nextIndex);
            }
        }
    });
}

// 初始化线路状态相关控件
document.getElementById('swapStations').addEventListener('click', () => {
    const startSelect = document.getElementById('startStation');
    const endSelect = document.getElementById('endStation');
    const startValue = startSelect.value;
    const endValue = endSelect.value;
    
    // 交换起终点站
    startSelect.value = endValue;
    endSelect.value = startValue;
    
    // 切换车头方向
    const headDirection = document.querySelector('input[name="direction"]:checked');
    const newDirection = headDirection.value === 'head' ? 'tail' : 'head';
    document.querySelector(`input[name="direction"][value="${newDirection}"]`).click();
    
    // 切换车门方向
    document.getElementById('doorToggle').click();
    
    // 处理需要交换站台方向的站点
    if (currentLine) {
        currentLine.stations.forEach(station => {
            if (station.swapPlatform) {
                station.platformSide = station.platformSide === 'left' ? 'right' : 'left';
            }
        });
    }
    
    // 触发起点站变化事件以更新显示
    startSelect.dispatchEvent(new Event('change'));
});

// 更新路线图显示
function updateRouteMap() {
    const routeMap = document.getElementById('routeMap');
    routeMap.innerHTML = '';
    
    if (!currentLine || currentStationIndex === -1) return;

    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    
    // 根据起终点位置决定是否反向
    const shouldReverse = startIndex > endIndex;
    const effectiveDirection = shouldReverse ? !currentDirection : currentDirection;

    const stations = effectiveDirection ? [...currentLine.stations].reverse() : currentLine.stations;
    const totalStations = stations.length;
    const spacing = (routeMap.clientWidth - 72) / (totalStations - 1);  // 84 = 左12px + 右72px (60+12)

    stations.forEach((station, index) => {
        const originalIndex = effectiveDirection ? stations.length - 1 - index : index;
        const stationElement = createStationElement(station, index * spacing + 12);
        
        // 设置站点状态
        if (originalIndex === currentStationIndex) {
            stationElement.classList.add('current-station-active');
        } else if (shouldReverse ? 
            (originalIndex < currentStationIndex && originalIndex >= endIndex) ||
            (originalIndex === endIndex) :
            (originalIndex > currentStationIndex && originalIndex <= endIndex) ||
            (originalIndex === endIndex)) {
            stationElement.classList.add('station-active');
            stationElement.style.color = currentLine.color;
        } else {
            stationElement.classList.add('station-inactive');
            // 设置inactive状态下的transfer-line颜色
            stationElement.querySelectorAll('.transfer-line').forEach(transferLine => {
                transferLine.style.backgroundColor = '#6E7E81';
            });
        }

        routeMap.appendChild(stationElement);

        // 创建连接线
        if (index < totalStations - 1) {
            const connectionLine = createConnectionLine(index * spacing + 36, spacing - 11);
            
            // 获取这条连接线实际连接的两个站点的原始索引
            const leftStationIndex = effectiveDirection ? stations.length - 1 - index : index;
            const rightStationIndex = effectiveDirection ? stations.length - 2 - index : index + 1;
            
            // 设置连接线状态
            if (shouldReverse) {
                // 反向时的逻辑
                if (Math.min(leftStationIndex, rightStationIndex) === currentStationIndex) {
                    // 当前站前一站到当前站之间的连接线
                    connectionLine.classList.add('connection-line-current');
                    connectionLine.style.backgroundColor = currentLine.color;
                } else if (Math.max(leftStationIndex, rightStationIndex) <= currentStationIndex && 
                           Math.min(leftStationIndex, rightStationIndex) >= endIndex) {
                    // 当前站到终点站之间的连接线
                    connectionLine.classList.add('connection-line-active');
                    connectionLine.style.backgroundColor = currentLine.color;
                } else {
                    // 其他连接线
                    connectionLine.classList.add('connection-line-inactive');
                }
            } else {
                // 正向时的逻辑
                if (Math.max(leftStationIndex, rightStationIndex) === currentStationIndex) {
                    // 当前站前一站到当前站之间的连接线
                    connectionLine.classList.add('connection-line-current');
                    connectionLine.style.backgroundColor = currentLine.color;
                } else if (Math.min(leftStationIndex, rightStationIndex) >= currentStationIndex && 
                           Math.max(leftStationIndex, rightStationIndex) <= endIndex) {
                    // 当前站到终点站之间的连接线
                    connectionLine.classList.add('connection-line-active');
                    connectionLine.style.backgroundColor = currentLine.color;
                } else {
                    // 其他连接线
                    connectionLine.classList.add('connection-line-inactive');
                }
            }

            routeMap.appendChild(connectionLine);
        }
    });

    // 箭头方向只受direction选项影响
    document.getElementById('routeMap').classList.toggle('direction-reverse', currentDirection);

    updateInfoBar();
}

// 创建站点元素
function createStationElement(station, left) {
    const div = document.createElement('div');
    div.className = 'station';
    div.style.left = `${left}px`;
    div.dataset.stationIndex = currentLine.stations.indexOf(station);  // 添加站点索引数据
    
    const circle = document.createElement('div');
    circle.className = 'station-circle';
    
    const labels = document.createElement('div');
    labels.className = 'station-labels';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'station-name';
    nameDiv.textContent = station.name;
    
    const nameEnDiv = document.createElement('div');
    nameEnDiv.className = 'station-name-en';
    nameEnDiv.textContent = station.nameEN;
    
    labels.appendChild(nameDiv);
    labels.appendChild(nameEnDiv);
    div.appendChild(circle);
    div.appendChild(labels);

    // 添加点击事件
    div.addEventListener('click', () => {
        const stationIndex = parseInt(div.dataset.stationIndex);
        const startIndex = parseInt(document.getElementById('startStation').value);
        const endIndex = parseInt(document.getElementById('endStation').value);
        
        // 检查点击的站点是否在当前运行区间内
        if ((startIndex <= stationIndex && stationIndex <= endIndex) ||
            (startIndex >= stationIndex && stationIndex >= endIndex)) {
            updateCurrentStation(stationIndex);
        }
    });

    // 添加鼠标样式
    div.style.cursor = 'pointer';

    // 检查换乘线路
    const transferLines = findTransferLine(station.name);
    if (transferLines.length > 0) {
        // 创建一个容器来水平排列换乘线路
        const transferContainer = document.createElement('div');
        transferContainer.className = 'transfer-container';
        transferContainer.style.display = 'flex';  // 使用 flex 布局
        transferContainer.style.flexDirection = 'row';  // 水平排列
        transferContainer.style.justifyContent = 'center';  // 居中对齐
        transferContainer.style.gap = '2px';  // 设置间距
        
        transferLines.forEach(line => {
            // 检查是否为透明颜色
            const isTransparent = /^#[0-9A-Fa-f]{6}00$/.test(line.color);
            // 如果不是透明的才创建transfer-line元素
            if (!isTransparent) {
            const transferLine = document.createElement('div');
            transferLine.className = 'transfer-line';
            // 根据站点状态设置transfer-line的颜色
            if (div.classList.contains('station-inactive')) {
                transferLine.style.backgroundColor = '#6E7E81';
            } else {
                transferLine.style.backgroundColor = line.color;
            }
            transferLine.textContent = line.name.replace(/([0-9A-Z]+)(线|号线|路)$/, '$1');  // 仅在符合格式时去掉"线"、"号线"或"路"
                transferContainer.appendChild(transferLine);
            }
        });
        
        div.appendChild(transferContainer);
    }

    return div;
}

// 创建连接线元素
function createConnectionLine(left, width) {
    const line = document.createElement('div');
    line.className = 'connection-line';
    line.style.left = `${left - 17}px`;
    line.style.width = `${width + 6}px`;
  
    // 添加箭头
    const arrow = document.createElement('div');
    arrow.className = 'connection-arrow';
    line.appendChild(arrow);
    
    return line;
}

// 更新信息栏
function updateInfoBar() {
    if (!currentLine || currentStationIndex === -1) return;
    
    const infoBar = document.querySelector('.info-bar');
    const currentStationElement = infoBar.querySelector('.current-station');
    const terminalStationElement = infoBar.querySelector('.terminal-station');

    if (!currentStationElement || !terminalStationElement) return;

    infoBar.style.backgroundColor = currentLine.color;
    
    const lineName = document.querySelector('.line-name');
    lineName.innerHTML = `
        <div class="line-name-container">
            ${window.metro_logo ? 
                `<img src="${window.metro_logo}" alt="地铁标识">` : 
                ''}
            <div class="line-name-text" style="background-color: ${currentLine.color}">
                ${currentLine.name.replace(/([0-9A-Z]+)(线|号线|路)$/, '$1')}
            </div>
        </div>
    `;
    
    const currentStation = currentLine.stations[currentStationIndex];
    currentStationElement.innerHTML = `
        <div class="station-name">${currentStation.name}</div>
        <div class="station-name-en">${currentStation.nameEN}</div>
    `;
    
    const endIndex = parseInt(document.getElementById('endStation').value);
    const terminalStation = currentLine.stations[endIndex];
    terminalStationElement.textContent = `开往: ${terminalStation.name}`;
    
    // 调整终点站字号
    const textLength = terminalStationElement.textContent.length;
    if (textLength * 18 > 144) {  // 18px 是默认字号
        terminalStationElement.classList.add('long-text');
        terminalStationElement.style.setProperty('--text-length', textLength);
    } else {
        terminalStationElement.classList.remove('long-text');
        terminalStationElement.style.removeProperty('--text-length');
    }
}

// 检查换乘线路
function findTransferLine(stationName) {
    let transfers = [];
    lineData.lines.forEach(line => {
        if (line !== currentLine) {
            line.stations.forEach(station => {
                if (station.name === stationName) {
                    transfers.push(line);
                }
            });
        }
    });
    // 排除透明线路（颜色编号为六位十六进制数后面加00）
    transfers = transfers.filter(line => line.color.slice(-2) !== '00');
    return transfers;
}

// 初始化车厢控制
function initializeCarControls() {
    const decreaseBtn = document.getElementById('decreaseCars');
    const increaseBtn = document.getElementById('increaseCars');
    const carCountDisplay = document.getElementById('carCount');

    // 获取当前线路的 maxCarCount，若不存在则使用默认值6
    const lineDetail = window.stationDetail.find(line => line.name === currentLine?.name);
    const maxCarCount = lineDetail?.maxCarCount || 6;

    carCount = maxCarCount; // 设置初始值
    carCountDisplay.textContent = carCount;

    // 更新车厢选择按钮
    updateCarSelection();

    // 增加/减少车厢数量的逻辑
    decreaseBtn.addEventListener('click', () => {
        if (carCount > 1) {
            carCount--;
            carCountDisplay.textContent = carCount;
            if (selectedCar > carCount) {
                selectedCar = carCount;
            }
            updateCarSelection();
            if (document.getElementById('stationDetail').style.display === 'flex') {
                updateStationDetail();
            }
        }
    });

    increaseBtn.addEventListener('click', () => {
        if (carCount < maxCarCount) { // 限制不超过 maxCarCount
            carCount++;
            carCountDisplay.textContent = carCount;
            updateCarSelection();
            if (document.getElementById('stationDetail').style.display === 'flex') {
                updateStationDetail();
            }
        }
    });
}

// 更新车厢选择按钮
function updateCarSelection() {
    const carSelect = document.querySelector('.car-select.button-group');
    carSelect.innerHTML = '';
    
    const lineDetail = window.stationDetail.find(line => line.name === currentLine?.name);
    const maxCarCount = lineDetail?.maxCarCount || 6;

    for (let i = 1; i <= carCount && i <= maxCarCount; i++) { // 限制最大值
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `car${i}`;
        input.name = 'car';
        input.value = i;
        if (i === selectedCar) {
            input.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = `car${i}`;
        label.textContent = i;
        
        carSelect.appendChild(input);
        carSelect.appendChild(label);
    }

    // 添加车厢选择事件监听
    const carInputs = carSelect.querySelectorAll('input[type="radio"]');
    carInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            selectedCar = parseInt(e.target.value);
            if (document.getElementById('stationDetail').style.display === 'flex') {
                updateStationDetail();
            }
        });
    });
}

// 初始化显示模式
function initializeDisplayMode() {
    const routeRadio = document.getElementById('showRoute');
    const detailRadio = document.getElementById('showDetail');
    const routeMap = document.getElementById('routeMap');
    const stationDetail = document.getElementById('stationDetail');

    function updateDisplay() {
        if (routeRadio.checked) {
            routeMap.style.display = 'flex';
            stationDetail.style.display = 'none';
            shouldAnimate = false;  // 切换到路线图时重置标记
            // 强制重新计算路线图布局
            if (currentLine) {
                setTimeout(() => {
            updateRouteMap();
                }, 0);
            }
        } else {
            routeMap.style.display = 'none';
            stationDetail.style.display = 'flex';
            shouldAnimate = true;   // 切换到站点详情时设置标记
            // 更新站点详情
            if (currentLine) {
                updateStationDetail();
            }
        }
    }

    routeRadio.addEventListener('change', updateDisplay);
    detailRadio.addEventListener('change', updateDisplay);
}

// 更新站点详情显示
function updateStationDetail() {
    if (!currentLine || currentStationIndex === -1) return;
    
    let hasStationDetail = false;  // 声明在函数开头，使其在整个函数范围内可用
    
    // 调试信息：检查 stationDetail 数据
    if (!window.stationDetail) {
        console.error('站点详情数据未加载: stationDetail is undefined');
        showToast('站点详情数据未加载');
        return;
    }
    
    // 确保 stationDetail 是数组
    if (!Array.isArray(window.stationDetail)) {
        console.error('站点详情数据格式错误: stationDetail 不是数组');
        showToast('站点详情数据格式错误');
        return;
    }
    
    // 获取当前站点信息用于调试
    const currentStation = currentLine.stations[currentStationIndex];
    // 使用循环查找对应线路
    let currentLineDetail = null;
    for (let line of window.stationDetail) {
        if (line.name === currentLine.name) {
            currentLineDetail = line;
            break;
        }
    }
    
    // 检查是否找到线路详情和对应站点
    const hasDetail = Boolean(currentLineDetail && 
        currentLineDetail.stations.some(station => station.name === currentStation.name)
    );
    
    console.log('当前站点信息:', {
        线路: currentLine.name,
         站点: currentStation.name,
          是否有详情: hasDetail,
           详情数据: currentLineDetail
    });
    
    // 检查是否有站点详情数据
    hasStationDetail = Boolean(currentLineDetail && 
        currentLineDetail.stations && 
        currentLineDetail.stations.some(station => 
            station.name === currentStation.name
        ));
    
    // 获取站点序列和剖面图容器
    const stationSequence = document.querySelector('.station-sequence');
    const stationSection = document.querySelector('.station-section');
    
    // 根据是否有站点详情数据设置布局
    if (hasStationDetail) {
        stationSequence.style.setProperty('--sequence-width', '180px');
        stationSection.style.width = '384px';
        stationSection.style.setProperty('--section-display', 'flex');
        window.hasStationDetail = true;  // 存储状态供其他函数使用
    } else {
        stationSequence.style.setProperty('--sequence-width', '540px');
        stationSection.style.width = '0';
        stationSection.style.setProperty('--section-display', 'none');
        window.hasStationDetail = false;
    }
    
    // 更新站点序列
    updateStationSequence();
    
    // 更新车门状态
    updateDoorStatus(currentLine.stations[currentStationIndex]);

    renderStationSection(currentStation.name, currentLineDetail.name);
}

// 独立的更新车门状态函数
function updateDoorStatus(station) {
    const doorSide = document.getElementById('doorToggle').textContent.includes('右侧') ? 'right' : 'left';
    const platformSide = station.platformSide || 'left';  // 默认为 left

    // 确定开门文本
    let shouldOpenThisSide = false;
    if (platformSide === 'both') {
        shouldOpenThisSide = true;
    } else if (platformSide === 'none') {
        shouldOpenThisSide = false;
    } else {
        shouldOpenThisSide = doorSide === platformSide;
    }

    // 更新车门文本
    const doorTextZh = document.querySelector('.door-text .text-zh');
    const doorTextEn = document.querySelector('.door-text .text-en');
    const doorAnimation = document.querySelector('.door-animation');
    const exitArrow = document.querySelector('.exit-arrow');
    const noEntryMark = document.querySelector('.no-entry-mark');
    
    if (shouldOpenThisSide) {
        doorTextZh.textContent = '本侧开门';
        doorTextEn.textContent = 'Please exit from'+'\n'+'this side';
        doorAnimation.style.animation = 'doorGap 2s infinite';
        exitArrow.style.animation = 'arrowFloat 1s infinite alternate ease-in-out';
        noEntryMark.style.animation = 'none';
        noEntryMark.style.opacity = '0';
        exitArrow.style.opacity = '1';
    } else {
        doorTextZh.textContent = '对侧开门';
        doorTextEn.textContent = 'Please exit from'+'\n'+'the other side';
        doorAnimation.style.animation = 'none';
        exitArrow.style.animation = 'none';
        noEntryMark.style.animation = 'markBlink 1s steps(2) infinite';
        exitArrow.style.opacity = '0';
        noEntryMark.style.opacity = '1';
    }
}

// 更新简短线路图
function updateStationSequence() {
    if (!currentLine || currentStationIndex === -1) return;
    
    // 从父函数获取 hasStationDetail 的值
    const hasStationDetail = window.hasStationDetail;
    
    const stationList = document.querySelector('.station-sequence .station-list');
    stationList.innerHTML = '';
    
    const endIndex = parseInt(document.getElementById('endStation').value);
    const startIndex = parseInt(document.getElementById('startStation').value);
    
    // 确定是否需要反转顺序
    const isDoorRight = document.getElementById('doorToggle').textContent.includes('右侧');
    const isReturnTrip = startIndex > endIndex;
    // 当车门在右侧或者是返程时需要反转顺序，但如果两种情况同时存在则抵消
    const isReverse = isDoorRight !== isReturnTrip;
    
    // 获取要显示的站点的索引
    const stationCount = hasStationDetail ? 3 : 5;  // 根据是否显示详情决定显示站点数
    const sideStationCount = Math.floor((stationCount - 1) / 2);  // 当前站两侧各显示几个站
    
    let indices = [];
    if (hasStationDetail) {
        // 显示详情时只显示3站
        if (currentStationIndex === 0) {
            // 第一站：显示前3站
            indices = [0, 1, 2];
        } else if (currentStationIndex === currentLine.stations.length - 1) {
            // 最后一站：显示后3站
            indices = Array.from({length: 3}, (_, i) => currentLine.stations.length - 3 + i);
        } else {
            // 其他情况：显示当前站及其前后站
            indices = [currentStationIndex - 1, currentStationIndex, currentStationIndex + 1];
        }
    } else {
        // 不显示详情时显示5站
        if (currentStationIndex <= sideStationCount) {
            // 如果是开头几站，显示前5站
            indices = Array.from({length: stationCount}, (_, i) => i);
        } else if (currentStationIndex >= currentLine.stations.length - sideStationCount) {
            // 如果是末尾几站，显示后5站
            indices = Array.from({length: stationCount}, (_, i) => currentLine.stations.length - stationCount + i);
        } else {
            // 否则显示当前站及其前后两站
            for (let i = -sideStationCount; i <= sideStationCount; i++) {
                indices.push(currentStationIndex + i);
            }
        }
    }
    
    // 如果需要反转顺序
    if (isReverse) {
        indices.reverse();
    }
    
    // 计算站点间距
    const totalWidth = stationList.offsetWidth;
    const spacing = hasStationDetail ? 
        // 显示3站时使用更大的间距（将总宽度除以3，这样两端和站点间的间距都相等）
        totalWidth / 3 : 
        // 显示5站时保持原有间距
        totalWidth / 6;
    
    // 创建连接线（包括两端）
    for (let i = 0; i <= indices.length; i++) {
        const line = document.createElement('div');
        line.className = 'connection-line';
        line.style.left = hasStationDetail ?
            // 显示3站时，从1/6处开始，再左移14px
            `${(totalWidth / 12) + (i * spacing) - 14}px` :
            // 显示5站时保持原有位置
            `${i * spacing}px`;
        line.style.width = hasStationDetail ? `${spacing - 6 }px` : `${spacing}px`;
        
        // 确定连接线状态
        const leftStationIndex = i === 0 ? undefined : indices[i - 1];
        const rightStationIndex = i === indices.length ? undefined : indices[i];
        const connectedStation = i === 0 ? rightStationIndex : 
                                i === indices.length ? leftStationIndex :
                                undefined;
        
        // 判断这个连接线是否连接了闪烁的箭头
        const hasBlinkingArrow = i > 0 && i < indices.length && (
            // 获取上一站的索引
            (() => {
                const prevStationIndex = startIndex <= endIndex ? 
                    currentStationIndex - 1 : 
                    currentStationIndex + 1;
                
                return isDoorRight ?
                    // 右侧车门时，闪烁当前站左边的箭头
                    (leftStationIndex === currentStationIndex && rightStationIndex === prevStationIndex) :
                    // 左侧车门时，闪烁当前站右边的箭头
                    (leftStationIndex === prevStationIndex && rightStationIndex === currentStationIndex);
            })()
        );
        
        // 检查两端连接线是否连接了终点站或当前站
        const isEndOrCurrentStationConnection = connectedStation === endIndex || connectedStation === currentStationIndex;
        
        // 检查连接的站点是否是灰色站点
        const isGrayStation = connectedStation !== undefined && 
            ((startIndex <= endIndex && 
              (connectedStation < currentStationIndex || connectedStation > endIndex)) ||
             (startIndex > endIndex && 
              (connectedStation > currentStationIndex || connectedStation < endIndex)));
        
        // 1. 首先检查是否是两端的连接线
        if (i === 0 || i === indices.length) {
            line.style.backgroundColor = (isEndOrCurrentStationConnection || isGrayStation) ? '#6e7e81' : currentLine.color;
            line.classList.add('edge-line');
            // 如果是右端连接线，添加反转类
            if (i === indices.length) {
                line.classList.add('reverse');
            }
        }
        // 2. 检查是否是当前站左右两侧的连接线
        else if (leftStationIndex === currentStationIndex || 
             rightStationIndex === currentStationIndex || 
             connectedStation === currentStationIndex) {
            // 如果这段连接线没有闪烁的箭头且连接了灰色站点，则设为灰色
            if (!hasBlinkingArrow && 
                ((leftStationIndex !== undefined && 
                  ((startIndex <= endIndex && (leftStationIndex < currentStationIndex || leftStationIndex > endIndex)) ||
                   (startIndex > endIndex && (leftStationIndex > currentStationIndex || leftStationIndex < endIndex)))) ||
                 (rightStationIndex !== undefined &&
                  ((startIndex <= endIndex && (rightStationIndex < currentStationIndex || rightStationIndex > endIndex)) ||
                   (startIndex > endIndex && (rightStationIndex > currentStationIndex || rightStationIndex < endIndex)))))) {
                line.style.backgroundColor = '#6e7e81';
            } else {
                line.style.backgroundColor = currentLine.color;
            }
        }
        // 3. 检查是否是灰色车站左右两侧的连接线
        else if ((leftStationIndex !== undefined || rightStationIndex !== undefined) &&
                 ((startIndex <= endIndex && 
                   (leftStationIndex < currentStationIndex || leftStationIndex > endIndex ||
                    rightStationIndex < currentStationIndex || rightStationIndex > endIndex)) ||
                 (startIndex > endIndex &&
                  (leftStationIndex > currentStationIndex || leftStationIndex < endIndex ||
                   rightStationIndex > currentStationIndex || rightStationIndex < endIndex)))) {
            line.style.backgroundColor = '#6e7e81';
        } else {
            // 4. 其余连接线设为线路颜色
            line.style.backgroundColor = currentLine.color;
        }
         
        // 只在非两端的连接线上添加箭头
        if (i > 0 && i < indices.length) {
            const arrow = document.createElement('div');
            arrow.className = 'connection-arrow';
            
            // 计算上一站的索引（也就是实际所在的站）
            let previousStationIndex;
            if (isReverse) {
                previousStationIndex = currentStationIndex + 1;
            } else {
                previousStationIndex = currentStationIndex - 1;
            }
            
            // 在创建箭头时判断是否应该闪烁
            if (i > 0 && i < indices.length) {
                const arrow = document.createElement('div');
                arrow.className = 'connection-arrow';
                
                // 获取这个箭头连接的两个站点索引
                const leftStationIndex = indices[i-1];
                const rightStationIndex = indices[i];
                
                // 根据车门方向调整闪烁判断逻辑
                if (isDoorRight) {
                    // 右侧车门时，闪烁当前站右边的箭头
                    if (leftStationIndex === currentStationIndex) {
                        arrow.classList.add('connection-arrow-current');
                    }
                } else {
                    // 左侧车门时保持原有逻辑
                    if ((leftStationIndex === previousStationIndex && rightStationIndex === currentStationIndex) ||
                        (leftStationIndex === currentStationIndex && rightStationIndex === previousStationIndex)) {
                        arrow.classList.add('connection-arrow-current');
                    }
                }
                
                // 根据车门方向设置箭头方向
                if (isDoorRight) {
                    arrow.classList.add('direction-reverse');
                }
                
                line.appendChild(arrow);
            }
        }
         
        stationList.appendChild(line);
    }
    
    // 创建站点
    indices.forEach((index, i) => {
        const station = currentLine.stations[index];
        
        // 确定站点状态
        let stationClass = '';
        let circleColor = '#6e7e81';  // 默认为灰色
        let textColor = '#6e7e81';
        
        if (index === currentStationIndex) {
            // 当前站保持红色
            stationClass = 'current-station-active';
            circleColor = '#850000';
            textColor = '#000000';
        } else if ((startIndex <= endIndex && 
                    index > currentStationIndex && 
                    index <= endIndex) ||
                  (startIndex > endIndex && 
                    index < currentStationIndex && 
                    index >= endIndex)) {
            // 当前站到终点站之间的站点使用线路颜色
            stationClass = 'station-active';
            circleColor = currentLine.color;
            textColor = '#000000';
        } else {
            // 其他站点使用灰色
            stationClass = 'station-inactive';
            textColor = '#6e7e81';
        }
        
        // 创建站点元素
        const div = document.createElement('div');
        div.className = `station ${stationClass}`.trim();
        div.style.left = hasStationDetail ? `${spacing + i * spacing - 12 }px` : `${spacing + i * spacing - 4 }px`;
        
        // 添加站点圆圈和标签
        const circle = document.createElement('div');
        circle.className = 'station-circle';
        circle.style.borderColor = circleColor;
        
        const labels = document.createElement('div');
        labels.className = 'station-labels';
        labels.style.color = textColor;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'station-name';
        nameDiv.textContent = station.name;
        
        const nameEnDiv = document.createElement('div');
        nameEnDiv.className = 'station-name-en';
        nameEnDiv.textContent = station.nameEN;
        
        labels.appendChild(nameDiv);
        labels.appendChild(nameEnDiv);
        div.appendChild(circle);
        div.appendChild(labels);
        
        stationList.appendChild(div);
    });
}

// 更新当前站点
function updateCurrentStation(newIndex) {
    // 确保 newIndex 在有效范围内
    if (newIndex < 0 || newIndex >= currentLine.stations.length) {
        return; // 如果超出范围，直接返回
    }
    
    currentStationIndex = newIndex;
    document.getElementById('currentStation').value = newIndex;
    updateRouteMap();
    updateInfoBar();
    
    // 如果当前是详情视图，也更新站点详情
    if (document.getElementById('stationDetail').style.display === 'flex') {
        updateStationDetail();
    }
    
    // 更新动作按钮文本
    updateActionButtonText();

    shouldAnimate = true;  // 切换站点时设置标记
}

// 初始化车门按钮
function initializeDoorButtons() {
    const doorToggle = document.getElementById('doorToggle');
    let isRightDoor = false;

    doorToggle.addEventListener('click', () => {
        isRightDoor = !isRightDoor;
        // 保持快捷键标识
        doorToggle.innerHTML = (isRightDoor ? '右侧车门' : '左侧车门') + '<span class="shortcut-key">D</span>';
        doorToggle.classList.toggle('right', isRightDoor);
        
        // 更新方向和显示
        currentDirection = isRightDoor;
        document.getElementById('routeMap').classList.toggle('direction-reverse', isRightDoor);
            updateRouteMap();
        
        if (document.getElementById('stationDetail').style.display === 'flex') {
            updateStationDetail();
        }
    });
}

// 初始化文件上传
function initializeFileUpload() {
    const uploadButton = document.getElementById('uploadData');
    const fileInput = document.getElementById('fileInput');
    const dragOverlay = document.querySelector('.drag-overlay');

    // 阻止默认拖放行为
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverlay.classList.add('active');
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 检查鼠标是否真的离开了窗口
        const rect = document.body.getBoundingClientRect();
        if (e.clientX <= rect.left || e.clientX >= rect.right ||
            e.clientY <= rect.top || e.clientY >= rect.bottom) {
            dragOverlay.classList.remove('active');
        }
    });

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverlay.classList.remove('active');

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

// 处理文件上传
async function handleFileUpload(file) {
    try {
        const content = await file.text();
        const scope = {};
        const execute = new Function('scope', content + 
            '; scope.lines = lines;' +
            ' scope.metro_logo = metro_logo;' +
            ' scope.metro_name = metro_name;' +
            ' scope.metro_name_en = metro_name_en;' +
            ' return scope;'
        );
        const data = execute(scope);

        // 更新全局变量
        window.lines = data.lines;
        window.metro_logo = data.metro_logo;
        window.metro_name = data.metro_name; // 确保没有默认值覆盖
        window.metro_name_en = data.metro_name_en; // 确保没有默认值覆盖
        lineData = { lines: window.lines };

        // 重置当前选中的线路和站点
        currentLine = null;
        currentStationIndex = -1;

        // 重置所有选择框
        document.getElementById('startStation').value = '';
        document.getElementById('endStation').value = '';
        document.getElementById('currentStation').value = '';

        // 清空路线图显示
        document.getElementById('routeMap').innerHTML = '';
        document.querySelector('.info-bar .line-name').innerHTML = '';
        document.querySelector('.info-bar .current-station').innerHTML = '';
        document.querySelector('.info-bar .terminal-station').innerHTML = '';

        // 重新初始化线路选择并自动选择第一条线路
        initializeLineSelect();
        const lineSelect = document.getElementById('lineSelect');
        if (lineSelect.options.length > 1) {
            lineSelect.value = "0";
            const event = new Event('change');
            lineSelect.dispatchEvent(event);
        }

        // 隐藏默认数据提示
        const defaultNotice = document.querySelector('.default-data-notice');
        if (defaultNotice) {
            defaultNotice.style.display = 'none';
        }

        console.log('导入的地铁名称:', window.metro_name);
        console.log('导入的地铁英文名称:', window.metro_name_en);

        showToast('数据导入成功！');
    } catch (error) {
        console.error('数据解析失败:', error);
        showToast('数据格式错误，请确保文件格式正确！');
    }
}

// 初始化键盘快捷键
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // 只有在没有输入框获得焦点时才处理快捷键
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'SELECT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            
            switch(e.key.toLowerCase()) {
                case 'r':  // R 键 - 返程
                    document.getElementById('swapStations').click();
                    break;
                case 'd':  // D 键 - 切换车门
                    document.getElementById('doorToggle').click();
                    break;
                case '\\':  // \ 键 - 切换显示模式
                    const currentMode = document.querySelector('input[name="display"]:checked');
                    const nextMode = currentMode.value === 'route' ? 
                        document.getElementById('showDetail') : 
                        document.getElementById('showRoute');
                    nextMode.click();
                    break;
                case 'enter':  // 回车键 - 触发动作按钮
                    document.getElementById('actionButton').click();
                    break;
                case 'arrowleft':  // 左方向键 - 上一站
                    if (!document.getElementById('prevStation').disabled) {
                        document.getElementById('prevStation').click();
                    }
                    break;
                case 'arrowright':  // 右方向键 - 下一站
                    if (!document.getElementById('nextStation').disabled) {
                        document.getElementById('nextStation').click();
                    }
                    break;
            }
        }
    });
}

// 初始化折叠/展开按钮
function initializeToggleButtons() {
    const trainStatusButton = document.getElementById('toggleTrainStatus');
    const lineStatusButton = document.getElementById('toggleLineStatus');
    const immersiveButton = document.getElementById('toggleImmersive');
    const trainStatus = document.querySelector('.train-status');
    const lineStatus = document.querySelector('.line-status');
    
    // 初始化沉浸模式状态
    let isImmersive = false;

    // 切换沉浸模式的函数
    function toggleImmersive() {
        isImmersive = !isImmersive;
        document.body.classList.toggle('immersive', isImmersive);
        immersiveButton.classList.toggle('active', isImmersive);
    }

    // 添加沉浸模式按钮点击事件
    immersiveButton.addEventListener('click', toggleImmersive);

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'SELECT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            if (e.key.toLowerCase() === 'i') {
                toggleImmersive();
            }
        }
    });

    // 在窗口高度较小时自动收起另一个面板
    function autoCollapseOther(currentPanel) {
        if (window.innerHeight / window.innerWidth <= 0.4) {
            if (currentPanel === 'train') {
                lineStatus.style.display = 'none';
                lineStatusButton.classList.add('collapsed');
            } else {
                trainStatus.style.display = 'none';
                trainStatusButton.classList.add('collapsed');
            }
        }
    }

    trainStatusButton.addEventListener('click', () => {
        if (!isImmersive) {  // 只在非沉浸模式下响应
            trainStatus.style.display = trainStatus.style.display === 'none' ? 'flex' : 'none';
            trainStatusButton.classList.toggle('collapsed');
            if (trainStatus.style.display === 'flex') {
                autoCollapseOther('train');
            }
        }
    });

    lineStatusButton.addEventListener('click', () => {
        if (!isImmersive) {  // 只在非沉浸模式下响应
            lineStatus.style.display = lineStatus.style.display === 'none' ? 'flex' : 'none';
            lineStatusButton.classList.toggle('collapsed');
            if (lineStatus.style.display === 'flex') {
                autoCollapseOther('line');
            }
        }
    });

    // 根据网页高度设置初始状态
    function updateInitialState() {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        // 只在非沉浸模式下调整面板显示
        if (!isImmersive) {
            // 处理列车状态面板
            if (windowHeight / windowWidth > 0.36) {
                trainStatus.style.display = 'flex';
                trainStatusButton.classList.remove('collapsed');
            } else {
                trainStatus.style.display = 'none';
                trainStatusButton.classList.add('collapsed');
            }

            // 处理线路状态面板
            if (windowHeight / windowWidth > 0.4) {
                lineStatus.style.display = 'flex';
                lineStatusButton.classList.remove('collapsed');
            } else {
                lineStatus.style.display = 'none';
                lineStatusButton.classList.add('collapsed');
            }
        }

        // 根据窗口宽度设置缩放比例
        document.body.style.zoom = windowWidth / 800 * 100 + '%';
    }

    // 初始化时调用一次
    updateInitialState();

    // 监听窗口大小变化
    window.addEventListener('resize', updateInitialState);
}

// 初始化动作按钮
function initializeActionButton() {
    const actionButton = document.getElementById('actionButton');
    
    actionButton.addEventListener('click', () => {
        const endIndex = parseInt(document.getElementById('endStation').value);
        const displayMode = document.querySelector('input[name="display"]:checked').value;
        
        if (displayMode === 'detail') {
            // 当前在站点详情视图
            if (currentStationIndex === endIndex) {
                // 如果是终点站，触发折返
                document.getElementById('swapStations').click();
            } else {
                // 不是终点站，切换到下一站
                document.getElementById('nextStation').click();
            }
            // 切换到路线图视图
            document.getElementById('showRoute').click();
        } else {
            // 当前在路线图视图，切换到站点详情
            document.getElementById('showDetail').click();
        }
    });
}

// 更新动作按钮文本
function updateActionButtonText() {
    const actionButton = document.getElementById('actionButton');
    const displayMode = document.querySelector('input[name="display"]:checked').value;
    const endIndex = parseInt(document.getElementById('endStation').value);
    
    if (displayMode === 'detail') {
        // 在站点详情视图
        if (currentStationIndex === endIndex) {
            actionButton.textContent = '开始折返';
        } else {
            actionButton.textContent = '准备发车';
        }
    } else {
        // 在路线图视图
        actionButton.textContent = '到站停靠';
    }
    // 添加快捷键提示
    actionButton.innerHTML = actionButton.textContent + '<span class="shortcut-key" style="color: white">↵</span>';
}

// 在显示模式切换时更新按钮文本
document.querySelectorAll('input[name="display"]').forEach(radio => {
    radio.addEventListener('change', updateActionButtonText);
});

// 在页面加载时初始化动作按钮
window.addEventListener('DOMContentLoaded', function() {
    // ... 现有代码 ...
    initializeActionButton();
    updateActionButtonText();
});

// 在起终点站变化时也更新按钮文本
document.getElementById('startStation').addEventListener('change', updateActionButtonText);
document.getElementById('endStation').addEventListener('change', updateActionButtonText);

// 显示模式切换处理
document.querySelectorAll('input[name="display"]').forEach(radio => {
    radio.addEventListener('change', function(e) {
        const routeMap = document.getElementById('routeMap');
        const stationDetail = document.getElementById('stationDetail');
        
        if (e.target.value === 'detail') {
            routeMap.style.display = 'none';
            stationDetail.style.display = 'flex';
            updateStationDetail();
        } else {
            routeMap.style.display = 'flex';
            stationDetail.style.display = 'none';
        }
        
        // 更新动作按钮文本
        updateActionButtonText();
    });
});

// 初始化报站按钮
function initializeAnnouncementButton() {
    const announcementButton = document.getElementById('announcementButton');
    announcementButton.addEventListener('click', () => {
        playAnnouncement();
    });

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'SELECT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            if (e.key.toLowerCase() === 'a') {
                playAnnouncement();
            }
        }
    });
}

// 播放报站内容
function playAnnouncement() {
    const currentStation = currentLine.stations[currentStationIndex];
    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    const isStartStation = currentStationIndex <= startIndex + 1 && currentStationIndex >= startIndex - 1;
    const isEndStation = currentStationIndex === endIndex;
    const terminalStation = currentLine.stations[endIndex];
    const metroName = window.metro_name;
    const metroNameEN = window.metro_name_en;

    // 获取当前线路最后一站
    const lastStation = currentLine.stations[currentLine.stations.length - 1];
    const isLastStation = terminalStation === lastStation;

    const currentStationNameEN = replaceAbbreviationsWithWords(currentStation.nameEN);
    const terminalStationNameEN = replaceAbbreviationsWithWords(terminalStation.nameEN);
    const lastStationNameEN = replaceAbbreviationsWithWords(lastStation.nameEN);

    //console.log(currentStationNameEN, terminalStationNameEN, lastStationNameEN);

    // 获取当前站的 platformSide 值
    const platformSideEN = currentStation.platformSide || 'left';  // 默认为左侧车门
    const platformSide = platformSideEN === 'right' ? '右侧' : '左侧';

    // 检查当前站是否有 swapPlatform 参数
    const swapPlatform = currentStation.swapPlatform || false;

    // 确定实际的车门方向
    const actualDoorSide = swapPlatform ? (platformSide === '右侧' ? '左侧' : '右侧') : platformSide;
    const actualDoorSideEN = actualDoorSide === '右侧' ? 'right' : 'left';

    let announcements = [];

    // 初始化 transfers 变量
    const transfers = findTransferLine(currentStation.name);

    // 中文报站
    if (isStartStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `欢迎乘坐${metroName}，祝您出行愉快！本次列车终点站：${terminalStation.name}，`, gender: 'female' },
                { text: `下一站：${currentStation.name}。列车开启前进方向${actualDoorSide}车门，请下车的乘客做好准备。`, gender: 'female' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && transfers.length === 0) {
            announcements.push(
                { text: `${currentStation.name}到了，请从列车前进方向${actualDoorSide}车门下车。`, gender: 'female' },
            );
        }
    } else if (isEndStation && !isLastStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `列车启动，请扶好站稳。下一站为本次列车的终点站：${currentStation.name}。列车开启前进方向${actualDoorSide}车门，`, gender: 'female' },
                { text: `请前往${lastStation.name}方向的乘客在该站下车搭乘后续列车，请全体乘客做好下车准备。`, gender: 'female' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail') {
            announcements.push(
                { text: `终点站${currentStation.name}到了，前往${lastStation.name}方向的乘客请在该站下车搭乘后续列车，欢迎您再次乘坐${metroName}。`, gender: 'female' },
            );
        }
    } else if (isEndStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `列车启动，请扶好站稳。下一站为本次列车的终点站：${currentStation.name}。列车开启前进方向${actualDoorSide}车门，请全体乘客做好下车准备。`, gender: 'female' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail') {
            announcements.push(
                { text: `终点站${currentStation.name}到了，欢迎您再次乘坐${metroName}。`, gender: 'female' },
            );
        }
    } else {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `列车启动，请扶好站稳。下一站：${currentStation.name}。列车开启前进方向${actualDoorSide}车门，请下车的乘客做好准备。`, gender: 'female' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && transfers.length === 0) {
            announcements.push(
                { text: `${currentStation.name}到了，请从列车前进方向${actualDoorSide}车门下车`, gender: 'female' },
            );
        }
    }

    // 处理换乘信息
    if (transfers.length > 0) {
        const transferLineName = transfers.map(transfer => transfer.name).join('、');
        let transferLineNameEN = transfers.map(transfer => transfer.nameEN || transfer.name).join(',');

        // 将 transferLineNameEN 中的数字转换为英文单词
        transferLineNameEN = replaceNumbersWithWords(transferLineNameEN);

        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `换乘${transferLineName}的乘客请在该站下车，请您注意换乘时间，合理安排行程。`, gender: 'female' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && !isEndStation) {
            announcements.push(
                { text: `${currentStation.name}到了，换乘${transferLineName}的乘客，请从列车前进方向${actualDoorSide}车门下车。`, gender: 'female' },
            );
        }
    }

    // 英文报站
    if (isStartStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `Welcome to take ${metroNameEN || metroName}. We wish you have a pleasant trip. The destination of the train is ${terminalStation.nameEN || terminalStation.name}.`, gender: 'male' },
                { text: `The next station is ${currentStationNameEN || currentStation.name}. The ${actualDoorSideEN} door will be used.`, gender: 'male' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && transfers.length === 0) {
            announcements.push(
                { text: `${currentStation.name}到了，请从列车前进方向${actualDoorSide}车门下车。`, gender: 'female' },
                { text: `We are arriving at ${currentStationNameEN || currentStation.name}. The ${actualDoorSideEN} door will be used.`, gender: 'male' },
            );
        }
    } else if (isEndStation && !isLastStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `The next station is ${currentStationNameEN || currentStation.name}, the destination of the train. The ${actualDoorSideEN} door will be used.`, gender: 'male' },
                { text: `Passengers heading towards ${lastStationNameEN || lastStation.name} pleas alight at this station, and transfer to the following service. All the passengers, please prepare to get off.`, gender: 'male' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail') {
            announcements.push(
                { text: `We are arriving at ${currentStationNameEN || currentStation.name}, the destination of the train. Passengers heading towards ${lastStationNameEN || lastStation.name} pleas alight at this station, `, gender: 'male' },
                { text: `and transfer to the following service. Welcome to take ${metroNameEN || metroName} again.`, gender: 'male' },
            );
        }
    } else if (isEndStation) {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `The next station is ${currentStationNameEN || currentStation.name}, the destination of the train. All the passengers, please prepare to get off.`, gender: 'male' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail') {
            announcements.push(
                { text: `We are arriving at ${currentStationNameEN || currentStation.name}, the destination of the train. Welcome to take ${metroNameEN || metroName} again.`, gender: 'male' },
            );
        }
    } else {
        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `The next station is ${currentStationNameEN || currentStation.name}. The ${actualDoorSideEN} door will be used.`, gender: 'male' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && transfers.length === 0) {
            announcements.push(
                { text: `We are arriving at ${currentStationNameEN || currentStation.name}, The ${actualDoorSideEN} door will be used.`, gender: 'male' },
            );
        }
    }

    // 处理换乘信息
    if (transfers.length > 0) {
        const transferLineName = transfers.map(transfer => transfer.name).join('、');
        let transferLineNameEN = transfers.map(transfer => transfer.nameEN || transfer.name).join(',');

        // 将 transferLineNameEN 中的数字转换为英文单词
        transferLineNameEN = replaceNumbersWithWords(transferLineNameEN);

        if (document.querySelector('input[name="display"]:checked').value === 'route') {
            announcements.push(
                { text: `Passengers for ${transferLineNameEN}, please prepare to get off. Please pay attention to transfer time,and arrange your travel properly.`, gender: 'male' },
            );
        } else if (document.querySelector('input[name="display"]:checked').value === 'detail' && !isEndStation) {
            announcements.push(
                { text: `We are arriving at ${currentStationNameEN || currentStation.name}. Passengers for ${transferLineNameEN} please get off at this station. The ${actualDoorSideEN} door will be used.`, gender: 'male' },
            );
        }
    }

    // 处理车站英文名
    announcements = announcements.map(announcement => {
        if (currentStationNameEN === currentStationNameEN.toUpperCase() && /^[A-Z0-9'-]+$/.test(currentStationNameEN)) {
            return { text: announcement.text.replace(currentStationNameEN, currentStation.name), gender: announcement.gender };
        }
        return announcement;
    });
    announcements = announcements.map(announcement => {
        if (terminalStationNameEN === terminalStationNameEN.toUpperCase()) {
            return { text: announcement.text.replace(terminalStationNameEN, terminalStation.name), gender: announcement.gender };
        }
        return announcement;
    });
    announcements = announcements.map(announcement => {
        if (lastStationNameEN === lastStationNameEN.toUpperCase()) {
            return { text: announcement.text.replace(lastStationNameEN, lastStation.name), gender: announcement.gender };
        }
        return announcement;
    });

    console.log('线网名称：' + window.metro_name);  // 应该输出 "临东地铁"
    console.log('线网英文名：' + window.metro_name_en);  // 应该输出 "Lindong Metro"

    // 播放报站内容
    announcements.forEach((announcement, index) => {
        setTimeout(() => {
            speak(announcement.text, index, announcement.gender);
            showToast(announcement.text);
        }, index * 1500); // 每条播报间隔1.5秒
    });
}

// 将公告中的所有数字转换为英文单词
function replaceNumbersWithWords(text) {
    return text.replace(/\b\d+\b/g, match => numberToWords(parseInt(match)));
}

// 数字转英文单词
function numberToWords(number) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const thousands = ["", "thousand", "million", "billion", "trillion"];

    function convertChunk(chunk) {
        let output = "";
        if (chunk >= 100) {
            output += ones[Math.floor(chunk / 100)] + " hundred ";
            chunk %= 100;
        }
        if (chunk >= 20) {
            output += tens[Math.floor(chunk / 10)] + " ";
            chunk %= 10;
        }
        if (chunk >= 10) {
            output += teens[chunk - 10] + " ";
        } else if (chunk > 0) {
            output += ones[chunk] + " ";
        }
        return output.trim();
    }

    function convertNumber(num) {
        let output = "";
        let chunkIndex = 0;
        while (num > 0) {
            const chunk = num % 1000;
            if (chunk > 0) {
                output = convertChunk(chunk) + " " + thousands[chunkIndex] + " " + output;
            }
            num = Math.floor(num / 1000);
            chunkIndex++;
        }
        return output.trim() || "zero";
    }

    return convertNumber(number);
}

function replaceAbbreviationsWithWords(text) {
    const abbreviations = {
        " Sta": " Station",
        " St": " Street",
        " Ave": " Avenue",
        " Blvd": " Boulevard",
        " Rd": " Road",
        " Ln": " Lane",
        " Sq": " Square",
        " Termin": " Terminal",
        " N": " North",
        " S": " South",
        " E": " East",
        " W": " West",
    }
    for (const [abbreviation, word] of Object.entries(abbreviations)) {
        // 被替换的词只能在末尾或后面紧接着一个空格
        text = text.replace(new RegExp(`${abbreviation}(?=\\s|$)`, "g"), word);
    }
    return text;
}

// 语音播报函数
function speak(text, index, gender) {
    if (!window.speechSynthesis) {
        console.error('Speech synthesis is not supported in this browser.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // 查找特定的语音
    const femaleVoice = voices.find(voice => voice.name === 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)');
    const maleVoice = voices.find(voice => voice.name === 'Microsoft Yunyang Online (Natural) - Chinese (Mainland)');

    if (femaleVoice && maleVoice) {
        utterance.voice = gender === 'male' ? maleVoice : femaleVoice;
    } else {
        // 如果没有找到特定的语音，选择第一个可用的中文语音
        const chineseVoices = voices.filter(voice => voice.lang.includes('zh-CN'));
        if (chineseVoices.length > 0) {
            utterance.voice = chineseVoices[index % chineseVoices.length];
        } else {
            // 如果没有找到可用的中文语音，使用默认语音
            console.warn('No specific Chinese voices found, using default voice.');
        }
    }

    window.speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = function() {
    // 重新调用 speak 函数或其他需要语音的逻辑
};

// 初始化报站按钮
window.addEventListener('DOMContentLoaded', function() {
    initializeAnnouncementButton();
});

function renderStationSection(stationName, lineName) {
    const stationSection = document.querySelector('.station-section');
    stationSection.innerHTML = '';

    // 显示功能测试提示（仅第一次）
    if (!hasShownSectionNotice) {
        showToast('车站剖面图功能测试中，如有问题请及时反馈', 5000);
        hasShownSectionNotice = true;
    }

    // 检查当前是否为右侧车门
    const isRightDoor = document.getElementById('doorToggle').classList.contains('right');

    // 检查是否为上行方向（起点站序号大于终点站序号）
    const startIndex = parseInt(document.getElementById('startStation').value);
    const endIndex = parseInt(document.getElementById('endStation').value);
    const isUpward = startIndex > endIndex;
    
    // 计算实际的显示方向 - 现在完全依赖于车门方向按钮
    const shouldReverseDisplay = isRightDoor;
    
    console.log('方向检查:', {
        起点站序号: startIndex,
        终点站序号: endIndex,
        是否上行: isUpward,
        是否右侧车门: isRightDoor,
        是否需要反转显示: shouldReverseDisplay
    });

    // 查找线路信息和站点信息
    const lineInfo = window.stationDetail.find(line => line.name === lineName);
    if (!lineInfo) {
        console.error('Line information not found for:', lineName);
        return;
    }

    let stationInfo = lineInfo.stations.find(station => station.name === stationName);
    console.log('原始站点剖面图信息：', stationInfo);

    if (!stationInfo) {
        console.error('Station information not found for:', stationName, 'in line:', lineName);
        return;
    }

    // 查找并应用模板信息
    if (stationInfo.template) {
        const template = lineInfo.stationTemplate?.find(t => t.name === stationInfo.template);
        if (template) {
            console.log('找到模板：', template);
            // 创建一个新对象来存储合并后的站点信息
            stationInfo = {
                ...stationInfo,
                overGround: template.overGround,
                layers: template.layers,
                facilities: template.facilities,
                // 添加这些模板属性
                facilitiesUpwards: template.facilitiesUpwards,
                swapExitLayers: template.swapExitLayers,
                swapTemplateFacilitiesForDoors: template.swapTemplateFacilitiesForDoors
            };
            console.log('应用模板后的站点信息：', stationInfo);
        }
    }

    // 如果是上行方向且有上行设施信息，应用上行设施信息
    if (isUpward && stationInfo.facilitiesUpwards) {
        console.log('准备应用上行设施信息:', stationInfo.facilitiesUpwards);
        stationInfo = {
            ...stationInfo,
            facilities: stationInfo.facilitiesUpwards
        };
        console.log('应用上行设施后的站点信息:', {
            设施信息: stationInfo.facilities,
            完整站点信息: stationInfo
        });
    }

    // 如果需要根据显示方向交换设施信息
    if (stationInfo.swapTemplateFacilitiesForDoors && shouldReverseDisplay) {
        console.log('需要根据显示方向交换设施信息');
        // 对设施信息进行深拷贝
        const facilitiesCopy = JSON.parse(JSON.stringify(stationInfo.facilities));
        // 交换设施的位置
        stationInfo.facilities = facilitiesCopy.map(facility => ({
            ...facility,
            location: facility.location !== undefined ? maxCarCount - facility.location : undefined
        }));
        console.log('交换后的设施信息:', stationInfo.facilities);
    }

    // 使用线路的 maxCarCount
    const maxCarCount = lineInfo.maxCarCount;
    console.log('使用线路的车厢数：', maxCarCount);

    // 如果是上行方向且需要交换出口层级，预处理出口信息
    if (isUpward && stationInfo.swapExitLayers) {
        console.log('需要交换的出口层级:', stationInfo.swapExitLayers);
        // 创建一个新的出口数组，避免修改原始数据
        const newExits = stationInfo.exits.map(exitGroup => {
            // 如果当前层不是需要交换的层，直接返回原始数据
            if (exitGroup.floor !== stationInfo.swapExitLayers[0] && 
                exitGroup.floor !== stationInfo.swapExitLayers[1]) {
                return exitGroup;
            }

            // 找到需要交换的另一层的出口信息
            const otherFloorExits = stationInfo.exits.find(other => 
                other.floor === (exitGroup.floor === stationInfo.swapExitLayers[0] ? 
                    stationInfo.swapExitLayers[1] : stationInfo.swapExitLayers[0])
            );

            // 如果找到了对应层的出口信息，进行交换
            if (otherFloorExits) {
                return {
                    ...exitGroup,
                    floor: exitGroup.floor,  // 保持原层级
                    upwards: otherFloorExits.upwards,  // 使用另一层的出口信息
                    downwards: otherFloorExits.downwards
                };
            }

            return exitGroup;
        });

        console.log('交换后的出口信息:', newExits);
        stationInfo.exits = newExits;
    }

    // 检查 layers 是否存在且为数组
    if (!stationInfo.layers || !Array.isArray(stationInfo.layers)) {
        console.error('Layers information is missing or not an array for station:', stationName);
        return;
    }

    // 遍历每个楼层信息
    stationInfo.layers.forEach(layer => {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'floor';

        // 创建楼层标签
        const labelDiv = document.createElement('div');
        labelDiv.className = 'floor-label';
        const layerType = layer.type === 'concourse' ? '站厅层' : layer.type === 'platform' ? '站台层' : '通道层';
        const layerTypeEN = layer.type === 'transfer' ? 'Passageway' : layer.type;
        labelDiv.innerHTML = `<p>${layerType}</p><span>${layerTypeEN.charAt(0).toUpperCase()}${layerTypeEN.slice(1)}</span>`;
        floorDiv.appendChild(labelDiv);

        // 创建楼层信息容器
        const infoDiv = document.createElement('div');
        infoDiv.className = 'floor-info';
        infoDiv.style.flexDirection = stationInfo.overGround ? 'column' : 'column-reverse';

        // 根据显示方向决定是否翻转内容
        if (shouldReverseDisplay) {
            infoDiv.style.transform = 'scaleX(-1)';
        }

        // 如果是站台层，先添加车厢显示
        if (layer.type === 'platform') {
            // 添加车厢组
            const carGroup = document.createElement('div');
            carGroup.className = 'car-group';
            
            // 检查当前是否为右侧车门 - 移除水平翻转
            // if (isRightDoor) {
            //     carGroup.style.transform = 'scaleX(-1)';
            // }

            // 获取车头方向
            const isHeadFirst = document.querySelector('input[name="direction"][value="head"]').checked;

            // 创建车厢元素
            for (let i = 0; i < carCount; i++) {
                const car = document.createElement('div');
                car.className = 'car';
                car.style.width = 290 / maxCarCount + 'px';
                
                // 创建车厢号码
                const carNumber = document.createElement('div');
                carNumber.style.color = '#000000';
                carNumber.style.fontSize = '10px';
                carNumber.style.textAlign = 'center';
                carNumber.style.userSelect = 'none';
                
                // 根据车头方向决定车厢号码顺序
                const number = isHeadFirst ? (carCount - i) : (i + 1);
                carNumber.textContent = number;
                
                // 如果是当前选中的车厢，设置特殊样式
                if (number === selectedCar) {
                    car.style.backgroundColor = currentLine.color;
                    carNumber.style.color = '#FFFFFF';
                    carNumber.style.fontWeight = 'bold';
                }

                // 如果是右侧车门，让文字保持正向
                if (isRightDoor) {
                    carNumber.style.transform = 'scaleX(-1)';
                }
                
                car.appendChild(carNumber);
                carGroup.appendChild(car);
            }

            // 创建方向箭头
            const directionArrow = document.createElement('div');
            directionArrow.className = 'direction-arrow';
            // 根据车门方向设置箭头方向
            if (isRightDoor) {
                directionArrow.style.transform = 'scaleX(-1) rotate(180deg)';
            }
            carGroup.appendChild(directionArrow);

            // 只在需要时添加动画
            if (shouldAnimate) {
                requestAnimationFrame(() => {
                    carGroup.classList.add('animate');
                });

                carGroup.addEventListener('animationend', () => {
                    carGroup.classList.remove('animate');
                });
            }

            infoDiv.appendChild(carGroup);

            // 重置标记
            shouldAnimate = false;

            // 添加设施信息
            const facilitiesContainer = document.createElement('div');
            facilitiesContainer.className = 'facilities';
            facilitiesContainer.style.position = 'relative';
            facilitiesContainer.style.height = '18px';

            // 过滤出位置不为空的设施
            stationInfo.facilities.filter(facility => facility.location !== undefined).forEach(facility => {
                if (facility.type === 'escalator_and_stairs') {
                    // 创建一个组合容器
                    const combinedContainer = document.createElement('div');
                    combinedContainer.style.position = 'absolute';
                    combinedContainer.style.left = `${(facility.location / maxCarCount) * 100}%`;
                    combinedContainer.style.width = '30px';
                    combinedContainer.style.display = 'flex';
                    combinedContainer.style.gap = '2px';
                    combinedContainer.style.justifyContent = 'center';

                    // 设置transform属性，合并translate和scale
                    combinedContainer.style.transform = 'translate(-50%, 0)';
                    
                    // 确定当前层在layers中的位置
                    const currentLayerIndex = stationInfo.layers.findIndex(l => l.floor === layer.floor);
                    const endLayerIndex = stationInfo.layers.findIndex(l => l.floor === facility.endFloor);
                    
                    // 计算是否需要翻转 - 现在完全依赖于车门方向
                    let scaleX = 1;
                    if (facility.direction === 'upwards') scaleX *= -1;
                    if (endLayerIndex > currentLayerIndex) scaleX *= -1;
                    // 在右侧车门模式下额外翻转一次
                    if (isRightDoor) scaleX *= -1;

                    // 创建扶梯容器
                    const escalatorContainer = document.createElement('div');
                    escalatorContainer.style.position = 'relative';
                    escalatorContainer.style.width = '14px';
                    escalatorContainer.style.height = '14px';
                    escalatorContainer.style.display = 'flex';
                    escalatorContainer.style.alignItems = 'center';
                    escalatorContainer.style.justifyContent = 'center';
                    
                    const escalatorImg = document.createElement('img');
                    // 根据oneWay属性选择合适的扶梯图片
                    if (facility.oneWay === 'up') {
                        escalatorImg.src = 'res/escalator_up.png';
                    } else if (facility.oneWay === 'down') {
                        escalatorImg.src = 'res/escalator_down.png';
                    } else {
                        escalatorImg.src = 'res/escalator.png';
                    }
                    escalatorImg.style.width = '14px';
                    escalatorImg.style.height = '14px';
                    escalatorImg.style.display = 'block';
                    escalatorContainer.appendChild(escalatorImg);
                    // 在容器级别应用翻转，并在右侧车门模式下额外翻转一次
                    escalatorContainer.style.transform = `scaleX(${scaleX * (isRightDoor ? -1 : 1)})`;

                    // 创建楼梯容器
                    const stairsContainer = document.createElement('div');
                    stairsContainer.style.width = '14px';
                    stairsContainer.style.height = '14px';
                    stairsContainer.style.display = 'flex';
                    stairsContainer.style.alignItems = 'center';
                    stairsContainer.style.justifyContent = 'center';

                    const stairsImg = document.createElement('img');
                    // 根据终点楼层选择楼梯图标
                    let layerIndices = {
                        current: stationInfo.layers.findIndex(l => l.floor === layer.floor),
                        end: stationInfo.layers.findIndex(l => l.floor === facility.endFloor)
                    };
                    stairsImg.src = layerIndices.end < layerIndices.current ? 'res/stairs.png' : 'res/stairs_down.png';
                    stairsImg.style.width = '14px';
                    stairsImg.style.height = '14px';
                    stairsImg.style.display = 'block';
                    stairsContainer.appendChild(stairsImg);
                    // 在容器级别应用翻转，并在右侧车门模式下额外翻转一次
                    stairsContainer.style.transform = `scaleX(${scaleX * (isRightDoor ? -1 : 1)})`;

                    // 根据方向决定扶梯和楼梯的顺序
                    if (scaleX === 1) {
                        combinedContainer.appendChild(escalatorContainer);
                        combinedContainer.appendChild(stairsContainer);
                    } else {
                        combinedContainer.appendChild(stairsContainer);
                        combinedContainer.appendChild(escalatorContainer);
                    }

                    facilitiesContainer.appendChild(combinedContainer);
                } else {
                    // 处理其他类型的设施
                    let imgSrcs = [];
                    if (facility.type === 'escalator_and_stairs') {
                        // 根据终点楼层选择楼梯图标
                        layerIndices = {
                            current: stationInfo.layers.findIndex(l => l.floor === layer.floor),
                            end: stationInfo.layers.findIndex(l => l.floor === facility.endFloor)
                        };
                        imgSrcs.push('res/escalator.png', layerIndices.end < layerIndices.current ? 'res/stairs.png' : 'res/stairs_down.png');
                    } else {
                        imgSrcs.push(`res/${facility.type}.png`);
                    }

                    // 确定当前层在layers中的位置
                    const currentLayerIndex = stationInfo.layers.findIndex(l => l.floor === layer.floor);
                    const endLayerIndex = stationInfo.layers.findIndex(l => l.floor === facility.endFloor);
                    
                    // 计算是否需要翻转 - 现在完全依赖于车门方向
                    let scaleX = 1;
                    if (facility.direction === 'upwards') scaleX *= -1;
                    if (endLayerIndex > currentLayerIndex) scaleX *= -1;
                    // 在右侧车门模式下额外翻转一次
                    if (isRightDoor) scaleX *= -1;

                    // 添加设施图片
                    imgSrcs.forEach((src, index) => {
                        // 计算位置偏移
                        let locationOffset = facility.type === 'escalator_and_stairs' ? 
                            (index === 0 ? -0.15 : 0.15) : 0;
                            
                        // 计算实际位置
                        const position = ((facility.location + locationOffset) / maxCarCount) * 100;
                        
                        // 创建图片容器
                        const img = document.createElement('div');
                        img.style.position = 'absolute';
                        img.style.left = `${position}%`;
                        // 在右侧车门模式下额外翻转一次
                        img.style.transform = `translateX(-50%) scaleX(${scaleX * (isRightDoor ? -1 : 1)})`;
                        img.style.display = 'flex';
                        img.style.alignItems = 'center';
                        img.style.gap = '1px';
                        img.style.width = '14px';
                        img.style.height = '14px';
                        
                        // 创建图片元素
                        const imgElement = document.createElement('img');
                        // 如果是扶梯，根据oneWay属性选择图片
                        if (src.includes('escalator')) {
                            if (facility.oneWay === 'up') {
                                imgElement.src = 'res/escalator_up.png';
                            } else if (facility.oneWay === 'down') {
                                imgElement.src = 'res/escalator_down.png';
                            } else {
                                imgElement.src = src;
                            }
                        } else {
                            imgElement.src = src;
                        }
                        imgElement.style.width = '14px';
                        imgElement.style.height = '14px';
                        imgElement.style.display = 'block';
                        img.appendChild(imgElement);

                        facilitiesContainer.appendChild(img);
                    });
                }
            });

            infoDiv.appendChild(facilitiesContainer);
        }

        // 处理换乘信息
        if (stationInfo.transfer?.some(transfer => transfer.floor === layer.floor)) {
            const transferContainer = document.createElement('div');
            transferContainer.className = 'transfer-container';
            transferContainer.style.position = 'relative';
            transferContainer.style.width = '100%';
            transferContainer.style.height = '14px';
            transferContainer.style.display = 'flex';
            transferContainer.style.flexDirection = 'row';
            transferContainer.style.alignItems = 'center';
            transferContainer.style.transform = 'translateX(-50%)';

            stationInfo.transfer.filter(transfer => transfer.floor === layer.floor).forEach(transfer => {
                // 创建一个包装容器来包含换乘标识和终点站信息
                const wrapper = document.createElement('div');
                wrapper.style.position = 'absolute';
                wrapper.style.left = `${(transfer.location / maxCarCount) * 100}%`;
                wrapper.style.transform = 'translateX(-50%)';
                wrapper.style.display = 'flex';
                wrapper.style.flexDirection = 'row';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '2px';
                wrapper.style.justifyContent = 'center';

                // 查找对应线路的颜色和站点信息
                const transferLine = lineData.lines?.find(line => line.name === transfer.line);
                const transferLineColor = transferLine.color || '#6e7e81';
                
                // 获取换乘方向的终点站 - 现在完全依赖于车门方向
                let directionStation = '';
                if (transfer.transferDirection === 'upwards') {
                    directionStation = isRightDoor ? 
                        transferLine?.stations[0]?.name || '' :
                        transferLine?.stations[transferLine.stations.length - 1]?.name || '';
                } else if (transfer.transferDirection === 'downwards') {
                    directionStation = isRightDoor ?
                        transferLine?.stations[transferLine.stations.length - 1]?.name || '' :
                        transferLine?.stations[0]?.name || '';
                }
                
                const transferDiv = document.createElement('div');
                transferDiv.className = 'transfer';
                
                // 创建换乘信息容器
                const transferInfoContainer = document.createElement('div');
                transferInfoContainer.style.display = 'flex';
                transferInfoContainer.style.alignItems = 'center';
                
                // 创建线路名称和方向文本
                const lineInfo = document.createElement('div');
                lineInfo.style.display = 'flex';
                lineInfo.style.flexDirection = 'column';
                
                const lineNameDiv = document.createElement('div');
                lineNameDiv.textContent = transfer.line;
                // 如果是右侧车门，翻转文字以保持可读性
                if (isRightDoor) {
                    lineNameDiv.style.transform = 'scaleX(-1)';
                }
                lineInfo.appendChild(lineNameDiv);
                
                transferInfoContainer.appendChild(lineInfo);
                transferDiv.appendChild(transferInfoContainer);

                // 设置换乘标识样式
                Object.assign(transferDiv.style, {
                    backgroundColor: transferLineColor,
                });

                wrapper.appendChild(transferDiv);

                // 如果有方向站点信息，添加到换乘标识下方
                if (directionStation) {
                    const stationName = document.createElement('div');
                    stationName.textContent = '开往' + directionStation;
                    Object.assign(stationName.style, {
                        fontSize: '8px',
                        color: '#000000',
                        whiteSpace: 'nowrap',
                        width: 'fit-content',
                        minWidth: '48px',
                        textAlign: 'right',
                        position: 'absolute',
                        top: '50%',
                        transform: isRightDoor ? 'translate(calc(-100%), -50%) scaleX(-1)' : 'translate(calc(-100%), -50%)',
                    });
                    wrapper.appendChild(stationName);

                    // 在右侧车门模式下，调整换乘信息的位置
                    if (isRightDoor) {
                        wrapper.style.left = `${((maxCarCount - transfer.location) / maxCarCount) * 100}%`;
                    }
                }

                transferContainer.appendChild(wrapper);
            });

            infoDiv.appendChild(transferContainer);
        }

        // 最后添加出口信息
        const exitsContainer = document.createElement('div');
        exitsContainer.style.display = 'flex';
        exitsContainer.style.justifyContent = 'space-between';
        exitsContainer.style.width = '100%';
        exitsContainer.style.height = 'fit-content';
        exitsContainer.style.fontSize = '8px';
        exitsContainer.style.lineHeight = '1';

        // 创建左侧（上行）出口容器
        const upwardsContainer = document.createElement('div');
        upwardsContainer.style.display = 'flex';
        upwardsContainer.style.flexDirection = 'column';
        upwardsContainer.style.alignItems = 'flex-start';

        // 创建右侧（下行）出口容器
        const downwardsContainer = document.createElement('div');
        downwardsContainer.style.display = 'flex';
        downwardsContainer.style.flexDirection = 'column-reverse';
        downwardsContainer.style.alignItems = 'flex-end';

        // 处理该层的出口信息
        stationInfo.exits?.forEach(exitGroup => {
            if (exitGroup.floor === layer.floor) {
                // 处理上行出口
                exitGroup.upwards?.forEach(exit => {
                    const exitDiv = document.createElement('div');
                    exitDiv.style.display = 'flex';
                    exitDiv.style.alignItems = 'center';
                    exitDiv.style.gap = '2px';
                    exitDiv.style.height = '12px';
                    exitDiv.style.flexDirection = 'row';

                    const codeBox = document.createElement('div');
                    codeBox.textContent = exit.code + '口';
                    Object.assign(codeBox.style, {
                        backgroundColor: currentLine.color,
                        color: 'white',
                        fontWeight: 'bold',
                        width: '18px',
                        height: '10px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    });
                    // 如果是右侧车门，翻转文字以保持可读性
                    if (isRightDoor) {
                        codeBox.style.transform = 'scaleX(-1)';
                    }

                    const description = document.createElement('div');
                    description.textContent = exit.description;
                    description.style.color = '#000000';
                    // 如果是右侧车门，翻转文字以保持可读性
                    if (isRightDoor) {
                        description.style.transform = 'scaleX(-1)';
                    }

                    exitDiv.appendChild(codeBox);
                    exitDiv.appendChild(description);
                    upwardsContainer.appendChild(exitDiv);
                });

                // 处理下行出口
                exitGroup.downwards?.forEach(exit => {
                    const exitDiv = document.createElement('div');
                    exitDiv.style.display = 'flex';
                    exitDiv.style.alignItems = 'center';
                    exitDiv.style.gap = '2px';
                    exitDiv.style.height = '12px';
                    exitDiv.style.flexDirection = 'row';

                    const description = document.createElement('div');
                    description.textContent = exit.description;
                    description.style.color = '#000000';
                    // 如果是右侧车门，翻转文字以保持可读性
                    if (isRightDoor) {
                        description.style.transform = 'scaleX(-1)';
                    }

                    const codeBox = document.createElement('div');
                    codeBox.textContent = exit.code + '口';
                    Object.assign(codeBox.style, {
                        backgroundColor: currentLine.color,
                        color: 'white',
                        fontWeight: 'bold',
                        width: '18px',
                        height: '10px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    });
                    // 如果是右侧车门，翻转文字以保持可读性
                    if (isRightDoor) {
                        codeBox.style.transform = 'scaleX(-1)';
                    }

                    exitDiv.appendChild(description);
                    exitDiv.appendChild(codeBox);
                    downwardsContainer.appendChild(exitDiv);
                });
            }
        });

        // 根据车门方向决定出口容器的顺序
        if (isRightDoor) {
            // 右侧车门时，交换上下行出口的顺序，但保持各自的内部布局
            exitsContainer.appendChild(upwardsContainer);
            exitsContainer.appendChild(downwardsContainer);
        } else {
            // 左侧车门时，保持原有顺序
            exitsContainer.appendChild(upwardsContainer);
            exitsContainer.appendChild(downwardsContainer);
        }

        infoDiv.appendChild(exitsContainer);

        floorDiv.appendChild(infoDiv);
        stationSection.appendChild(floorDiv);
    });
}