// 导入公交数据
import busRoutes from '../data/bus_data.js';// 在JS顶部添加运营商颜色配置

const operatorColorMap = {
    "嘎联巴士（临东）有限公司": "#dea38c",
    "临东客运集团有限公司/嘎联巴士（临东）有限公司": "#dea38c",
    "回南控股临东客运有限责任公司": "#254f9d",
    "default": "#F97D1C"
};

// 获取地铁线路数据
const metroLines = {};
let isMetroDataLoaded = false;
let currentRouteId = '101'; // 保存当前显示的路线ID

// 解析地铁数据
function parseMetroData(text) {
    const linesMatch = text.match(/const lines = ({[\s\S]*?});/);
    if (linesMatch) {
        const linesObj = eval(`(${linesMatch[1]})`);
        Object.values(linesObj).forEach(line => {
            metroLines[line.name] = {
                color: line.color,
                stations: line.stations.map(station => station.name)
            };
        });
        isMetroDataLoaded = true;
        // 重新渲染当前路线以显示地铁接驳信息
        //renderBusRoute();
    }
}

// 加载地铁数据
async function loadMetroData() {
    try {
        const response = await fetch('../data/metro_data.js');
        const text = await response.text();
        parseMetroData(text);
    } catch (error) {
        console.warn('无法加载地铁线路数据:', error);
        isMetroDataLoaded = true;
    }
}

// 检查站点是否与地铁接驳
function checkMetroConnection(busStationName) {
    // 检查地铁数据是否可用
    if (!window.stationDetail || !Array.isArray(window.stationDetail)) {
        console.warn('地铁站点数据未加载或格式不正确');
        return { connected: false };
    }

    const connections = [];
    
    for (const line of window.stationDetail) {
        if (!line.stations) continue;
        
        for (const station of line.stations) {
            if (station.surrounding_stations && station.surrounding_stations.includes(busStationName)) {
                // 查找这个站点在哪些线路上
                const lineNames = Object.entries(metroLines)
                    .filter(([_, lineData]) => lineData.stations.includes(station.name))
                    .map(([lineName, lineData]) => ({
                        name: lineName,
                        color: lineData.color
                    }));
                
                if (lineNames.length > 0) {
                    connections.push({
                        metroStation: station.name,
                        lines: lineNames
                    });
                }
            }
        }
    }
    
    return connections.length > 0 ? { connected: true, connections } : { connected: false };
}

// 渲染公交线路图
function renderBusRoute(routeId) {
    const defaultRouteId = ' 环';
    if (!routeId) {
        routeId = defaultRouteId;
    }
    currentRouteId = routeId; // 保存当前路线ID
    const route = busRoutes[routeId] || busRoutes[defaultRouteId];
    if (!busRoutes[routeId]) {
        console.error('Route not found:', routeId);
        showToast('未找到该线路，将显示' + defaultRouteId + '路信息');
    }

    const routeSection = document.querySelector('.route-section');
    routeSection.innerHTML = '';

    // 获取运营商对应颜色（带默认值）
    const themeColor = operatorColorMap[route.operator] || operatorColorMap.default;
    
    // 动态设置CSS变量
    routeSection.style.setProperty('--bus-color', themeColor);

    // 提前声明并初始化 isCircular
    const isCircular =
        route.stations[0].name === route.stations[route.stations.length - 1].name &&
        route.stations[0].oneWay === route.stations[route.stations.length - 1].oneWay;

    // 创建线路信息头部
    const routeHeader = document.createElement('div');
    routeHeader.className = 'route-header';

    // 计算方向名称
    let upwardDirectionName, downwardDirectionName;
    if (isCircular) {
        const isClockwise = route.circularDirection === 'clockwise';
        upwardDirectionName = isClockwise ? '内环' : '外环';
        downwardDirectionName = isClockwise ? '外环' : '内环';
    } else {
        const upwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'down');
        const downwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'up');
        
        // 判断是否为纯单向线路
        const isPureUp = downwardStations.length === 0 && upwardStations.length > 0;
        const isPureDown = upwardStations.length === 0 && downwardStations.length > 0;
        
        const upwardTerminal = isPureDown ? '' : upwardStations[upwardStations.length - 1].name;
        const downwardTerminal = isPureUp ? '' : downwardStations[0].name;

        upwardDirectionName = `${upwardTerminal}方向`;
        downwardDirectionName = `${downwardTerminal}方向`;
    }

    // 构造route-info内容
    const routeInfoContent = `
        <div class="route-info">
            <p>首末车时间：${route.firstLastBusUpwards ? '</p><p>　　' + upwardDirectionName + '：' : ''}${route.firstLastBus.displayFirst}-${route.firstLastBus.displayLast}</p>
            ${route.firstLastBusUpwards ? `<p>　　${downwardDirectionName}：${route.firstLastBusUpwards.first}-${route.firstLastBusUpwards.last}</p>` : ''}
            <p>票价：${route.fare} 元</p>
            <p>运营单位：${route.operator}</p>
            ${route.note ? `<p>备注：${route.note}</p>` : ''}
            ${route.circularDirection ? `<p>运行方向：${route.circularDirection === 'clockwise' ? '内环' : '外环'}</p>` : ''}
        </div>
    `;

    routeHeader.innerHTML = `
        <div class="route-title">
            <h2>${route.name}</h2>
            <button class="icon-button" onclick="window.open('https://wiki.shangxiaoguan.top/临东公交${route.name}', '_blank')" title="查看详情">
                <img src="../UI/res/info_black.png" alt="详情" class="theme-aware-icon">
            </button>
        </div>
        ${routeInfoContent}
    `;
    routeSection.appendChild(routeHeader);

    // 创建站点列表容器
    const stationList = document.createElement('div');
    stationList.className = 'station-list';

    // 检查是否为环线
    /*const isCircular = route.stations[0].name === route.stations[route.stations.length - 1].name &&
        route.stations[0].oneWay === route.stations[route.stations.length - 1].oneWay;*/

    let directionTabs; // 提升 directionTabs 变量的作用域

    if (isCircular) {
        // 环线显示方向
        directionTabs = document.createElement('div'); // 初始化 directionTabs
        directionTabs.className = 'direction-tabs';
        const isClockwise = route.circularDirection === 'clockwise';
        
        // 检查是否为单向运行
        const isOneWay = route.stations.every(station => station.oneWay === 'down');
        
        if (isOneWay) {
            // 单向环线只显示一个方向
            directionTabs.innerHTML = `
                <button class="tab-button active" data-direction="down">${isClockwise ? '内环' : '外环'}</button>
            `;
        } else {
            // 双向环线显示两个方向
            directionTabs.innerHTML = `
                <button class="tab-button active" data-direction="down">${isClockwise ? '内环' : '外环'}</button>
                <button class="tab-button" data-direction="up">${isClockwise ? '外环' : '内环'}</button>
            `;
        }

        // 创建站点列表内容区
        const stationContent = document.createElement('div');
        stationContent.className = 'station-content';

        // 创建下行方向（顺时针）站点列表
        const downwardSection = document.createElement('div');
        downwardSection.className = 'direction-section active';
        downwardSection.setAttribute('data-direction', 'down');
        renderStationSection(route.stations.slice(0, -1), downwardSection);

        if (!isOneWay) {
            // 如果不是单向运行，创建上行方向（逆时针）站点列表
            const upwardSection = document.createElement('div');
            upwardSection.className = 'direction-section';
            upwardSection.setAttribute('data-direction', 'up');
            renderStationSection([...route.stations].slice(0, -1).reverse(), upwardSection);
            stationContent.appendChild(upwardSection);
        }

        // 添加tab切换事件
        if (!isOneWay) {
            directionTabs.addEventListener('click', (e) => {
                const tabButton = e.target.closest('.tab-button');
                if (!tabButton) return;

                // 更新tab按钮状态
                directionTabs.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabButton.classList.add('active');

                // 更新内容显示
                const direction = tabButton.dataset.direction;
                stationContent.querySelectorAll('.direction-section').forEach(section => {
                    section.classList.remove('active');
                    if (section.dataset.direction === direction) {
                        section.classList.add('active');
                    }
                });
            });
        }

        // 组装站点列表
        stationList.appendChild(directionTabs);
        stationContent.appendChild(downwardSection);
        stationList.appendChild(stationContent);
    } else {
        // 获取上下行方向的站点
        const upwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'down');
        const downwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'up');

        // 判断是否为纯单向线路
        const isPureUp = downwardStations.length === 0 && upwardStations.length > 0;
        const isPureDown = upwardStations.length === 0 && downwardStations.length > 0;

        // 获取首末站名称
        const upwardTerminal = isPureDown ? '' : upwardStations[upwardStations.length - 1].name;
        const downwardTerminal = isPureUp ? '' : downwardStations[0].name;

        // 创建方向切换tabs
        directionTabs = document.createElement('div'); // 初始化 directionTabs
        directionTabs.className = 'direction-tabs';
        
        if (isPureUp) {
            directionTabs.innerHTML = `<div class="tab-button active">上行</div>`;
        } else if (isPureDown) {
            directionTabs.innerHTML = `<div class="tab-button active">下行</div>`;
        } else {
            // 原始逻辑：双向线路显示两个标签
            directionTabs.innerHTML = `
                <div class="tab-button active">上行</div>
                <div class="tab-button">下行</div>
            `;
        }

        // 为环路特殊处理方向名称
        let upwardDirectionName, downwardDirectionName;
        if (route.name === '环路') {
            upwardDirectionName = '环一路（反着转）';
            downwardDirectionName = '环二路（正着转）';
        } else {
            upwardDirectionName = `${upwardTerminal}方向`;
            downwardDirectionName = `${downwardTerminal}方向`;
        }
        
        directionTabs.innerHTML = `
            <button class="tab-button active" data-direction="up">${upwardDirectionName}</button>
            <button class="tab-button" data-direction="down">${downwardDirectionName}</button>
        `;

        // 创建 directionTabs 后，移除文本为“方向”的按钮
        directionTabs.querySelectorAll('.tab-button').forEach(button => {
            if (button.textContent.trim() === '方向') {
                button.remove();
            }
        });

        // 创建站点列表内容区
        const stationContent = document.createElement('div');
        stationContent.className = 'station-content';

        // 创建上行方向站点列表
        const upwardSection = document.createElement('div');
        upwardSection.className = 'direction-section active';
        upwardSection.setAttribute('data-direction', 'up');
        if (!isPureDown) renderStationSection(upwardStations, upwardSection);

        // 创建下行方向站点列表
        const downwardSection = document.createElement('div');
        downwardSection.className = 'direction-section';
        downwardSection.setAttribute('data-direction', 'down');
        if (!isPureUp) renderStationSection(downwardStations.reverse(), downwardSection);

        // 添加tab切换事件
        directionTabs.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.tab-button');
            if (!tabButton) return;

            // 更新tab按钮状态
            directionTabs.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            tabButton.classList.add('active');

            // 更新内容显示
            const direction = tabButton.dataset.direction;
            stationContent.querySelectorAll('.direction-section').forEach(section => {
                section.classList.remove('active');
                if (section.dataset.direction === direction) {
                    section.classList.add('active');
                }
            });
        });

        // 组装站点列表
        stationList.appendChild(directionTabs);
        stationContent.appendChild(upwardSection);
        stationContent.appendChild(downwardSection);
        stationList.appendChild(stationContent);
    }

    const routeInfo = document.getElementsByClassName('route-info');
    if (routeInfo.firstLastBusUpwards) {
        routeInfo.innerHTML = `
            <div class="route-info">
                <p>首末车时间：</p>
                <p>${downwardDirectionName}：${route.firstLastBus.displayFirst}-${route.firstLastBus.displayLast}</p>
                <p>${upwardDirectionName}：${route.firstLastBusUpwards.first}-${route.firstLastBusUpwards.last}</p>
                <p>票价：${route.fare} 元</p>
                <p>运营单位：${route.operator}</p>
                ${route.note ? `<p>备注：${route.note}</p>` : ''}
                ${route.circularDirection ? `<p>运行方向：${route.circularDirection === 'clockwise' ? '内环' : '外环'}</p>` : ''}
            </div>
        `;
    }

    routeSection.appendChild(stationList);
    loadMetroData(); // 确保地铁数据已加载

    // 添加调试信息
    console.log('Rendered route:', route.name);
    console.log('Route stations:', route.stations);
    console.log('Direction tabs:', directionTabs.innerHTML);    
    // 新增调试输出：首末班车原始时间
    console.log(`[renderBusRoute] 线路 ${route.name} 的首末班车时间原始值: ${route.firstLastBus.first}-${route.firstLastBus.last}`);
    console.log(`[renderBusRoute] 线路 ${route.name} 的首末班车时间格式化值: ${route.firstLastBus.displayFirst}-${route.firstLastBus.displayLast}`);

}

