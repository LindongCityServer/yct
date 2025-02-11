// 数据存储
let stations = [];
let routes = [];
let stops = [];
let tickets = [];
let runtimes = []; // 添加运行时间数据存储

// 获取DOM元素
const stationSelect = document.getElementById('station-select');
const directionToggle = document.getElementById('direction-toggle');
const directionText = directionToggle.querySelector('.direction-text');
const statusSelect = document.getElementById('status-select');
const routeList = document.getElementById('route-list');
const noRoutesMessage = document.getElementById('no-routes-message');

// 搜索相关元素
const searchButton = document.getElementById('search-button');
const searchOverlay = document.querySelector('.search-overlay');
const searchInput = document.getElementById('search-input');
const closeSearchButton = document.getElementById('close-search');
const prevResultButton = document.getElementById('prev-result');
const nextResultButton = document.getElementById('next-result');
const searchCountSpan = document.querySelector('.search-count');

let searchResults = [];
let currentSearchIndex = -1;

// 加载数据
async function loadData() {
    try {
        // 加载车站数据
        const stationResponse = await fetch('../ltcx/screen/station.txt');
        const stationText = await stationResponse.text();
        stations = parseStationData(stationText);

        // 加载路线数据
        const routeResponse = await fetch('../ltcx/route.txt');
        const routeText = await routeResponse.text();
        routes = parseRouteData(routeText);

        // 加载停运信息
        const stopResponse = await fetch('../ltcx/stop.txt');
        const stopText = await stopResponse.text();
        stops = parseStopData(stopText);

        // 加载检票口信息
        const ticketResponse = await fetch('../ltcx/screen/tickets.txt');
        const ticketText = await ticketResponse.text();
        tickets = parseTicketData(ticketText);

        // 加载运行时间数据
        const runtimeResponse = await fetch('../ltcx/screen/rttime.txt');
        const runtimeText = await runtimeResponse.text();
        runtimes = parseRuntimeData(runtimeText);

        // 初始化界面
        initializeUI();
        updateRouteDisplay();
    } catch (error) {
        showToast('数据加载失败：' + error.message);
    }
}

// 解析车站数据
function parseStationData(text) {
    const lines = text.split('\n');
    const stations = [];
    
    for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
            stations.push({
                id: lines[i].trim(),
                name: lines[i + 1].trim()
            });
        }
    }
    
    return stations;
}

// 解析路线数据
function parseRouteData(text) {
    const lines = text.split('\n');
    const routes = [];
    let currentRoute = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            if (Object.keys(currentRoute).length > 0) {
                routes.push({...currentRoute});
                currentRoute = {};
            }
            continue;
        }
        
        const [key, value] = trimmedLine.split('] ');
        if (key && value) {
            const cleanKey = key.replace('[', '').trim();
            currentRoute[cleanKey] = value.trim();
        }
    }
    
    if (Object.keys(currentRoute).length > 0) {
        routes.push(currentRoute);
    }
    
    return routes;
}

// 解析停运数据
function parseStopData(text) {
    const lines = text.split('\n');
    const stops = [];
    let currentStop = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            if (Object.keys(currentStop).length > 0) {
                stops.push({...currentStop});
                currentStop = {};
            }
            continue;
        }
        
        const [key, value] = trimmedLine.split('] ');
        if (key && value) {
            const cleanKey = key.replace('[', '').trim();
            currentStop[cleanKey] = value.trim();
        }
    }
    
    if (Object.keys(currentStop).length > 0) {
        stops.push(currentStop);
    }
    
    return stops;
}

// 解析检票口数据
function parseTicketData(text) {
    const lines = text.split('\n');
    const tickets = [];
    let currentTicket = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            if (Object.keys(currentTicket).length > 0) {
                tickets.push({...currentTicket});
                currentTicket = {};
            }
            continue;
        }
        
        const [key, value] = trimmedLine.split('] ');
        if (key && value) {
            const cleanKey = key.replace('[', '').trim();
            currentTicket[cleanKey] = value.trim();
        }
    }
    
    if (Object.keys(currentTicket).length > 0) {
        tickets.push(currentTicket);
    }
    
    return tickets;
}

// 解析运行时间数据
function parseRuntimeData(text) {
    const lines = text.split('\n');
    const runtimes = [];
    let currentRuntime = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            if (Object.keys(currentRuntime).length > 0) {
                runtimes.push({...currentRuntime});
                currentRuntime = {};
            }
            continue;
        }
        
        const [key, value] = trimmedLine.split('] ');
        if (key && value) {
            const cleanKey = key.replace('[', '').trim();
            currentRuntime[cleanKey] = value.trim();
        }
    }
    
    if (Object.keys(currentRuntime).length > 0) {
        runtimes.push(currentRuntime);
    }
    
    return runtimes;
}

// 获取线路的默认运行时间
function getDefaultRuntime(route, fromStation, toStation) {
    // 查找匹配的运行时间记录
    const runtime = runtimes.find(rt => {
        // 检查线路名称是否匹配
        if (rt['线路'] !== route['线路']) return false;
        
        // 解析区间起终点
        const [rtFrom, rtTo] = rt['区间'].split(' - ');
        
        // 检查区间是否匹配
        return fromStation.includes(rtFrom) && toStation.includes(rtTo);
    });

    if (runtime) {
        // 将"xx分钟"转换为"H:mm"格式
        const minutes = parseInt(runtime['用时'].replace('分钟', ''));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours.toString().padStart(1, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
    
    return null;
}

// 初始化UI
function initializeUI() {
    // 填充车站选择器
    stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.id;
        option.textContent = station.name;
        stationSelect.appendChild(option);
    });

    // 默认选择第一个车站
    if (stations.length > 0) {
        stationSelect.value = stations[0].id;
    }

    // 添加事件监听器
    stationSelect.addEventListener('change', updateRouteDisplay);
    statusSelect.addEventListener('change', updateRouteDisplay);
    
    // 方向切换按钮事件监听器
    directionToggle.addEventListener('click', () => {
        directionToggle.classList.toggle('arrival');
        directionText.textContent = directionToggle.classList.contains('arrival') ? 
            '到达' : '出发';
        // 更新状态选单选项
        updateStatusOptions();
        updateRouteDisplay();
    });

    // 初始化状态选单
    updateStatusOptions();

    // 初始化搜索功能
    initializeSearch();
}

// 更新状态选单选项
function updateStatusOptions() {
    const direction = getSelectedDirection();
    const currentValue = statusSelect.value;
    
    // 清空现有选项
    statusSelect.innerHTML = '';
    
    // 添加新选项
    const options = [
        { value: 'all', text: '全部' },
        ...(direction === 'departure' ? [
            { value: 'ready', text: '候车' },
            { value: 'boarding', text: '正在检票' },
            { value: 'stop', text: '停止检票' }
        ] : [
            { value: 'ready', text: '未发出' },
            { value: 'boarding', text: '已发出' },
            { value: 'stop', text: '已到达' }
        ]),
        { value: 'stopped', text: '临时停运' }
    ];
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        statusSelect.appendChild(option);
    });
    
    // 尝试保持原有选择，如果不存在则默认选择"全部"
    statusSelect.value = options.some(opt => opt.value === currentValue) ? currentValue : 'all';
}

// 获取当前选择的方向
function getSelectedDirection() {
    return directionToggle.classList.contains('arrival') ? 'arrival' : 'departure';
}