/**
 * 处理超24小时时间格式
 * @param {string} timeStr - 原始时间字符串（如"25:30"）
 * @returns {string} 格式化后的时间（如"次日1:30"）
 */
function formatBusTime(timeStr) {
    // 解析原始时间
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // 计算总分钟数
    const totalMinutes = hours * 60 + minutes;
    
    // 计算天数偏移和剩余分钟
    const dayOffset = Math.floor(totalMinutes / 1440); // 1440分钟/天
    const remainingMinutes = totalMinutes % 1440;
    
    // 计算实际时间
    const realHours = Math.floor(remainingMinutes / 60);
    const realMinutes = remainingMinutes % 60;
    
    // 格式化输出
    const hourStr = realHours.toString().padStart(2, '0');
    const minuteStr = realMinutes.toString().padStart(2, '0');
    
    return dayOffset > 0 
        ? `次日${realHours}:${minuteStr}` 
        : `${hourStr}:${minuteStr}`;
}

/**
 * 获取时间排序值（用于时间比较）
 * @param {string} timeStr - 原始时间字符串（如"25:30"）
 * @returns {number} 排序权重值
 */
function getTimeSortValue(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 渲染站点列表区域
function renderStationSection(stations, container) {
    stations.forEach((station, index) => {
        const metroConnection = isMetroDataLoaded ? checkMetroConnection(station.name) : { connected: false };
        const stationElement = document.createElement('div');
        stationElement.className = 'station-item';
        
        // 添加单向行驶标记
        const directionClass = station.oneWay ? `one-way-${station.oneWay}` : '';
        
        // 生成地铁线路标识
        const metroBadges = metroConnection.connected ? 
            metroConnection.connections.map(conn => 
                conn.lines.map(line => 
                    `<span class="metro-badge" style="--line-color: ${line.color}">${line.name}</span>`
                ).join('')
            ).join('') : '';
        
        stationElement.innerHTML = `
            <div class="station-dot ${metroConnection.connected ? 'metro-connection' : ''}"></div>
            <div class="station-line ${directionClass}"></div>
            <div class="station-info">
                <div class="station-name-row">
                    <span class="station-name">${station.name}</span>
                    ${station.status ? `<span class="station-status">${station.status}</span>` : ''}
                </div>
                ${metroBadges ? `<div class="metro-badges">${metroBadges}</div>` : ''}
            </div>
            <div class="station-actions">
                <button class="station-action-btn" data-action="details">
                    <img src="../UI/res/info_black.png" alt="详情" width="16" height="16">
                    详情
                </button>
                <button class="station-action-btn set-start" data-action="set-start">
                    <img src="../UI/res/enter_black.png" alt="起点" width="16" height="16">
                    设为起点
                </button>
                <button class="station-action-btn set-end" data-action="set-end">
                    <img src="../UI/res/logout_black.png" alt="终点" width="16" height="16">
                    设为终点
                </button>
            </div>
        `;

        // 添加站点点击事件
        stationElement.addEventListener('click', (e) => {
            const actionButton = e.target.closest('.station-action-btn');
            
            // 如果点击的是操作按钮，执行相应操作
            if (actionButton) {
                const action = actionButton.dataset.action;
                switch (action) {
                    case 'details':
                        showStationDetails(station.name);
                        break;
                    case 'set-start':
                        setStartStation(station.name);
                        break;
                    case 'set-end':
                        setEndStation(station.name);
                        break;
                }
                // 执行操作后移除active状态
                stationElement.classList.remove('active');
                return;
            }

            // 如果点击的不是操作按钮
            // 移除其他站点的active状态
            document.querySelectorAll('.station-item.active').forEach(item => {
                if (item !== stationElement) {
                    item.classList.remove('active');
                }
            });
            
            // 切换当前站点的active状态
            stationElement.classList.toggle('active');
        });

        // 检查是否需要换行显示地铁线路标识
        if (metroBadges) {
            const stationInfo = stationElement.querySelector('.station-info');
            const nameRow = stationElement.querySelector('.station-name-row');
            const badges = stationElement.querySelector('.metro-badges');
            
            // 计算可用空间
            const availableWidth = stationInfo.offsetWidth;
            const nameWidth = nameRow.offsetWidth;
            const badgesWidth = badges.offsetWidth;
            
            // 如果一行能放下，添加inline类
            if (nameWidth + badgesWidth + 20 <= availableWidth) { // 20px作为安全边距
                stationInfo.classList.add('inline');
            }
        }
        
        container.appendChild(stationElement);
    });
}

// 修改 validateRouteData 函数中的 24 小时判断逻辑
function validateRouteData(route) {
    if (!route.firstLastBus || !route.firstLastBus.first || !route.firstLastBus.last) {
        console.error('Invalid route data:', route);
        return false;
    }

    // 新增调试输出：原始时间值
    //console.log(`[validateRouteData] Route ${route.name} 原始时间`);
    //console.log(`下行方向首班车: ${route.firstLastBus.first}, 末班车: ${route.firstLastBus.last}`);
    
    const dayMinutes = 1440; // 一天的分钟数
    const startFirst = getTimeSortValue(route.firstLastBus.first);
    const endLastDownwards = getTimeSortValue(route.firstLastBus.last);
    
    // 判断是否跨天，并且次日末班车时间 >= 首班车时间
    const isCrossDay = endLastDownwards > dayMinutes;
    const nextDayEndMinutes = endLastDownwards % dayMinutes;
    route.is24HoursDownwards = isCrossDay && (nextDayEndMinutes >= startFirst);

    // 新增调试输出：下行方向判断
    //console.log(`[validateRouteData] 下行方向判断: ${route.is24HoursDownwards} (首班车排序值: ${startFirst}, 末班车排序值: ${endLastDownwards}, 次日分钟数: ${nextDayEndMinutes})`);

    // 判断上行方向是否为24小时运营
    if (route.firstLastBusUpwards) {
        const startFirstUpwards = getTimeSortValue(route.firstLastBusUpwards.first);
        const endLastUpwards = getTimeSortValue(route.firstLastBusUpwards.last);
        
        // 判断是否跨天，并且次日末班车时间 >= 首班车时间
        const isCrossDayUpwards = endLastUpwards > dayMinutes;
        const nextDayEndMinutesUpwards = endLastUpwards % dayMinutes;
        route.is24HoursUpwards = isCrossDayUpwards && (nextDayEndMinutesUpwards >= startFirstUpwards);

        // 新增调试输出：上行方向判断
        //console.log(`[validateRouteData] 上行方向判断: ${route.is24HoursUpwards} (首班车排序值: ${startFirstUpwards}, 末班车排序值: ${endLastUpwards}, 次日分钟数: ${nextDayEndMinutesUpwards})`);
    } else {
        // 如果没有上行方向时间，继承下行方向的判断
        route.is24HoursUpwards = route.is24HoursDownwards;

        // 新增调试输出：上行方向继承下行判断
        //console.log(`[validateRouteData] 上行方向继承下行判断: ${route.is24HoursUpwards}`);
    }

    // 添加排序权重
    route.firstLastBus.firstSort = startFirst;
    route.firstLastBus.lastSort = endLastDownwards;

    return true;
}

// 初始化时预处理所有线路
Object.values(busRoutes).forEach(route => {
    if (validateRouteData(route)) {
        // 预处理时间显示
        route.firstLastBus.displayFirst = formatBusTime(route.firstLastBus.first);
        route.firstLastBus.displayLast = formatBusTime(route.firstLastBus.last);
    }
});

function isTimeInRange(timeStr, startStr, endStr, is24Hours = false) {
    const time = getTimeSortValue(timeStr);
    const start = getTimeSortValue(startStr);
    const end = getTimeSortValue(endStr);

    // 新增参数支持24小时逻辑
    if (is24Hours) return true; // 24小时运营直接返回true
    
    // 处理跨天情况
    if (start > end) {
        return time >= start || time <= end;
    }
    return time >= start && time <= end;
}

// 计算站点在特定路线上的运营时间
function calculateStationOperationTime(routeId, stationName, isUpward = null) {
    const route = busRoutes[routeId];
    if (!route) return null;

    // 新增调试输出：进入函数
    console.log(`[calculateStationOperationTime] 计算 ${route.name} 站点 ${stationName} 的时间`);

    // 获取上下行方向的站点列表
    const upwardStations = route.stations.filter(s => !s.oneWay || s.oneWay === 'down');
    const downwardStations = route.stations.filter(s => !s.oneWay || s.oneWay === 'up');

    // 新增调试输出：站点所在方向
    console.log(`站点 ${stationName} 上行方向存在: ${upwardStations.some(s => s.name === stationName)}, 下行方向存在: ${downwardStations.some(s => s.name === stationName)}`);

    // 判断是否为24小时运营
    const is24HoursUpwards = route.is24HoursUpwards;
    const is24HoursDownwards = route.is24HoursDownwards;

    // 如果站点不在任何方向上，返回 null
    const upwardIndex = upwardStations.findIndex(s => s.name === stationName);
    const downwardIndex = downwardStations.findIndex(s => s.name === stationName);

    if (upwardIndex === -1 && downwardIndex === -1) {
        console.warn(`站点 ${stationName} 不在 ${route.name} 的任何方向上`);
        return null;
    }

    // 如果是24小时运营，直接返回全天时间
    if (is24HoursUpwards && is24HoursDownwards) {
        console.log(`[calculateStationOperationTime] 线路 ${route.name} 上下行均为24小时运营`);
        return {
            upward: { first: '00:00', last: '23:59' },
            downward: { first: '00:00', last: '23:59' }
        };
    }

    // 解析首末班车时间
    const [firstHour, firstMinute] = route.firstLastBus.first.split(':').map(Number);
    const [lastHour, lastMinute] = route.firstLastBus.last.split(':').map(Number);
    const [firstHourUpwards, firstMinuteUpwards] = route.firstLastBusUpwards 
        ? route.firstLastBusUpwards.first.split(':').map(Number) 
        : [firstHour, firstMinute];
    const [lastHourUpwards, lastMinuteUpwards] = route.firstLastBusUpwards 
        ? route.firstLastBusUpwards.last.split(':').map(Number) 
        : [lastHour, lastMinute];

    // 根据是否为上行方向计算时间
    const result = {};
    
    if (isUpward === true || isUpward === false) {
        const useUpward = isUpward === true;
        const directionIndex = useUpward ? upwardIndex : downwardIndex;
        const directionHours = useUpward ? firstHourUpwards : firstHour;
        const directionMinutes = useUpward ? firstMinuteUpwards : firstMinute;
        const directionLastHours = useUpward ? lastHourUpwards : lastHour;
        const directionLastMinutes = useUpward ? lastMinuteUpwards : lastMinute;

        if (directionIndex !== -1) {
            const timeToStation = useUpward ? directionIndex * 2 : (downwardStations.length - 1 - directionIndex) * 2;

            const firstTime = new Date();
            firstTime.setHours(directionHours, directionMinutes + timeToStation, 0);

            const lastTime = new Date();
            lastTime.setHours(directionLastHours, directionLastMinutes + timeToStation, 0);

            result[useUpward ? 'upward' : 'downward'] = {
                first: `${String(firstTime.getHours()).padStart(2, '0')}:${String(firstTime.getMinutes()).padStart(2, '0')}`,
                last: `${String(lastTime.getHours()).padStart(2, '0')}:${String(lastTime.getMinutes()).padStart(2, '0')}`
            };

            // 新增调试输出：单方向计算结果
            console.log(`[calculateStationOperationTime] 单方向计算 ${useUpward ? '上行' : '下行'}: ${result[useUpward ? 'upward' : 'downward'].first}-${result[useUpward ? 'upward' : 'downward'].last}`);
        }
    } else {
        // 如果未指定方向，同时计算两个方向
        if (upwardIndex !== -1) {
            const timeToStation = upwardIndex * 2;
            const firstTime = new Date();
            firstTime.setHours(firstHourUpwards, firstMinuteUpwards + timeToStation, 0);
            const lastTime = new Date();
            lastTime.setHours(lastHourUpwards, lastMinuteUpwards + timeToStation, 0);
            result.upward = {
                first: `${String(firstTime.getHours()).padStart(2, '0')}:${String(firstTime.getMinutes()).padStart(2, '0')}`,
                last: `${String(lastTime.getHours()).padStart(2, '0')}:${String(lastTime.getMinutes()).padStart(2, '0')}`
            };

            // 新增调试输出：上行方向计算结果
            console.log(`[calculateStationOperationTime] 上行方向计算: ${result.upward.first}-${result.upward.last}`);
        }

        if (downwardIndex !== -1) {
            const timeFromEnd = (downwardStations.length - 1 - downwardIndex) * 2;
            const firstTimeDown = new Date();
            firstTimeDown.setHours(firstHour, firstMinute + timeFromEnd, 0);
            const lastTimeDown = new Date();
            lastTimeDown.setHours(lastHour, lastMinute + timeFromEnd, 0);
            result.downward = {
                first: `${String(firstTimeDown.getHours()).padStart(2, '0')}:${String(firstTimeDown.getMinutes()).padStart(2, '0')}`,
                last: `${String(lastTimeDown.getHours()).padStart(2, '0')}:${String(lastTimeDown.getMinutes()).padStart(2, '0')}`
            };

            // 新增调试输出：下行方向计算结果
            console.log(`[calculateStationOperationTime] 下行方向计算: ${result.downward.first}-${result.downward.last}`);
        }
    }

    // 如果是24小时运营，覆盖计算结果
    if (is24HoursUpwards && upwardStations.some(s => s.name === stationName)) {
        result.upward = { first: '00:00', last: '23:59' };
        console.log(`[calculateStationOperationTime] 站点 ${stationName} 上行方向被标记为24小时运营`);
    }
    if (is24HoursDownwards && downwardStations.some(s => s.name === stationName)) {
        result.downward = { first: '00:00', last: '23:59' };
        console.log(`[calculateStationOperationTime] 站点 ${stationName} 下行方向被标记为24小时运营`);
    }

    return Object.keys(result).length > 0 ? result : null;
}

// 检查站点在特定路线和方向上是否在运营时间内
function isStationOperatingInDirection(routeId, stationName, isUpward) {
    const route = busRoutes[routeId];
    if (!route) {
        console.error('Route not found for routeId:', routeId);
        return false;
    }

    const operationTime = calculateStationOperationTime(routeId, stationName, isUpward);
    if (!operationTime) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 新增调试输出：当前时间和判断依据
    console.log(`[isStationOperatingInDirection] 当前时间: ${currentTime}, 是否为24小时运营: ${isUpward ? route.is24HoursUpwards : route.is24HoursDownwards}`);

    // 根据方向使用不同的24小时标志
    const is24Hours = isUpward ? route.is24HoursUpwards : route.is24HoursDownwards;

    if (is24Hours) {
        return true;
    }

    // 新增调试输出：非24小时时的判断
    console.log(`[isStationOperatingInDirection] 线路 ${route.name} 的 ${isUpward ? '上行' : '下行'} 方向非24小时`);
    console.log(`运营时间范围: ${operationTime[isUpward ? 'upward' : 'downward'].first}-${operationTime[isUpward ? 'upward' : 'downward'].last}`);


    // 根据方向检查运营时间
    if (isUpward && operationTime.upward) {
        return currentTime >= operationTime.upward.first && currentTime <= operationTime.upward.last;
    } else if (!isUpward && operationTime.downward) {
        return currentTime >= operationTime.downward.first && currentTime <= operationTime.downward.last;
    }

    return false;
}

// 显示站点详情
function showStationDetails(stationName) {
    const modal = document.querySelector('.station-detail-modal');
    const overlay = document.querySelector('.modal-overlay');
    const modalTitle = modal.querySelector('.modal-header h3');
    const routeList = modal.querySelector('.route-list');

    modalTitle.textContent = stationName;
    routeList.innerHTML = '';

    // 查找经过该站点的所有线路
    const routes = findStationRoutes(stationName);
    routes.forEach(route => {
        // 新增调试输出：正在处理的线路
        console.log(`[showStationDetails] 处理线路: ${route.routeName}`);

        const operationTime = calculateStationOperationTime(route.routeId, stationName);
        if (!operationTime) {
            console.warn(`Could not calculate operation time for station ${stationName} on route ${route.routeName}`);
            return; // 跳过无法计算的站点
        }

        // 新增调试输出：operationTime 的值
        console.log(`[showStationDetails] 站点 ${stationName} 的 operationTime:`, operationTime);

        // 检查任一方向是否在运营时间内
        // 在 showStationDetails 中调用 calculateStationOperationTime 时传入 isUpward 参数
        const upwardTime = calculateStationOperationTime(route.routeId, stationName, true);
        const downwardTime = calculateStationOperationTime(route.routeId, stationName, false);

        const isOperating = (upwardTime?.upward && isStationOperatingInDirection(route.routeId, stationName, true)) ||
                            (downwardTime?.downward && isStationOperatingInDirection(route.routeId, stationName, false));
        
        const routeItem = document.createElement('div');
        routeItem.className = 'route-item';
        
        // 检查是否为环线
        const isCircular = busRoutes[route.routeId].stations[0].name === 
            busRoutes[route.routeId].stations[busRoutes[route.routeId].stations.length - 1].name &&
            busRoutes[route.routeId].stations[0].oneWay === 
            busRoutes[route.routeId].stations[busRoutes[route.routeId].stations.length - 1].oneWay;
            
        // 检查是否为单向运行
        const isOneWay = busRoutes[route.routeId].stations.every(station => station.oneWay === "down");

        // 获取运营商颜色
        const operatorColor = operatorColorMap[route.operator] || operatorColorMap.default;
        console.log(`[showStationDetails] 线路 ${route.routeName} 的运营商${route.operator}，颜色: ${operatorColor}`);

        let routeContent = '';
        if (isCircular && isOneWay) {
            // 单向环线只显示一个方向
            const circularDirection = busRoutes[route.routeId].circularDirection === 'clockwise' ? '内环' : '外环';
            routeContent = `
                <div class="route-info-container">
                    <span class="route-name ${isOperating ? 'operating' : 'not-operating'}" style="color: ${isOperating ? operatorColor : 'var(--secondary-text)'};">
                        ${route.routeName}
                    </span>
                    <div class="direction-times">
                        <div class="direction-time">
                            <span class="direction-label">${circularDirection}方向：</span>
                            <span class="operation-time">${operationTime.upward ? operationTime.upward.first + '-' + operationTime.upward.last : '未运营'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (isCircular) {
            // 双向环线显示内环和外环
            const isClockwise = busRoutes[route.routeId].circularDirection === 'clockwise';
            routeContent = `
                <div class="route-info-container">
                    <span class="route-name ${isOperating ? 'operating' : 'not-operating'}" style="color: ${isOperating ? operatorColor : 'var(--secondary-text)'};">
                        ${route.routeName}
                    </span>
                    <div class="direction-times">
                        ${operationTime.upward ? `
                            <div class="direction-time">
                                <span class="direction-label">${isClockwise ? '内环' : '外环'}：</span>
                                <span class="operation-time">${operationTime.upward.first}-${operationTime.upward.last}</span>
                            </div>
                        ` : ''}
                        ${operationTime.downward ? `
                            <div class="direction-time">
                                <span class="direction-label">${isClockwise ? '外环' : '内环'}：</span>
                                <span class="operation-time">${operationTime.downward.first}-${operationTime.downward.last}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // 获取上下行方向的终点站名称
            const upwardStations = busRoutes[route.routeId].stations.filter(s => !s.oneWay || s.oneWay === 'down');
            const downwardStations = busRoutes[route.routeId].stations.filter(s => !s.oneWay || s.oneWay === 'up');
            
            // 为环路特殊处理方向名称
            let upwardDirectionName, downwardDirectionName;
            if (busRoutes[route.routeId].name === '环路') {
                upwardDirectionName = '环一路（反着转）';
                downwardDirectionName = '环二路（正着转）';
            } else {
                // 判断是否为纯单向线路
                const isPureUp = downwardStations.length === 0 && upwardStations.length > 0;
                const isPureDown = upwardStations.length === 0 && downwardStations.length > 0;
                const upwardTerminal = isPureDown ? '' : upwardStations[upwardStations.length - 1]?.name || '';
                const downwardTerminal = isPureUp ? '' : downwardStations[0]?.name || '';
                upwardDirectionName = upwardTerminal ? `${upwardTerminal}方向` : '';
                downwardDirectionName = downwardTerminal ? `${downwardTerminal}方向` : '';
            }

            routeContent = `
                <div class="route-info-container">
                    <span class="route-name ${isOperating ? 'operating' : 'not-operating'}" style="color: ${isOperating ? operatorColor : 'var(--secondary-text)'};">
                        ${route.routeName}
                    </span>
                    <div class="direction-times">
                        ${operationTime.upward ? `
                            <div class="direction-time">
                                <span class="direction-label">${upwardDirectionName}：</span>
                                <span class="operation-time">${operationTime.upward.first}-${operationTime.upward.last}</span>
                            </div>
                        ` : ''}
                        ${operationTime.downward ? `
                            <div class="direction-time">
                                <span class="direction-label">${downwardDirectionName}：</span>
                                <span class="operation-time">${operationTime.downward.first}-${operationTime.downward.last}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        routeItem.innerHTML = routeContent;
        
        routeItem.addEventListener('click', () => {
            renderBusRoute(route.routeId);
            closeModal();
        });
        routeList.appendChild(routeItem);
    });

    modal.classList.add('show');
    overlay.classList.add('show');
}

// 关闭弹窗
function closeModal() {
    const modal = document.querySelector('.station-detail-modal');
    const overlay = document.querySelector('.modal-overlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
}

// 隐藏所有站点操作按钮
function hideAllStationActions() {
    document.querySelectorAll('.station-item.active').forEach(item => {
        item.classList.remove('active');
    });
}

// 设置起点站
function setStartStation(stationName) {
    const desktopInput = document.getElementById('start-station');
    const mobileInput = document.getElementById('mobile-start-station');
    desktopInput.value = stationName;
    mobileInput.value = stationName;
    hideAllStationActions(); // 设置后隐藏操作按钮
}

// 设置终点站
function setEndStation(stationName) {
    const desktopInput = document.getElementById('end-station');
    const mobileInput = document.getElementById('mobile-end-station');
    desktopInput.value = stationName;
    mobileInput.value = stationName;
    hideAllStationActions(); // 设置后隐藏操作按钮
}

// 初始化datalist元素
function initDatalist(type) {
    const searchInput = document.getElementById(`${type}-station`);
    if (!searchInput) {
        console.warn(`${type}-station元素未找到`);
        return;
    }

    // 设置input的list属性
    searchInput.setAttribute('list', `${type}-stations`);

    const datalist = document.createElement("datalist");
    datalist.id = `${type}-stations`;
    searchInput.parentNode.insertBefore(datalist, searchInput.nextSibling);
}

// 为start-station和end-station提供输入建议
function filterStations(query, type) {
    query = query.toLowerCase();
    const filteredStations = getAllStations().filter(stationName => stationName.toLowerCase().includes(query));
    console.log(`过滤后的站点列表 (${type}):`, filteredStations); // 调试信息

    const datalist = document.getElementById(`${type}-stations`);
    if (!datalist) {
        console.warn(`${type}-stations元素未找到`);
        return;
    }

    // 清空现有选项
    while (datalist.firstChild) {
        datalist.removeChild(datalist.firstChild);
    }

    filteredStations.forEach(stationName => {
        const option = document.createElement("option");
        option.value = stationName;
        datalist.appendChild(option);
    });
}

// 监听start-station和end-station的输入事件，并实时更新datalist
document.getElementById('start-station').addEventListener('input', () => {
    const value = document.getElementById('start-station').value;
    console.log('start-station 输入值:', value); // 调试信息
    filterStations(value, 'start');
});
document.getElementById('mobile-start-station').addEventListener('input', () => {
    const value = document.getElementById('mobile-start-station').value;
    console.log('mobile-start-station 输入值:', value); // 调试信息
    filterStations(value, 'mobile-start');
});
document.getElementById('end-station').addEventListener('input', () => {
    const value = document.getElementById('end-station').value;
    console.log('end-station 输入值:', value); // 调试信息
    filterStations(value, 'end');
});
document.getElementById('mobile-end-station').addEventListener('input', () => {
    const value = document.getElementById('mobile-end-station').value;
    console.log('mobile-end-station 输入值:', value); // 调试信息
    filterStations(value, 'mobile-end');
});

// 查找站点所在的线路
function findStationRoutes(stationName) {
    const routes = [];
    Object.entries(busRoutes).forEach(([routeId, route]) => {
        // 对于环线，去掉最后一个重复的站点
        const stations = route.stations[0].name === route.stations[route.stations.length - 1].name ?
            route.stations.slice(0, -1) : route.stations;
            
        const stationIndex = stations.findIndex(s => s.name === stationName);
        if (stationIndex !== -1) {
            routes.push({
                routeId,
                routeName: route.name,
                fare: route.fare,
                operator: route.operator,
                stationIndex,
                stations: stations
            });
        }
    });
    return routes;
}

// 查找所有可能的换乘路线（使用广度优先搜索优化性能）
function findAllPossibleTransferRoutes(startStation, endStation, maxTransfers = 3) {
    const routes = [];
    const visited = new Set(); // 记录已访问的站点
    const queue = []; // 用于BFS的队列

    // 初始化：将所有从起点出发的路线加入队列
    const startRoutes = findStationRoutes(startStation);
    startRoutes.forEach(startRoute => {
        queue.push({
            currentStation: startStation,
            path: [],
            transfers: 0,
            lastRoute: null
        });
    });

    visited.add(startStation);

    while (queue.length > 0) {
        const current = queue.shift();
        
        // 如果超过最大换乘次数，跳过
        if (current.transfers > maxTransfers) {
            continue;
        }

        // 获取当前站点的所有可能路线
        const currentRoutes = findStationRoutes(current.currentStation);

        for (const route of currentRoutes) {
            // 跳过刚刚乘坐的路线
            if (current.lastRoute && route.routeName === current.lastRoute) {
                continue;
            }

            // 检查这条路线是否可以直达终点
            const endStationIndex = route.stations.findIndex(s => s.name === endStation);
            const currentIndex = route.stations.findIndex(s => s.name === current.currentStation);
            
            if (endStationIndex !== -1 && currentIndex !== -1) {
                // 检查是否为环线
                const isCircular = route.stations[0].name === route.stations[route.stations.length - 1].name;
                
                // 检查是否可达（考虑环线和双向运行的情况）
                const isReachable = isCircular || 
                    Math.abs(endStationIndex - currentIndex) !== 0; // 只要不是同一站点就可达
                
                if (isReachable) {
                    if (current.path.length === 0) {
                        // 直达路线
                        routes.push({
                            type: 'direct',
                            route: route.routeName,
                            operator: route.operator,
                            fare: route.fare,
                            stations: [
                                { name: startStation, index: currentIndex },
                                { name: endStation, index: endStationIndex }
                            ]
                        });
                    } else {
                        // 换乘路线
                        const newPath = [...current.path, {
                            name: route.routeName,
                            operator: route.operator,
                            from: current.currentStation,
                            to: endStation
                        }];
                        
                        routes.push({
                            type: newPath.length === 2 ? 'transfer' : 'multi_transfer',
                            routes: newPath,
                            transferStations: current.path.map(p => p.to)
                        });
                    }
                    continue;
                }
            }

            // 如果不能直达终点，寻找可能的换乘站
            const possibleTransfers = route.stations
                .filter(station => {
                    // 检查是否是地铁换乘站点
                    const metroConnection = checkMetroConnection(station.name);
                    // 检查是否有其他公交线路经过该站点
                    const hasOtherBusRoutes = Object.values(busRoutes).some(busRoute => 
                        busRoute.name !== route.routeName && 
                        busRoute.stations.some(s => s.name === station.name)
                    );
                    // 如果是地铁换乘站点或有其他公交线路经过，且未访问过，则可以换乘
                    return (metroConnection.connected || hasOtherBusRoutes) && !visited.has(station.name);
                });

            // 将可能的换乘站加入队列
            for (const transferStation of possibleTransfers) {
                visited.add(transferStation.name);
                queue.push({
                    currentStation: transferStation.name,
                    path: [...current.path, {
                        name: route.routeName,
                        operator: route.operator,
                        from: current.currentStation,
                        to: transferStation.name
                    }],
                    transfers: current.transfers + 1,
                    lastRoute: route.routeName
                });
            }
        }
    }

    return routes;
}

// 查找换乘方案
function findTransferRoutes(startStation, endStation) {
    // 使用优化后的多次换乘查找函数
    const routes = findAllPossibleTransferRoutes(startStation, endStation);
    
    // 计算路线总用时的函数(包含等待时间)
    const calculateTotalTime = route => {
        const getTransferCount = r => {
            if (r.type === 'direct') return 0;
            if (r.type === 'transfer') return 1;
            return r.transferStations.length;
        };

        // 修改后的 getTravelTime 函数
        const getTravelTime = r => {
            let total = 0;
            if (r.type === 'direct') {
                // 获取起点和终点在路线中的索引
                const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === r.route);
                const routeData = busRoutes[routeId];
                const startIndex = routeData.stations.findIndex(s => s.name === r.stations[0].name);
                const endIndex = routeData.stations.findIndex(s => s.name === r.stations[1].name);
                console.log(routeId, '起点和终点索引：', startIndex, endIndex);
                const isDownbound = endIndex > startIndex;
                
                // 读取经过的每一站数据
                if (isDownbound) {
                    for (let i = startIndex; i < endIndex; i++) {
                        const timeSource = isDownbound?routeData.stations[i]:routeData.stations[i+1];
                        const travelTime = timeSource.travelTime || 2;
                        //console.log(routeData.stations[i].name, '获取', timeSource.name, '行驶时间:', travelTime)
                        total += travelTime;// 默认为2分钟
                        console.log(routeData.stations[i].name, '累计行驶时间:', total)
                    }
                } else { 
                    for (let i = endIndex; i < startIndex; i++) {
                        const timeSource = isDownbound?routeData.stations[i]:routeData.stations[i+1];
                        const travelTime = timeSource.travelTime || 2;
                        //console.log(routeData.stations[i].name, '获取', timeSource.name, '行驶时间:', travelTime)
                        total += travelTime;// 默认为2分钟
                        console.log(routeData.stations[i].name, '累计行驶时间:', total)
                    }
                }

                //console.log('累计行驶时间:', total)
                return total;
            }

            r.routes.forEach(segment => {
                const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === segment.name);
                const routeData = busRoutes[routeId];
                const startIndex = routeData.stations.findIndex(s => s.name === segment.from);
                const endIndex = routeData.stations.findIndex(s => s.name === segment.to);
                
                
                const isDownbound = endIndex > startIndex;
                
                // 读取经过的每一站数据
                if (isDownbound) {
                    for (let i = startIndex; i < endIndex; i++) {
                        const timeSource = isDownbound?routeData.stations[i]:routeData.stations[i+1];
                        const travelTime = timeSource.travelTime || 2;
                        //console.log(routeData.stations[i].name, '获取', timeSource.name, '行驶时间:', travelTime)
                        total += travelTime;// 默认为2分钟
                        console.log(routeData.stations[i].name, '累计行驶时间:', total)
                    }
                } else { 
                    for (let i = endIndex; i < startIndex; i++) {
                        const timeSource = isDownbound?routeData.stations[i]:routeData.stations[i+1];
                        const travelTime = timeSource.travelTime || 2;
                        //console.log(routeData.stations[i].name, '获取', timeSource.name, '行驶时间:', travelTime)
                        total += travelTime;// 默认为2分钟
                        console.log(routeData.stations[i].name, '累计行驶时间:', total)
                    }
                }

                //console.log('累计行驶时间:', total)
            });

            return total;
        };

        const travelTime = getTravelTime(route);
        const transferCount = getTransferCount(route);
        const waitingTime = transferCount * 7; // 假设平均等待时间为7分钟
        
        return travelTime + waitingTime;
    };

    // 计算所有路线的用时
    const routesWithTime = routes.map(route => ({
        ...route,
        totalTime: calculateTotalTime(route)
    }));

    // 按总用时排序
    return routesWithTime.sort((a, b) => a.totalTime - b.totalTime);
}

// 合并相似换乘方案
function mergeTransferRoutes(routes) {
    // 第一步：按换乘次数分组
    const routesByTransferCount = {};
    routes.forEach(route => {
        const transferCount = route.type === 'direct' ? 0 : route.routes.length - 1;
        if (!routesByTransferCount[transferCount]) {
            routesByTransferCount[transferCount] = [];
        }
        routesByTransferCount[transferCount].push(route);
    });

    // 第二步：在每个组内合并相似路线
    const mergedRoutes = [];
    Object.values(routesByTransferCount).forEach(routeGroup => {
        // 对于直达路线，合并相同线路
        if (routeGroup[0].type === 'direct') {
            const directRoutes = {};
            routeGroup.forEach(route => {
                if (!directRoutes[route.route]) {
                    directRoutes[route.route] = route;
                }
            });
            mergedRoutes.push(...Object.values(directRoutes));
            return;
        }

        // 对于换乘路线，先按线路序列和方向分组
        const routeSequenceGroups = {};
        routeGroup.forEach(route => {
            const routeSequence = route.routes.map(r => {
                const direction = getRouteDirection(Object.keys(busRoutes).find(id => busRoutes[id].name === r.name), r.from, r.to);
                return `${r.name}-${direction}`;
            }).join('→');
            if (!routeSequenceGroups[routeSequence]) {
                routeSequenceGroups[routeSequence] = [];
            }
            routeSequenceGroups[routeSequence].push(route);
        });

        // 合并每个线路序列组内的路线
        Object.values(routeSequenceGroups).forEach(sequenceGroup => {
            const baseRoute = sequenceGroup[0];
            const transferOptions = [];

            // 收集所有换乘站点组合
            sequenceGroup.forEach(route => {
                const transfers = route.routes.map((r, i) => ({
                    from: r.from,
                    to: r.to,
                    routeName: r.name,
                    segment: i
                }));
                transferOptions.push(transfers);
            });

            // 按段合并换乘站点
            const mergedSegments = [];
            for (let i = 0; i < baseRoute.routes.length; i++) {
                const segmentTransfers = transferOptions.map(opt => opt.find(t => t.segment === i));
                const uniqueTransfers = new Set();
                segmentTransfers.forEach(transfer => {
                    uniqueTransfers.add(`${transfer.from}-${transfer.to}`);
                });
                mergedSegments.push({
                    name: baseRoute.routes[i].name,
                    transfers: Array.from(uniqueTransfers)
                });
            }

            // 创建合并后的路线对象
            const mergedRoute = {
                ...baseRoute,
                mergedSegments
            };
            mergedRoutes.push(mergedRoute);
        });

        // 合并换乘站相同但线路不同的方案
        const transferStationGroups = {};
        routeGroup.forEach(route => {
            const transferStations = route.type === 'direct' ? [] : 
                route.routes.slice(0, -1).map(r => r.to);
            const key = transferStations.join('/');
            if (!transferStationGroups[key]) {
                transferStationGroups[key] = [];
            }
            transferStationGroups[key].push(route);
        });

        Object.values(transferStationGroups).forEach(stationGroup => {
            if (stationGroup.length > 1) {
                const segments = [];
                const firstRoute = stationGroup[0];
                const segmentCount = firstRoute.routes.length;

                for (let i = 0; i < segmentCount; i++) {
                    const routeNames = new Set();
                    const directions = new Set(); // 收集方向信息
                    stationGroup.forEach(route => {
                        routeNames.add(route.routes[i].name);
                        directions.add(getRouteDirection(Object.keys(busRoutes).find(id => busRoutes[id].name === route.routes[i].name), route.routes[i].from, route.routes[i].to)); // 获取方向信息
                    });
                    segments.push({
                        routes: Array.from(routeNames),
                        directions: Array.from(directions), // 包含方向信息
                        from: firstRoute.routes[i].from,
                        to: firstRoute.routes[i].to
                    });
                }

                const mergedRoute = {
                    ...firstRoute,
                    alternativeRoutes: segments
                };
                mergedRoutes.push(mergedRoute);
            }
        });
    });

    return mergedRoutes;
}

// 获取路线方向描述
function getRouteDirection(routeId, fromStation, toStation) {
    const route = busRoutes[routeId];
    if (!route) {
        console.warn('Route not found for routeId:', routeId);
        return '';
    }

    // 获取上下行方向的站点
    const upwardStations = route.stations.filter(s => !s.oneWay || s.oneWay === 'down');
    const downwardStations = route.stations.filter(s => !s.oneWay || s.oneWay === 'up');

    // 检查是否为环路
    if (route.name === '环路') {
        // 在上行方向中查找站点位置
        const upFromIndex = upwardStations.findIndex(s => s.name === fromStation);
        const upToIndex = upwardStations.findIndex(s => s.name === toStation);
        
        // 在下行方向中查找站点位置
        const downFromIndex = downwardStations.findIndex(s => s.name === fromStation);
        const downToIndex = downwardStations.findIndex(s => s.name === toStation);

        // 判断方向
        if (upFromIndex !== -1 && upToIndex !== -1 && upFromIndex < upToIndex) {
            return '（环一路“反着转”）'; // 上行方向
        } else if (downFromIndex !== -1 && downToIndex !== -1 && downFromIndex > downToIndex) {
            return '（环二路“正着转”）'; // 下行方向
        }
    }

    // 检查是否为环线
    const isCircular = route.stations[0].name === route.stations[route.stations.length - 1].name;
    if (isCircular) {
        const isClockwise = route.circularDirection === 'clockwise';
        return isClockwise ? '（内环）' : '（外环）';
    }

    // 在上行方向中查找站点位置
    const upFromIndex = upwardStations.findIndex(s => s.name === fromStation);
    const upToIndex = upwardStations.findIndex(s => s.name === toStation);
    
    // 在下行方向中查找站点位置
    const downFromIndex = downwardStations.findIndex(s => s.name === fromStation);
    const downToIndex = downwardStations.findIndex(s => s.name === toStation);

    // 判断方向
    if (upFromIndex !== -1 && upToIndex !== -1 && upFromIndex < upToIndex) {
        return ` ${upwardStations[upwardStations.length - 1].name}方向`;
    } else if (downFromIndex !== -1 && downToIndex !== -1 && downFromIndex > downToIndex) {
        return ` ${downwardStations[0].name}方向`;
    }
    
    //console.warn('Direction could not be determined for routeId:', routeId, 'fromStation:', fromStation, 'toStation:', toStation);
    return '';
}

// 修改渲染换乘结果的函数
function renderTransferResults(routes, resultsContainer) {
    if (!routes || routes.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">未找到合适的换乘方案</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    resultsContainer.style.display = 'block';

    // 合并相似路线
    const mergedRoutes = mergeTransferRoutes(routes);

    // 按总用时排序所有合并后的路线
    mergedRoutes.sort((a, b) => a.totalTime - b.totalTime);

    let routeIndex = 0; // 初始化方案编号
    const routesHtml = mergedRoutes.map((route) => {
        const operationWarning = route.operationStatus && route.operationStatus.length > 0 
            ? `<div class="operation-warning">${route.operationStatus.join('，')}</div>` 
            : '';

        if (route.type === 'direct') {
            // 直达路线
            const stationCount = Math.abs(route.stations[1].index - route.stations[0].index);
            const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === route.route);
            const direction = getRouteDirection(routeId, route.stations[0].name, route.stations[1].name);
            const operatorColor = operatorColorMap[route.operator] || operatorColorMap.default;
            //console.log(`直达路线：${route.route} ${direction} ${route.operator} ${operatorColor}`);
            
            // 检查方向信息是否存在
            if (!direction) {
                return ''; // 跳过该直达路线
            }

            routeIndex++; // 增加方案编号
            //console.log('直达路线原始数据：', route);
            return `
                <div class="transfer-route ${route.operationStatus && route.operationStatus.length > 0 ? 'not-operating' : ''}" data-route-index="${routeIndex}">
                    <h3>方案 ${routeIndex}：${route.route}</h3>
                    ${operationWarning}
                    <div class="route-info">
                        <span>预计 ${route.totalTime} 分钟</span>
                        <span>票价 ${route.fare} 元</span>
                    </div>
                    <ul class="route-steps">
                        <li class="route-step start">
                            <a href="#" class="station-link" data-station="${route.stations[0].name}" onclick="handleRouteStepClick(event, this)">${route.stations[0].name} 出发</a>
                        </li>
                        <li class="route-step">
                            <a href="#" class="route-link" data-route="${route.route}" onclick="handleRouteStepClick(event, this)">${route.route}${direction}</a> 乘坐${stationCount}站
                        </li>
                        <li class="route-step end">
                            <a href="#" class="station-link" data-station="${route.stations[1].name}" onclick="handleRouteStepClick(event, this)">到达 ${route.stations[1].name}</a>
                        </li>
                    </ul>
                    <div class="route-actions">
                        <button class="action-button" onclick="copyRouteText(${routeIndex})">
                            <img src="../UI/res/copy_black.png" alt="复制" width="16" height="16">
                            复制文本
                        </button>
                        <button class="action-button" onclick="saveRouteImage(${routeIndex})">
                            <img src="../UI/res/image_black.png" alt="保存" width="16" height="16">
                            保存图片
                        </button>
                        <button class="action-button" onclick="showAddTripDialog(${routeIndex})">
                            <img src="../UI/res/agenda_black.png" alt="提醒" width="16" height="16">
                            添加提醒
                        </button>
                    </div>
                </div>
            `;
        } else {
            // 换乘路线
            let routeSteps = '';
            let routeTitle = '';
            let hasInvalidRouteLink = false; // 标记是否存在无效的 route-link

            const transferCount = route.routes.length - 1;

            //将每一段线路的票价相加行程最终票价，如果某一段线路没有记录票价则默认这一段线路2元
            const fare = Math.round(
                route.routes.reduce((acc, cur) => {
                    const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === cur.name);
                    if (routeId) {
                        const routeFare = busRoutes[routeId].fare;
                        if (routeFare) {
                            return acc + routeFare;
                        } else {
                            return acc + 2;
                        }
                    } else {
                        return acc + 2;
                    }
                }, 0)
            );

            if (route.alternativeRoutes) {
                // 渲染有多个可选线路的方案
                routeTitle = route.alternativeRoutes.map(segment => 
                    segment.routes.join('/')
                ).join('→');
                
                routeSteps = route.alternativeRoutes.map((segment, segmentIndex) => {
                    const routeOptions = segment.routes.join('/');
                    // 获取该线路的站点列表
                    const routeData = findStationRoutes(segment.from).find(r => 
                        segment.routes.includes(r.routeName)
                    );
                    const startIndex = routeData.stations.findIndex(s => s.name === segment.from);
                    const endIndex = routeData.stations.findIndex(s => s.name === segment.to);
                    const stationCount = Math.abs(endIndex - startIndex);
                    
                    // 获取每条可选线路的方向
                    const directions = segment.routes.map(routeName => {
                        const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === routeName);
                        return getRouteDirection(routeId, segment.from, segment.to);
                    });
                    const routeWithDirections = segment.routes.map((r, i) => `${r}${directions[i]}`).join('/');

                    // 检查方向信息是否存在
                    if (directions.some(direction => !direction)) {
                        hasInvalidRouteLink = true; // 标记存在无效的 route-link
                        return ''; // 跳过该路线
                    }

                    const operatorColor = operatorColorMap[route.operator] || operatorColorMap.default;
                    //console.log(`多个可选线路方案：${route.route} ${route.operator} ${operatorColor}`);

                    if (segmentIndex === 0) {
                        return `
                            <li class="route-step start">
                                <a href="#" class="station-link" data-station="${segment.from}" onclick="handleRouteStepClick(event, this)">${segment.from} 出发</a>
                            </li>
                            <li class="route-step">
                                ${segment.routes.map(route => `
                                    <a href="#" class="route-link" style="color:${operatorColor}" data-route="${route}" onclick="handleRouteStepClick(event, this)">${route}${directions[segment.routes.indexOf(route)]}</a>
                                `).join(' / ')} 乘坐${stationCount}站
                            </li>
                        `;
                    } else if (segmentIndex === route.alternativeRoutes.length - 1) {
                        return `
                            <li class="route-step transfer">
                                <a href="#" class="station-link" data-station="${segment.from}" onclick="handleRouteStepClick(event, this)">${segment.from}</a> 换乘
                            </li>
                            <li class="route-step">
                                ${segment.routes.map(route => `
                                    <a href="#" class="route-link" style="color:${operatorColor}" data-route="${route}" onclick="handleRouteStepClick(event, this)">${route}${directions[segment.routes.indexOf(route)]}</a>
                                `).join(' / ')} 乘坐${stationCount}站
                            </li>
                            <li class="route-step end">
                                <a href="#" class="station-link" data-station="${segment.to}" onclick="handleRouteStepClick(event, this)">到达 ${segment.to}</a>
                            </li>
                        `;
                    } else {
                        return `
                            <li class="route-step transfer">
                                <a href="#" class="station-link" data-station="${segment.from}" onclick="handleRouteStepClick(event, this)">${segment.from}</a> 换乘
                            </li>
                            <li class="route-step">
                                ${segment.routes.map(route => `
                                    <a href="#" class="route-link" style="color:${operatorColor}" data-route="${route}" onclick="handleRouteStepClick(event, this)">${route}${directions[segment.routes.indexOf(route)]}</a>
                                `).join(' / ')} 乘坐${stationCount}站
                            </li>
                        `;
                    }
                }).join('');
            } else if (route.mergedSegments) {
                // 渲染合并了换乘站的方案
                routeTitle = route.routes.map(r => r.name).join('→');
                
                routeSteps = route.mergedSegments.map((segment, segmentIndex) => {
                    const transferOptions = segment.transfers.map(t => {
                        const [from, to] = t.split('-');
                        return from;
                    }).filter((value, index, self) => self.indexOf(value) === index); // 去重

                    // 获取该线路的站点列表
                    const routeData = findStationRoutes(route.routes[segmentIndex].from).find(r => 
                        r.routeName === route.routes[segmentIndex].name
                    );
                    const startIndex = routeData.stations.findIndex(s => s.name === route.routes[segmentIndex].from);
                    const endIndex = routeData.stations.findIndex(s => s.name === route.routes[segmentIndex].to);
                    const stationCount = Math.abs(endIndex - startIndex);

                    // 获取方向信息
                    const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === segment.name);
                    const direction = getRouteDirection(routeId, route.routes[segmentIndex].from, route.routes[segmentIndex].to);

                    const operatorColor = operatorColorMap[segment.operator] || operatorColorMap.default;
                    //console.log(`合并换乘站方案：${segment.route} ${direction} ${segment.operator} ${operatorColor}`);

                    let transferText = '';
                    // 检查方向信息是否存在
                    if (!direction) {
                        hasInvalidRouteLink = true; // 标记存在无效的 route-link
                        return ''; // 跳过该路线
                    } else if (transferOptions.length > 1) {
                        transferText = `
                            <li class="route-step transfer">
                                ${transferOptions.map(station => `
                                    <a href="#" class="station-link" data-station="${station}" onclick="handleRouteStepClick(event, this)">${station}</a>
                                `).join(' / ')} 换乘
                            </li>
                        `;
                    } else if (transferOptions.length === 1) {
                        transferText = `
                            <li class="route-step transfer">
                                <a href="#" class="station-link" data-station="${transferOptions[0]}" onclick="handleRouteStepClick(event, this)">${transferOptions[0]}</a> 换乘
                            </li>
                        `;
                    }

                    if (segmentIndex === 0) {
                        return `
                            <li class="route-step start">
                                <a href="#" class="station-link" data-station="${route.routes[0].from}" onclick="handleRouteStepClick(event, this)">${route.routes[0].from} 出发</a>
                            </li>
                            <li class="route-step">
                                <a href="#" class="route-link" style="color:${operatorColor}" data-route="${segment.name}" onclick="handleRouteStepClick(event, this)">${segment.name}${direction}</a> 乘坐${stationCount}站
                            </li>
                        `;
                    } else if (segmentIndex === route.mergedSegments.length - 1) {
                        return `
                            ${transferText}
                            <li class="route-step">
                                <a href="#" class="route-link" style="color:${operatorColor}" data-route="${segment.name}" onclick="handleRouteStepClick(event, this)">${segment.name}${direction}</a> 乘坐${stationCount}站
                            </li>
                            <li class="route-step end">
                                <a href="#" class="station-link" data-station="${route.routes[route.routes.length - 1].to}" onclick="handleRouteStepClick(event, this)">到达 ${route.routes[route.routes.length - 1].to}</a>
                            </li>
                        `;
                    } else {
                        return `
                            ${transferText}
                            <li class="route-step">
                                <a href="#" class="route-link" style="color:${operatorColor}" data-route="${segment.name}" onclick="handleRouteStepClick(event, this)">${segment.name}${direction}</a> 乘坐${stationCount}站
                            </li>
                        `;
                    }
                }).join('');
            }            

            // 检查每个 route-link 是否包含方向信息
            const routeStepsArray = routeSteps.split('</li>');
            const validRouteSteps = routeStepsArray.filter(step => {
                const routeLink = step.match(/<a href="#" class="route-link" data-route="([^"]+)" onclick="handleRouteStepClick\(event, this\)">([^<]+)/);
                if (routeLink) {
                    const routeName = routeLink[1];
                    const stationName = routeLink[2].split(' ')[0]; // 假设方向信息在名称后面
                    const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === routeName);
                    const direction = getRouteDirection(routeId, stationName, routeName);
                    if (routeLink[1] === routeLink[2]) {
                        hasInvalidRouteLink = true; // 标记存在无效的 route-link
                    }
                    if (routeId) {
                        const operator = busRoutes[routeId].operator || "default";
                        const color = operatorColorMap[operator] || operatorColorMap.default;
                        // 将颜色应用到 route-link（例如通过 style 或 class）
                        return step.replace('<a ', `<a style="color: ${color}" `);
                    }
                    return direction || routeLink[1] !== routeLink[2]; // 如果有方向信息或route-link和route文字内容不同则保留该步骤
                }
                return true; // 如果不是 route-link 则保留该步骤
            }).join('</li>');

            // 如果所有步骤都无效或存在无效的 route-link，则跳过该换乘方案
            if (!validRouteSteps || hasInvalidRouteLink) {
                return '';
            }

            routeIndex++; // 增加方案编号
            return `
                <div class="transfer-route ${route.operationStatus && route.operationStatus.length > 0 ? 'not-operating' : ''}" data-route-index="${routeIndex}">
                    <h3>方案 ${routeIndex}：${routeTitle}</h3>
                    ${operationWarning}
                    <div class="route-info">
                        <span>预计 ${route.totalTime} 分钟</span>
                        <span>票价 ${fare} 元</span>
                        <span>换乘 ${transferCount} 次</span>
                    </div>
                    <ul class="route-steps">
                        ${validRouteSteps}
                    </ul>
                    <div class="route-actions">
                        <button class="action-button" onclick="copyRouteText(${routeIndex})">
                            <img src="../UI/res/copy_black.png" alt="复制" width="16" height="16">
                            复制文本
                        </button>
                        <button class="action-button" onclick="saveRouteImage(${routeIndex})">
                            <img src="../UI/res/image_black.png" alt="保存" width="16" height="16">
                            保存图片
                        </button>
                        <button class="action-button" onclick="showAddTripDialog(${routeIndex})">
                            <img src="../UI/res/agenda_black.png" alt="提醒" width="16" height="16">
                            添加提醒
                        </button>
                    </div>
                </div>
            `;
        }
    }).filter(html => html.trim() !== '').join('');

    resultsContainer.innerHTML = routesHtml;
}

window.handleRouteStepClick = function(event, element) {
    event.preventDefault(); // 阻止默认行为

    // 获取 route-section 元素
    const routeSection = document.querySelector('.route-section');
    console.log('routeSection:', routeSection);

    // 滚动到 route-section 的顶部
    routeSection.scrollIntoView({ behavior: 'smooth' });
    console.log('Scrolled to route-section');

    const elementType = element.className.includes('station-link') ? 'station' : 'route';
    const name = element.getAttribute(`data-${elementType}`);
    console.log('ElementType:', elementType, 'Name:', name);

    if (elementType === 'station') {
        // 站名点击事件
        console.log('Station clicked:', name);
        showStationDetails(name);
    } else if (elementType === 'route') {
        // 线路名点击事件
        const routeId = Object.keys(busRoutes).find(id => busRoutes[id].name === name);
        console.log('RouteId:', routeId);

        if (routeId) {
            renderBusRoute(routeId);
            console.log('Rendered bus route:', routeId);

            // 尝试切换到对应方向
            const direction = getRouteDirection(routeId, element.getAttribute('data-station'), name);
            console.log('Direction:', direction);

            if (direction) {
                const directionTabs = routeSection.querySelector('.direction-tabs');
                console.log('DirectionTabs:', directionTabs);

                if (directionTabs) {
                    // 根据方向名称找到对应的tab按钮
                    const tabButton = directionTabs.querySelector(`.tab-button[data-direction="${direction.toLowerCase()}"]`);
                    console.log('TabButton:', tabButton);

                    if (tabButton) {
                        tabButton.click();
                        console.log('Clicked tab button for direction:', direction);
                    } else {
                        console.warn('Tab button not found for direction:', direction);
                    }
                } else {
                    console.warn('Direction tabs not found');
                }
            } else {
                console.warn('Direction not determined');
            }

            // 滚动到特定车站的位置
            const routeSteps = Array.from(routeSection.querySelectorAll('.route-step'));
            console.log('RouteSteps:', routeSteps);

            const clickedStepIndex = routeSteps.findIndex(step => step.contains(element));
            console.log('ClickedStepIndex:', clickedStepIndex);

            if (clickedStepIndex > 0) {
                const targetStep = routeSteps[clickedStepIndex - 1];
                console.log('TargetStep:', targetStep);

                const stationLink = targetStep.querySelector('.station-link');
                console.log('StationLink:', stationLink);

                if (stationLink) {
                    const stationName = stationLink.getAttribute('data-station');
                    console.log('StationName:', stationName);

                    const stationElement = routeSection.querySelector(`.station-item[data-station="${stationName}"]`);
                    console.log('StationElement:', stationElement);

                    if (stationElement) {
                        stationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        console.log('Scrolled to station:', stationName);
                    } else {
                        console.warn('Station element not found for station:', stationName);
                    }
                } else {
                    console.warn('Station link not found in target step');
                }
            } else {
                console.warn('Clicked step index is not valid:', clickedStepIndex);
            }
        } else {
            console.warn('Route ID not found for route name:', name);
        }
    }
};

function vn() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 继续处理 range
    } else {
        // 处理 selection 为空的情况
        console.log('Selection is empty');
    }
}

// 复制换乘方案文本
window.copyRouteText = function(routeIndex) {
    const routeElement = document.querySelector(`.transfer-route[data-route-index="${routeIndex}"]`);
    if (!routeElement) {
        console.error('Route element not found for index:', routeIndex);
        return;
    }

    const steps = Array.from(routeElement.querySelectorAll('.route-step')).map(step => step.textContent.trim());
    const routeInfo = routeElement.querySelector('.route-info').textContent.trim();
    
    const text = `${steps.join('\n')}\n${routeInfo}\n\n来自雨城通`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
    });
}

// 保存换乘方案为图片
window.saveRouteImage = async function(routeIndex) {
    const routeElement = document.querySelector(`.transfer-route[data-route-index="${routeIndex}"]`);
    if (!routeElement) {
        console.error('Route element not found for index:', routeIndex);
        return;
    }

    const imageFooter = document.getElementById('image-footer');
    if (!imageFooter) {
        console.error('Image footer element not found');
        return;
    }
    
    // 创建临时容器
    const container = document.createElement('div');
    container.className = 'image-container';
    
    // 克隆路线信息，但不包含操作按钮
    const routeClone = routeElement.cloneNode(true);
    const actionsElement = routeClone.querySelector('.route-actions');
    if (actionsElement) {
        actionsElement.remove();
    }
    container.appendChild(routeClone);
    
    // 显示页脚
    const footerClone = imageFooter.cloneNode(true);
    footerClone.style.display = 'block';
    container.appendChild(footerClone);
    
    // 添加到文档中以便计算尺寸
    document.body.appendChild(container);
    
    try {
        // 设置固定宽度
        container.style.width = '480px';
        container.style.overflow = 'hidden'; // 防止内容溢出
        
        const canvas = await html2canvas(container, {
            backgroundColor: 'transparent',
            scale: 2,
            useCORS: true
        });

        // 获取起点和终点名称
        const steps = Array.from(routeElement.querySelectorAll('.route-step'));
        const startStation = steps[0].querySelector('.station-link').textContent.trim().replace(' 出发', '');
        const endStation = steps[steps.length - 1].querySelector('.station-link').textContent.trim().replace('到达 ', '');

        // 获取实际的方案编号（而不是 routeIndex）
        const actualRouteIndex = parseInt(routeElement.getAttribute('data-route-index'));

        const link = document.createElement('a');
        link.download = `${startStation}→${endStation} 方案${actualRouteIndex}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('图片已保存');
    } catch (err) {
        console.error('保存图片失败:', err);
        showToast('保存图片失败');
    } finally {
        // 移除临时容器
        document.body.removeChild(container);
    }
}

// 显示添加行程提醒对话框
window.showAddTripDialog = function(routeIndex) {
    const dialog = document.getElementById('add-trip-dialog');
    if (!dialog) {
        console.error('Add trip dialog element not found');
        return;
    }

    const routeElement = document.querySelector(`.transfer-route[data-route-index="${routeIndex}"]`);
    if (!routeElement) {
        console.error('Route element not found for index:', routeIndex);
        return;
    }

    const estimatedTime = parseInt(routeElement.querySelector('.route-info').textContent.match(/预计 (\d+) 分钟/)[1]);
    
    dialog.setAttribute('data-route-index', routeIndex);
    
    // 设置默认时间为当前时间往后30分钟
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    now.setMinutes(now.getMinutes() - now.getMinutes() % 5); // 向下取整到最近的5分钟
    
    // 格式化为本地时间字符串
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('trip-time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // 计算预计到达时间
    const arrivalTime = new Date(now.getTime() + estimatedTime * 60000);
    
    dialog.style.display = 'block';
}

// 隐藏添加行程提醒对话框
window.hideAddTripDialog = function() {
    const dialog = document.getElementById('add-trip-dialog');
    dialog.style.display = 'none';
}

// 添加行程提醒
window.addTripReminder = function() {
    const dialog = document.getElementById('add-trip-dialog');
    const routeIndex = dialog.getAttribute('data-route-index');
    const tripTime = document.getElementById('trip-time').value;
    const timeType = document.querySelector('input[name="timeType"]:checked').value;
    const routeElement = document.querySelector(`.transfer-route[data-route-index="${routeIndex}"]`);
    
    // 获取路线信息
    const steps = Array.from(routeElement.querySelectorAll('.route-step')).map(step => step.textContent.trim());
    const fare = parseInt(routeElement.querySelector('.route-info').textContent.match(/票价 (\d+) 元/)[1]);
    const estimatedTime = parseInt(routeElement.querySelector('.route-info').textContent.match(/预计 (\d+) 分钟/)[1]);
    const lines = [];

    // 将steps中偶数项空格之前的部分提取为lines
    for (let i = 1; i < steps.length; i += 2) {
        const line = steps[i].split(' ')[0];
        if (line) {
            lines.push(line);
        }
    }
    
    // 解析选择的时间
    const selectedTime = new Date(tripTime);
    
    // 根据时间类型计算实际出发/到达时间
    let departureTime, arrivalTime;
    if (timeType === 'departure') {
        departureTime = selectedTime;
        arrivalTime = new Date(selectedTime.getTime() + estimatedTime * 60000);
    } else {
        arrivalTime = selectedTime;
        departureTime = new Date(selectedTime.getTime() - estimatedTime * 60000);
    }
    
    // 格式化行程信息
    const tripData = {
        id: ('bus_' + Date.now()), // 使用时间戳作为唯一ID
        type: 'bus',
        date: departureTime.toISOString().split('T')[0],
        status: 'upcoming',
        route:{
            departure:steps[0].replace(' 出发', ''),
            arrival: steps[steps.length - 1].replace('到达 ', ''),
            time: departureTime.toTimeString().slice(0, 5),
            arrivalTime: arrivalTime.toTimeString().slice(0, 5),
            id: '',
            line: lines.join('→'),
            price: fare,
            company: '公交换乘查询',
        },
        lines: window.location.hash.slice(1) || lines.join(','),
    };
    
    // 从 localStorage 获取现有行程
    let trips = [];
    try {
        const storedTrips = localStorage.getItem('orders');
        if (storedTrips) {
            trips = JSON.parse(storedTrips);
        }
    } catch (err) {
        console.error('读取行程数据失败:', err);
    }
    
    // 添加新行程
    trips.push(tripData);
    
    // 按出发时间排序
    trips.sort((a, b) => a.timestamp - b.timestamp);
    
    // 保存回 localStorage
    try {
        localStorage.setItem('orders', JSON.stringify(trips));
        showToast('行程提醒添加成功');
    } catch (err) {
        console.error('保存行程数据失败:', err);
        showToast('保存行程失败');
    }
    
    hideAddTripDialog();
}

// 获取所有车站（用于搜索）
function getAllStations() {
    const stations = new Set();
    Object.values(busRoutes).forEach(route => {
        route.stations.forEach(station => {
            stations.add(station.name);
        });
    });
    return Array.from(stations);
}

// 监听搜索面板
document.addEventListener('DOMContentLoaded', () => {
    // 初始化datalist元素
    initDatalist('start');
    initDatalist('end');
    initDatalist('mobile-start');
    initDatalist('mobile-end');

    // 添加事件委托以处理动态生成的 .route-link 点击事件
    document.body.addEventListener('click', (event) => {
        const routeLink = event.target.closest('.route-link');
        if (routeLink) {
            handleRouteStepClick(event, routeLink);
        }
    });

    // 浮动面板切换功能
    const togglePanelButton = document.getElementById('toggle-transfer-panel');
    const transferPanel = document.querySelector('.transfer-panel');
    let isPanelVisible = true;

    togglePanelButton.addEventListener('click', () => {
        isPanelVisible = !isPanelVisible;
        transferPanel.classList.toggle('hidden', !isPanelVisible);
        togglePanelButton.title = isPanelVisible ? '隐藏换乘面板' : '显示换乘面板';
        togglePanelButton.querySelector('img').style.opacity = isPanelVisible ? '1' : '0.5';
    });

    // 搜索面板相关元素
    const searchPanelButton = document.getElementById('search-button');
    const searchPanel = document.querySelector('.search-panel');
    const closeSearch = document.querySelector('.close-search');
    const searchInput = document.querySelector('.search-panel input');
    const searchResults = document.querySelector('.search-results');

    // 打开搜索面板
    searchPanelButton.addEventListener('click', () => {
        searchPanel.classList.remove('hidden');
        searchInput.focus();
    });

    // 关闭搜索面板
    closeSearch.addEventListener('click', () => {
        searchPanel.classList.add('hidden');
    });

    // 搜索功能
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';

        if (query) {
            // 搜索线路
            Object.entries(busRoutes).forEach(([id, route]) => {
                if (route.name.toLowerCase().includes(query)) {
                    const div = document.createElement('div');
                    div.className = 'search-result-item route';
                    div.textContent = route.name;
                    div.addEventListener('click', () => {
                        renderBusRoute(id);
                        searchPanel.classList.add('hidden');
                    });
                    searchResults.appendChild(div);
                }
            });

            // 搜索车站
            getAllStations().forEach(stationName => {
                if (stationName.toLowerCase().includes(query)) {
                    const div = document.createElement('div');
                    div.className = 'search-result-item station';
                    div.innerHTML = `
                        <div class="station-info">
                            <span>${stationName}</span>
                        </div>
                        <div class="station-actions">
                            <button class="station-action-btn" data-action="details">
                                <img src="../UI/res/info_black.png" alt="详情" width="16" height="16">
                                详情
                            </button>
                            <button class="station-action-btn set-start" data-action="set-start">
                                <img src="../UI/res/enter_black.png" alt="起点" width="16" height="16">
                                设为起点
                            </button>
                            <button class="station-action-btn set-end" data-action="set-end">
                                <img src="../UI/res/logout_black.png" alt="终点" width="16" height="16">
                                设为终点
                            </button>
                        </div>
                    `;

                    // 添加站点点击事件
                    div.addEventListener('click', (e) => {
                        const actionButton = e.target.closest('.station-action-btn');
                        
                        // 如果点击的是操作按钮，执行相应操作
                        if (actionButton) {
                            const action = actionButton.dataset.action;
                            switch (action) {
                                case 'details':
                                    showStationDetails(stationName);
                                    searchPanel.classList.add('hidden');
                                    break;
                                case 'set-start':
                                    setStartStation(stationName);
                                    searchPanel.classList.add('hidden');
                                    break;
                                case 'set-end':
                                    setEndStation(stationName);
                                    searchPanel.classList.add('hidden');
                                    break;
                            }
                            return;
                        }

                        // 如果点击的不是操作按钮
                        // 移除其他站点的active状态
                        searchResults.querySelectorAll('.search-result-item.station.active').forEach(item => {
                            if (item !== div) {
                                item.classList.remove('active');
                            }
                        });
                        
                        // 切换当前站点的active状态
                        div.classList.toggle('active');
                    });

                    searchResults.appendChild(div);
                }
            });
        }
    });

    // 换乘查询功能 - 桌面版
    const startInput = document.getElementById('start-station');
    const endInput = document.getElementById('end-station');
    const desktopSearchButton = document.getElementById('search-transfer');
    const desktopClearButton = document.getElementById('clear-transfer');

    // 换乘查询功能 - 移动版
    const mobileStartInput = document.getElementById('mobile-start-station');
    const mobileEndInput = document.getElementById('mobile-end-station');
    const mobileSearchButton = document.getElementById('mobile-search-transfer');
    const mobileClearButton = document.getElementById('mobile-clear-transfer');

    // 处理桌面版搜索
    function handleDesktopSearch() {
        const startStation = startInput.value.trim();
        const endStation = endInput.value.trim();

        if (!startStation || !endStation) {
            alert('请输入起点站和终点站');
            return;
        }

        const routes = findTransferRoutes(startStation, endStation);
        const resultsContainer = document.querySelector('.transfer-section .transfer-results');
        renderTransferResults(routes, resultsContainer);
    }

    // 处理移动版搜索
    function handleMobileSearch() {
        const startStation = mobileStartInput.value.trim();
        const endStation = mobileEndInput.value.trim();

        if (!startStation || !endStation) {
            alert('请输入起点站和终点站');
            return;
        }

        const routes = findTransferRoutes(startStation, endStation);
        const resultsContainer = document.querySelector('.transfer-panel .transfer-results');
        renderTransferResults(routes, resultsContainer);
    }

    // 处理桌面版清空
    function handleDesktopClear() {
        startInput.value = '';
        endInput.value = '';
        const resultsContainer = document.querySelector('.transfer-section .transfer-results');
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }

    // 处理移动版清空
    function handleMobileClear() {
        mobileStartInput.value = '';
        mobileEndInput.value = '';
        const resultsContainer = document.querySelector('.transfer-panel .transfer-results');
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }

    // 绑定事件处理
    desktopSearchButton.addEventListener('click', handleDesktopSearch);
    desktopClearButton.addEventListener('click', handleDesktopClear);
    mobileSearchButton.addEventListener('click', handleMobileSearch);
    mobileClearButton.addEventListener('click', handleMobileClear);

    // 同步桌面版和移动版的输入
    startInput.addEventListener('input', e => mobileStartInput.value = e.target.value);
    endInput.addEventListener('input', e => mobileEndInput.value = e.target.value);
    mobileStartInput.addEventListener('input', e => startInput.value = e.target.value);
    mobileEndInput.addEventListener('input', e => endInput.value = e.target.value);

    // 添加关闭弹窗的事件监听
    const closeModalBtn = document.querySelector('.close-modal');
    const overlay = document.querySelector('.modal-overlay');

    closeModalBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // 添加全局点击事件监听，处理点击外部隐藏操作按钮
    document.addEventListener('click', (e) => {
        // 如果点击的是站点项或其子元素，不处理
        if (e.target.closest('.station-item')) {
            return;
        }
        // 点击其他区域，隐藏所有站点操作按钮
        hideAllStationActions();
    });

    // 新增：解析URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const routeIdFromURL = urlParams.get('route');

    // 加载地铁数据并显示对应的路线
    loadMetroData().then(() => {
        // 检查参数中的routeID是否有效
        if (routeIdFromURL) {
            renderBusRoute(routeIdFromURL); // 渲染指定线路
        } else {
            renderBusRoute();
        }
    });
});