// 检查路线是否停运
function isRouteStopped(route) {
    try {
        const now = new Date();
        const routeTime = new Date();
        const [hours, minutes] = route['发车时间'].split(':').map(Number);
        routeTime.setHours(hours, minutes, 0, 0);

        // 如果时间在0-3点之间，认为是第二天
        if (hours < 3) {
            routeTime.setDate(routeTime.getDate() + 1);
        }
        
        for (const stop of stops) {
            // 检查必要的字段是否存在
            if (!stop['时段']) {
                console.warn('停运记录缺少时段信息:', stop);
                continue;
            }

            // 解析时段字符串
            const timeRangeMatch = stop['时段'].match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
            if (!timeRangeMatch) {
                console.warn('无法解析的时段格式:', stop['时段']);
                continue;
            }

            const [
                _, // 完整匹配
                year,
                month,
                day,
                startHour,
                startMinute,
                endHour,
                endMinute
            ] = timeRangeMatch;

            // 创建日期对象
            const stopDate = new Date(year, month - 1, day);
            
            // 创建开始和结束时间
            const stopStart = new Date(stopDate);
            stopStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
            
            const stopEnd = new Date(stopDate);
            stopEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
            
            // 检查车次发车时间是否在停运时段内
            if (routeTime >= stopStart && routeTime <= stopEnd) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.warn('检查停运状态时出错:', error);
        return false; // 出错时默认为不停运
    }
}

// 获取路线的检票口信息
function getGateInfo(route, stationId) {
    const relevantTicket = tickets.find(ticket => 
        ticket['车站'] === stationId && 
        (ticket['线路'] === route['线路'] || ticket['线路'] === route['途径'])
    );
    return relevantTicket ? relevantTicket['检票口'] : '-';
}

// 获取路线状态
function getRouteStatus(route, direction = 'departure') {
    const now = new Date();
    
    // 首先检查是否停运
    if (isRouteStopped(route)) {
        return { text: '临时停运', class: 'status-stopped' };
    }

    // 计算距离发车的时间（分钟）
    const [hours, minutes] = route['发车时间'].split(':').map(Number);
    let departureTime = hours * 60 + minutes;
    let currentTime = now.getHours() * 60 + now.getMinutes();

    // 调整时间以处理跨天情况
    if (departureTime < 180) { // 如果是次日0-3点的车次
        departureTime += 24 * 60; // 加24小时
    }
    if (currentTime < 180) { // 如果当前时间是0-3点
        currentTime += 24 * 60;
    }

    const timeUntilDeparture = departureTime - currentTime;

    // 到达模式下的状态判断
    if (direction === 'arrival') {
        // 获取运行时长，优先使用车次指定的运行时长，如果没有则使用线路默认运行时长
        const runtime = route['运行时长'] || (() => {
            const stationsList = route['途径'].split(' - ');
            const fromStation = stationsList[0];
            const toStation = stationsList[stationsList.length - 1];
            return getDefaultRuntime(route, fromStation, toStation);
        })();

        // 如果没有运行时长数据，只判断发车状态
        if (!runtime) {
            if (timeUntilDeparture > 0) {
                return { text: '未发出', class: 'status-ready' };
            } else {
                return { text: '已发出', class: 'status-boarding' };
            }
        }
        
        // 有运行时长数据时的完整状态判断
        const [durationHours, durationMinutes] = runtime.split(':').map(Number);
        const arrivalTime = departureTime + durationHours * 60 + durationMinutes;
        
        if (timeUntilDeparture > 0) {
            return { text: '未发出', class: 'status-ready' };
        } else if (arrivalTime > currentTime) {
            return { text: '已发出', class: 'status-boarding' };
        } else {
            return { text: '已到达', class: 'status-stop' };
        }
    }

    // 出发模式下的状态判断
    if (timeUntilDeparture <= 3) {
        return { text: '停止检票', class: 'status-stop' };
    } else if (timeUntilDeparture <= 15) {
        return { text: '正在检票', class: 'status-boarding' };
    } else {
        return { text: '候车', class: 'status-ready' };
    }
}

// 获取站点列表显示
function getStationListHtml(stationsList, selectedStation, direction) {
    const currentIndex = stationsList.findIndex(station => 
        station.includes(selectedStation.name)
    );

    if (currentIndex === -1) return '';

    let displayStations;
    if (direction === 'departure') {
        // 出发方向：显示本站及之后的站点
        displayStations = stationsList.slice(currentIndex);
    } else {
        // 到达方向：显示本站及之前的站点（倒序）
        displayStations = stationsList.slice(0, currentIndex + 1);
    }

    return `<ul class="station-list">
        ${displayStations.map((station, index) => `
            <li class="${station.includes(selectedStation.name) ? 'current' : ''}">${station}</li>
        `).join('')}
    </ul>`;
}

// 获取24小时制的时间（分钟表示）
function getTimeInMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 获取调整后的时间（分钟表示，考虑跨天）
function getAdjustedTimeInMinutes(timeStr) {
    let minutes = getTimeInMinutes(timeStr);
    // 如果时间在凌晨0点到3点之间，认为是第二天
    if (minutes < 180) { // 3:00 = 180分钟
        minutes += 24 * 60;
    }
    return minutes;
}

// 获取当前调整后的时间（分钟表示）
function getCurrentAdjustedTime() {
    const now = new Date();
    let minutes = now.getHours() * 60 + now.getMinutes();
    // 如果当前时间在凌晨0点到3点之间，认为是前一天
    if (minutes < 180) {
        minutes += 24 * 60;
    }
    return minutes;
}

// 格式化时间显示
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    
    // 确保时间格式为 h:mm
    const formattedTime = `${hours}:${String(minutes).padStart(2, '0')}`;
    
    if (currentHour < 3) {
        // 当前时间在0-3点之间
        if (hours >= 3) {  // 给0点之前（即3点到24点）的时刻添加-1标记
            return `<span>${formattedTime}</span><small class="next-day">-1</small>`;
        }
    } else {
        // 当前时间在3-24点之间，给次日（0-3点）的时刻添加+1标记
        if (hours < 3) {
            return `<span>${formattedTime}</span><small class="next-day">+1</small>`;
        }
    }
    // 为没有标记的时间添加空白占位符
    return `<span>${formattedTime}</span><small class="next-day placeholder"></small>`;
}

// 计算到达时间（分钟表示）
function calculateArrivalTime(departureTime, duration) {
    // 检查参数是否存在
    if (!departureTime) {
        console.warn('缺少发车时间数据:', { departureTime });
        return getAdjustedTimeInMinutes(departureTime);
    }

    try {
        // 如果没有指定运行时长，尝试获取默认运行时长
        if (!duration) {
            const route = routes.find(r => r['发车时间'] === departureTime);
            if (route) {
                const stationsList = route['途径'].split(' - ');
                const fromStation = stationsList[0];
                const toStation = stationsList[stationsList.length - 1];
                duration = getDefaultRuntime(route, fromStation, toStation);
            }
        }

        if (!duration) {
            console.warn('无法获取运行时长数据');
            return getAdjustedTimeInMinutes(departureTime);
        }

        // 将时长从字符串转换为分钟数
        const [hours, minutes] = duration.split(':').map(Number);
        const durationInMinutes = hours * 60 + minutes;
        
        // 计算到达时间
        let arrivalMinutes = getAdjustedTimeInMinutes(departureTime) + durationInMinutes;
        
        // 如果到达时间超过24小时，需要减去24小时
        if (arrivalMinutes >= 24 * 60 + 180) {
            arrivalMinutes -= 24 * 60;
        }
        
        return arrivalMinutes;
    } catch (error) {
        console.warn('计算到达时间时出错:', error, { departureTime, duration });
        return getAdjustedTimeInMinutes(departureTime);
    }
}

// 更新路线显示
function updateRouteDisplay() {
    const selectedStation = stationSelect.value;
    const direction = getSelectedDirection();
    const status = statusSelect.value;
    
    // 清空当前显示
    routeList.innerHTML = '';
    
    if (!selectedStation) {
        noRoutesMessage.style.display = 'block';
        noRoutesMessage.textContent = '请选择车站';
        return;
    }

    // 获取车站名称
    const selectedStationObj = stations.find(s => s.id === selectedStation);
    if (!selectedStationObj) {
        noRoutesMessage.style.display = 'block';
        noRoutesMessage.textContent = '车站信息不存在';
        return;
    }

    // 获取当前调整后的时间
    const currentAdjustedTime = getCurrentAdjustedTime();
    let firstFutureRouteElement = null;

    // 筛选并显示符合条件的路线
    const filteredRoutes = routes.filter(route => {
        // 检查车站是否在途径站点中
        const stationsList = route['途径'].split(' - ');
        const stationIndex = stationsList.findIndex(station => 
            station.includes(selectedStationObj.name)
        );

        if (stationIndex === -1) return false;

        // 根据方向筛选
        if (direction === 'departure') {
            if (stationIndex === stationsList.length - 1) return false;
        } else {
            if (stationIndex === 0) return false;
        }

        // 获取路线状态
        const routeStatus = getRouteStatus(route, direction);
        
        // 根据状态筛选
        if (status !== 'all' && routeStatus.class !== `status-${status}`) {
            return false;
        }

        // 检查时间是否在显示范围内（今天凌晨3点到明天凌晨3点）
        const adjustedTime = getAdjustedTimeInMinutes(route['发车时间']);
        return adjustedTime >= 180 && adjustedTime < 180 + 24 * 60;
    });

    if (filteredRoutes.length === 0) {
        noRoutesMessage.style.display = 'block';
        noRoutesMessage.textContent = '该站暂无符合条件的班次';
        return;
    }

    noRoutesMessage.style.display = 'none';
    
    // 按发车/到达时间排序
    filteredRoutes.sort((a, b) => {
        if (direction === 'departure') {
            const timeA = getAdjustedTimeInMinutes(a['发车时间']);
            const timeB = getAdjustedTimeInMinutes(b['发车时间']);
            return timeA - timeB;
        } else {
            // 检查是否有运行时长数据
            if (!a['运行时长'] || !b['运行时长']) {
                // 如果是第一次检测到缺少运行时长数据，显示提示
                if (!window.missingDurationNotified) {
                    window.missingDurationNotified = true;
                    showToast('部分车次缺少运行时长数据，暂按发车时间排序');
                }
                return getAdjustedTimeInMinutes(a['发车时间']) - getAdjustedTimeInMinutes(b['发车时间']);
            }
            const arrivalTimeA = calculateArrivalTime(a['发车时间'], a['运行时长']);
            const arrivalTimeB = calculateArrivalTime(b['发车时间'], b['运行时长']);
            return arrivalTimeA - arrivalTimeB;
        }
    });

    // 重置通知标志（当切换方向或车站时）
    if (direction === 'departure') {
        window.missingDurationNotified = false;
    }

    filteredRoutes.forEach((route, index) => {
        const status = getRouteStatus(route, direction);
        const stationsList = route['途径'].split(' - ');
        
        // 检查是否是当前时间之后的第一班车
        const routeTime = direction === 'departure' 
            ? getAdjustedTimeInMinutes(route['发车时间'])
            : calculateArrivalTime(route['发车时间'], route['运行时长']);
            
        if (!firstFutureRouteElement && routeTime > currentAdjustedTime) {
            // 添加时间分隔提示
            const dividerRow = document.createElement('tr');
            dividerRow.innerHTML = `
                <td colspan="6" class="time-divider">
                    <span>↑ 已${direction === 'departure' ? '发出' : '到达'}车次</span>
                    &nbsp;|&nbsp;
                    <span>以下是未${direction === 'departure' ? '发出' : '到达'}车次 ↓</span>
                </td>
            `;
            routeList.appendChild(dividerRow);
            firstFutureRouteElement = dividerRow;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${route['班次']}</td>
            <td>${formatTime(route['发车时间'])}</td>
            <td>${route['线路']}</td>
            <td>${getStationListHtml(stationsList, selectedStationObj, direction)}</td>
            <td>${getGateInfo(route, selectedStation)}</td>
            <td class="${status.class}">
                ${status.text}
            </td>
        `;
        routeList.appendChild(row);
    });

    // 处理滚动位置
    if (firstFutureRouteElement) {
        // 如果有未出发/到达的车次，滚动到分隔线
        firstFutureRouteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (filteredRoutes.length > 0 && status === 'all') {
        // 如果所有车次都已出发/到达，且状态选择为"全部"时，滚动到底部并显示提示
        routeList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        showToast(`该站今日所有车次均已${direction === 'departure' ? '发出' : '到达'}`);
    }
}

// 搜索功能初始化
function initializeSearch() {
    searchButton.addEventListener('click', () => {
        searchOverlay.style.display = 'flex';
        searchInput.focus();
    });

    closeSearchButton.addEventListener('click', () => {
        searchOverlay.style.display = 'none';
        clearSearch();
    });

    searchInput.addEventListener('input', handleSearch);
    prevResultButton.addEventListener('click', showPreviousResult);
    nextResultButton.addEventListener('click', showNextResult);

    // ESC键关闭搜索
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.style.display === 'flex') {
            searchOverlay.style.display = 'none';
            clearSearch();
        }
    });
}

// 处理搜索
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    clearSearchHighlights();
    
    if (!query) {
        clearSearch();
        return;
    }

    searchResults = [];
    const rows = routeList.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const routeNumber = row.querySelector('td:first-child')?.textContent.toLowerCase();
        if (routeNumber && routeNumber.includes(query)) {
            searchResults.push({
                element: row,
                index: index
            });
        }
    });

    updateSearchNavigation();
    if (searchResults.length > 0) {
        currentSearchIndex = 0;
        highlightCurrentResult();
    } else {
        // 获取当前选中的车站名称
        const selectedStation = stations.find(s => s.id === stationSelect.value);
        const stationName = selectedStation ? selectedStation.name : '当前车站';
        
        // 检查整个路线数据中是否存在该车次
        const searchedRoute = routes.find(r => r['车次'].toLowerCase().includes(query));
        if (searchedRoute) {
            // 车次存在但不经过当前车站
            showToast(`未找到车次 ${query.toUpperCase()}，请确认该车次是否经过${stationName}`);
        } else {
            // 车次完全不存在
            showToast(`未找到车次 ${query.toUpperCase()}，请检查车次是否正确`);
        }
    }
}

// 清除搜索
function clearSearch() {
    searchInput.value = '';
    searchResults = [];
    currentSearchIndex = -1;
    clearSearchHighlights();
    updateSearchNavigation();
}

// 清除搜索高亮
function clearSearchHighlights() {
    const rows = routeList.querySelectorAll('tr');
    rows.forEach(row => {
        row.classList.remove('search-highlight');
    });
}

// 更新搜索导航按钮状态
function updateSearchNavigation() {
    const total = searchResults.length;
    const current = total > 0 ? currentSearchIndex + 1 : 0;
    searchCountSpan.textContent = `${current}/${total}`;
    
    prevResultButton.disabled = total === 0 || currentSearchIndex <= 0;
    nextResultButton.disabled = total === 0 || currentSearchIndex >= total - 1;
}

// 高亮当前搜索结果
function highlightCurrentResult() {
    if (currentSearchIndex >= 0 && currentSearchIndex < searchResults.length) {
        clearSearchHighlights();
        const result = searchResults[currentSearchIndex];
        result.element.classList.add('search-highlight');
        
        // 查找该车次所属的车站并选中
        const routeNumber = result.element.querySelector('td:first-child').textContent;
        const route = routes.find(r => r['车次'] === routeNumber);
        if (route) {
            const stationId = route['车站'];
            if (stationId !== stationSelect.value) {
                stationSelect.value = stationId;
                updateRouteDisplay();
            }
        }
        
        // 滚动到可见区域
        result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 显示上一个结果
function showPreviousResult() {
    if (currentSearchIndex > 0) {
        currentSearchIndex--;
        highlightCurrentResult();
        updateSearchNavigation();
    }
}

// 显示下一个结果
function showNextResult() {
    if (currentSearchIndex < searchResults.length - 1) {
        currentSearchIndex++;
        highlightCurrentResult();
        updateSearchNavigation();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', loadData);
