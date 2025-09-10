// 在模块顶部添加数据加载逻辑
let busRoutes;
let sortStates = {}; // 存储每个排行榜的排序状态

// 动态加载数据
async function loadBusData() {
    try {
        // 动态导入bus_data.js模块
        const busDataModule = await import('/data/bus_data.js');
        busRoutes = busDataModule.default;
        return true;
    } catch (error) {
        console.error('加载公交数据时出错:', error);
        return false;
    }
}

// 全局函数，供HTML中的脚本调用
async function initStats() {
    // 显示加载指示器
    showLoadingIndicator(true);
    
    // 加载数据
    const loaded = await loadBusData();
    if (!loaded) {
        showLoadingIndicator(false);
        return;
    }
    
    // 检查数据是否已加载
    if (typeof busRoutes !== 'undefined') {
        // 设置默认排序状态
        setDefaultSortStates();
        initializeStats();
        // 添加排序按钮事件监听器
        addSortToggleListeners();
    } else {
        console.error('公交数据未正确加载');
        showLoadingIndicator(false);
    }
}

function setDefaultSortStates() {
    const rankingLists = [
        'line-length-rank',
        'station-lines-rank', 
        'operator-lines-rank',
        'parallel-stations-rank',
        'segment-lines-rank',
        'operation-time-rank',
        'connectivity-rank' // 添加连接度排行的排序状态
    ];
    
    rankingLists.forEach(list => {
        sortStates[list] = 'desc'; // 默认降序
    });
}

function addSortToggleListeners() {
    const sortButtons = document.querySelectorAll('.sort-toggle');
    sortButtons.forEach(button => {
        const target = button.getAttribute('data-target');
        button.addEventListener('click', () => {
            toggleSortOrder(target);
        });
    });
}

function toggleSortOrder(target) {
    // 切换排序状态
    sortStates[target] = sortStates[target] === 'desc' ? 'asc' : 'desc';
    
    // 更新按钮文本
    const button = document.querySelector(`.sort-toggle[data-target="${target}"]`);
    button.textContent = sortStates[target] === 'desc' ? '↓ 降序' : '↑ 升序';
    
    // 重新显示统计数据
    const stats = calculateStats();
    displayStats(stats);
}

function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const content = document.getElementById('content');
    
    if (loadingIndicator && content) {
        if (show) {
            loadingIndicator.style.display = 'flex';
            content.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            content.style.display = 'flex';
        }
    }
}

function initializeStats() {
    try {
        // 统计数据
        const stats = calculateStats();
        
        // 显示统计数据
        displayStats(stats);
        
        // 隐藏加载指示器，显示内容
        showLoadingIndicator(false);
    } catch (error) {
        console.error('统计过程中发生错误:', error);
        showLoadingIndicator(false);
    }
}

function calculateStats() {
    const stats = {
        lineCount: 0,
        stationCount: 0,
        operatorCount: 0,
        linesByLength: [],
        stationsByLines: new Map(),
        operatorsByLines: new Map(),
        parallelStations: [], // 共线站统计（修改为数组）
        segmentLines: [], // 区间线路统计（修改为数组）
        operationTime: new Map(), // 运营时长统计
        connectivity: [] // 添加连接度统计
    };

    // 线路数量
    stats.lineCount = Object.keys(busRoutes).length;

    // 统计站点和运营公司
    const operators = new Set();
    
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        // 统计运营公司
        if (routeData.operator && routeData.operator !== "-") {
            routeData.operator.forEach(operator => {
                operators.add(operator);
            });
        }
        
        // 线路长度排行（去除单向线路的重复计算）
        const stations = routeData.stations.filter(station => 
            !station.oneWay || station.oneWay === "up");
        stats.linesByLength.push({
            name: routeData.name,
            id: routeId,
            length: stations.length
        });

        // 统计每个站点出现的线路数
        routeData.stations.forEach(station => {
            const stationKey = station.name;
            if (stats.stationsByLines.has(stationKey)) {
                stats.stationsByLines.set(stationKey, stats.stationsByLines.get(stationKey) + 1);
            } else {
                stats.stationsByLines.set(stationKey, 1);
            }
        });
        
        // 这段代码已废弃，因为我们重新实现了segmentLines的计算逻辑
        // 统计区间线路
        // if (routeId.includes("A") || routeId.includes("B") || routeId.includes("C")) {
        //     // 获取主线路名（去除A/B/C后缀）
        //     const mainRouteId = routeId.replace(/[ABC]/, "");
        //     const count = stats.segmentLines.get(mainRouteId) || 0;
        //     stats.segmentLines.set(mainRouteId, count + 1);
        // }
    }

    // 运营公司数量
    stats.operatorCount = operators.size;

    // 统计每个运营公司的线路数
    for (const routeData of Object.values(busRoutes)) {
        if (routeData.operator && routeData.operator !== "-") {
            routeData.operator.forEach(operator => {
                const count = stats.operatorsByLines.get(operator) || 0;
                stats.operatorsByLines.set(operator, count + 1);
            });
        }
    }

    // 统计不重复的站点数量
    stats.stationCount = stats.stationsByLines.size;

    // 线路长度排行（按站点数排序）
    stats.linesByLength.sort((a, b) => b.length - a.length);
    
    // 新的共线站数排行计算逻辑
    // 首先构建一个映射，记录每个站点出现在哪些线路上
    const stationToRoutes = new Map();
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        for (const station of routeData.stations) {
            const stationName = station.name;
            if (!stationToRoutes.has(stationName)) {
                stationToRoutes.set(stationName, new Set());
            }
            stationToRoutes.get(stationName).add(routeId);
        }
    }
    
    // 然后计算每对线路之间的共线站点数
    const routePairs = new Map(); // 用于存储线路对及其共线站点
    const routeIds = Object.keys(busRoutes);
    
    for (let i = 0; i < routeIds.length; i++) {
        for (let j = i + 1; j < routeIds.length; j++) {
            const routeId1 = routeIds[i];
            const routeId2 = routeIds[j];
            
            // 获取两条线路的站点集合
            const stations1 = new Set(busRoutes[routeId1].stations.map(s => s.name));
            const stations2 = new Set(busRoutes[routeId2].stations.map(s => s.name));
            
            // 计算共线站点
            const commonStations = [...stations1].filter(station => stations2.has(station));
            
            if (commonStations.length > 0) {
                // 创建线路对的唯一标识符（按字母顺序排列保证一致性）
                const routePairKey = [routeId1, routeId2].sort().join('-');
                routePairs.set(routePairKey, {
                    route1: busRoutes[routeId1].name,
                    route2: busRoutes[routeId2].name,
                    commonStations: commonStations,
                    count: commonStations.length
                });
            }
        }
    }
    
    // 将结果转换为数组并按共线站点数排序
    const sortedParallelStations = [...routePairs.values()]
        .sort((a, b) => b.count - a.count);
    
    // 获取前10名，但包括并列情况
    stats.parallelStations = getTopWithTies(sortedParallelStations, item => item.count, 10);
    
    // 新的区间线路数排行计算逻辑
    // 首先构建相邻站点对及其线路映射
    const segmentToRoutes = new Map();
    
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        const stations = routeData.stations;
        // 遍历相邻站点对
        for (let i = 0; i < stations.length - 1; i++) {
            const station1 = stations[i].name;
            const station2 = stations[i + 1].name;
            
            // 创建站点对的唯一标识符（按字母顺序排列保证一致性）
            const segmentKey = [station1, station2].sort().join(' - ');
            
            if (!segmentToRoutes.has(segmentKey)) {
                segmentToRoutes.set(segmentKey, {
                    station1: station1,
                    station2: station2,
                    routes: []
                });
            }
            
            segmentToRoutes.get(segmentKey).routes.push(routeData.name);
        }
    }
    
    // 将结果转换为数组并按线路数排序
    const sortedSegmentLines = [...segmentToRoutes.values()]
        .filter(segment => segment.routes.length > 1) // 只考虑至少有2条线路的区间
        .sort((a, b) => b.routes.length - a.routes.length);
    
    // 获取前10名，但包括并列情况
    stats.segmentLines = getTopWithTies(sortedSegmentLines, item => item.routes.length, 10);
    
    // 统计运营时长（排除24小时运营线路）
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.firstLastBus && routeData.firstLastBus.first && routeData.firstLastBus.last) {
            const firstTime = routeData.firstLastBus.first;
            const lastTime = routeData.firstLastBus.last;
            
            // 解析时间字符串
            const [firstHour, firstMinute] = firstTime.split(':').map(Number);
            const [lastHour, lastMinute] = lastTime.split(':').map(Number);
            
            // 计算运营时长（分钟）
            let duration = (lastHour * 60 + lastMinute) - (firstHour * 60 + firstMinute);
            
            // 处理跨天情况
            if (duration < 0) {
                duration += 24 * 60;
            }
            
            // 排除24小时运营线路（运营时长超过23小时）
            if (duration < 23 * 60) {
                stats.operationTime.set(routeId, {
                    name: routeData.name,
                    duration: duration,
                    first: firstTime,
                    last: lastTime
                });
            }
        }
    }

    // 计算线路平均连接度（包含所有线路，包括24小时运营线路）
    // 首先计算每个站点的连接度（连接的线路数）
    const stationConnectivity = new Map();
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        for (const station of routeData.stations) {
            const stationName = station.name;
            if (!stationConnectivity.has(stationName)) {
                stationConnectivity.set(stationName, 0);
            }
            stationConnectivity.set(stationName, stationConnectivity.get(stationName) + 1);
        }
    }

    // 然后计算每条线路的平均连接度
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        let totalConnectivity = 0;
        const stationCount = routeData.stations.length;
        
        for (const station of routeData.stations) {
            totalConnectivity += stationConnectivity.get(station.name);
        }
        
        const averageConnectivity = stationCount > 0 ? totalConnectivity / stationCount : 0;
        
        stats.connectivity.push({
            name: routeData.name,
            id: routeId,
            average: averageConnectivity
        });
    }

    // 对连接度进行排序
    stats.connectivity.sort((a, b) => b.average - a.average);

    return stats;
}

// 添加一个函数来处理并列排名
function getRankWithTies(sortedData, valueGetter) {
    const rankedData = [];
    let currentRank = 1;
    let previousValue = null;
    
    sortedData.forEach((item, index) => {
        const currentValue = valueGetter(item);
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = index + 1;
        }
        
        rankedData.push({
            ...item,
            rank: currentRank
        });
        
        previousValue = currentValue;
    });
    
    return rankedData;
}

// 添加一个函数来获取前N名，包括并列情况
function getTopWithTies(sortedData, valueGetter, topCount) {
    if (sortedData.length <= topCount) {
        return sortedData;
    }
    
    // 获取第topCount名的值
    const topValue = valueGetter(sortedData[topCount - 1]);
    
    // 包括所有与第topCount名相同值的项目
    const result = [];
    for (const item of sortedData) {
        if (valueGetter(item) >= topValue) {
            result.push(item);
        } else {
            break;
        }
    }
    
    return result;
}

// 将分钟数转换为小时和分钟的格式
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}小时${mins}分钟`;
    } else {
        return `${mins}分钟`;
    }
}

function displayStats(stats) {
    try {
        // 显示基本统计数据
        const lineCountEl = document.querySelector('.line-count');
        const stationCountEl = document.querySelector('.station-count');
        const operatorCountEl = document.querySelector('.operator-count');
        const connectivityCountEl = document.querySelector('.connectivity-count'); // 添加连接度统计元素
        
        if (lineCountEl) animateNumber(lineCountEl, stats.lineCount);
        if (stationCountEl) animateNumber(stationCountEl, stats.stationCount);
        if (operatorCountEl) animateNumber(operatorCountEl, stats.operatorCount);
        // 计算并显示线网平均连接度
        if (connectivityCountEl && stats.connectivity.length > 0) {
            const totalConnectivity = stats.connectivity.reduce((sum, route) => sum + route.average, 0);
            const averageNetworkConnectivity = totalConnectivity / stats.connectivity.length;
            animateNumber(connectivityCountEl, Math.round(averageNetworkConnectivity * 100) / 100);
        }

        // 显示线路长度排行（直到包含所有奖牌获得者或达到最小数量）
        const lineLengthRankEl = document.querySelector('.line-length-rank');
        if (lineLengthRankEl) {
            lineLengthRankEl.innerHTML = '';
            // 获取所有线路并排序
            const allLinesByLength = [...stats.linesByLength];
            
            // 根据排序状态调整顺序
            let rankedLines;
            if (sortStates['line-length-rank'] === 'asc') {
                allLinesByLength.sort((a, b) => a.length - b.length);
                // 升序时从后往前排
                rankedLines = getRankWithTiesReverseUntilAllMedals(allLinesByLength, item => item.length);
            } else {
                allLinesByLength.sort((a, b) => b.length - a.length);
                // 降序时正常排名
                rankedLines = getRankWithTiesUntilAllMedals(allLinesByLength, item => item.length);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['line-length-rank'] === 'desc' ? getMedalMap(rankedLines) : new Map();
            
            rankedLines.forEach((line) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(line.rank)) {
                    medalClass = medalMap.get(line.rank);
                }

                //查找对应线路所有站名
                const routeData = busRoutes[line.id];
                const stationNames = routeData ? routeData.stations.map(station => station.name).join(' / ') : '';
                
                // 创建一个容器来保存详细信息
                const detailId = `line-detail-${line.id}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${line.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${line.name}</div>
                        <div class="rank-value">${line.length} 站</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${stationNames}</div>
                `;
                lineLengthRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                // 确保元素已添加到DOM后再获取
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }

        // 显示站点接驳线路数排行（直到包含所有奖牌获得者或达到最小数量）
        const stationLinesRankEl = document.querySelector('.station-lines-rank');
        if (stationLinesRankEl) {
            stationLinesRankEl.innerHTML = '';
            let allStations = [...stats.stationsByLines.entries()];
            
            // 根据排序状态调整顺序
            let rankedStations;
            if (sortStates['station-lines-rank'] === 'asc') {
                allStations.sort((a, b) => a[1] - b[1]);
                // 升序时从后往前排
                rankedStations = getRankWithTiesReverseUntilAllMedals(allStations, item => item[1]);
            } else {
                allStations.sort((a, b) => b[1] - a[1]);
                // 降序时正常排名
                rankedStations = getRankWithTiesUntilAllMedals(allStations, item => item[1]);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['station-lines-rank'] === 'desc' ? getMedalMap(rankedStations) : new Map();
            
            rankedStations.forEach((stationEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(stationEntry.rank)) {
                    medalClass = medalMap.get(stationEntry.rank);
                }
                
                // 查找该站点的所有线路ID，并用斜线连接
                const linesAtStation = [];
                for (const [routeId, routeData] of Object.entries(busRoutes)) {
                    if (routeData.stations.some(station => station.name === stationEntry[0])) {
                        linesAtStation.push(routeData.name);
                    }
                }
                const linesInfo = linesAtStation.join(' / ');
                
                // 创建一个容器来保存详细信息
                const detailId = `station-detail-${encodeURIComponent(stationEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${stationEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${stationEntry[0]}</div>
                        <div class="rank-value">${stationEntry[1]} 条线路</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${linesInfo}</div>
                `;
                stationLinesRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                // 确保元素已添加到DOM后再获取
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }

        // 显示运营公司线路数排行（直到包含所有奖牌获得者或达到最小数量）
        const operatorLinesRankEl = document.querySelector('.operator-lines-rank');
        if (operatorLinesRankEl) {
            operatorLinesRankEl.innerHTML = '';
            let allOperators = [...stats.operatorsByLines.entries()];
            
            // 根据排序状态调整顺序
            let rankedOperators;
            if (sortStates['operator-lines-rank'] === 'asc') {
                allOperators.sort((a, b) => a[1] - b[1]);
                // 升序时从后往前排
                rankedOperators = getRankWithTiesReverseUntilAllMedals(allOperators, item => item[1]);
            } else {
                allOperators.sort((a, b) => b[1] - a[1]);
                // 降序时正常排名
                rankedOperators = getRankWithTiesUntilAllMedals(allOperators, item => item[1]);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['operator-lines-rank'] === 'desc' ? getMedalMap(rankedOperators) : new Map();
            
            rankedOperators.forEach((operatorEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(operatorEntry.rank)) {
                    medalClass = medalMap.get(operatorEntry.rank);
                }

                // 查找该运营公司的所有线路ID，并用斜线连接
                const linesByOperator = [];
                for (const [routeId, routeData] of Object.entries(busRoutes)) {
                    if (routeData.operator.includes(operatorEntry[0])) {
                        linesByOperator.push(routeData.name);
                    }
                }
                const linesInfo = linesByOperator.join(' / ');
                
                // 创建一个容器来保存详细信息
                const detailId = `operator-detail-${encodeURIComponent(operatorEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${operatorEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${operatorEntry[0]}</div>
                        <div class="rank-value">${operatorEntry[1]} 条线路</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${linesInfo}</div>
                `;
                operatorLinesRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                // 确保元素已添加到DOM后再获取
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }
        
        // 显示共线站数排行（直到包含所有奖牌获得者或达到最小数量）
        const parallelStationsRankEl = document.querySelector('.parallel-stations-rank');
        if (parallelStationsRankEl) {
            parallelStationsRankEl.innerHTML = '';
            let rankedParallelStations = [...stats.parallelStations];
            
            // 根据排序状态调整顺序
            if (sortStates['parallel-stations-rank'] === 'asc') {
                rankedParallelStations.sort((a, b) => a.count - b.count);
                // 升序时从后往前排
                rankedParallelStations = getRankWithTiesReverseUntilAllMedals(rankedParallelStations, item => item.count);
            } else {
                rankedParallelStations.sort((a, b) => b.count - a.count);
                // 降序时正常排名
                rankedParallelStations = getRankWithTiesUntilAllMedals(rankedParallelStations, item => item.count);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['parallel-stations-rank'] === 'desc' ? getMedalMap(rankedParallelStations) : new Map();
            
            rankedParallelStations.forEach((entry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(entry.rank)) {
                    medalClass = medalMap.get(entry.rank);
                }
                
                // 创建一个容器来保存详细信息
                const detailId = `parallel-station-detail-${encodeURIComponent(entry.route1)}-${encodeURIComponent(entry.route2)}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${entry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${entry.route1} / ${entry.route2}</div>
                        <div class="rank-value">${entry.count} 个共线站</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${entry.commonStations.join(' / ')}</div>
                `;
                parallelStationsRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }
        
        // 显示区间线路数排行（直到包含所有奖牌获得者或达到最小数量）
        const segmentLinesRankEl = document.querySelector('.segment-lines-rank');
        if (segmentLinesRankEl) {
            segmentLinesRankEl.innerHTML = '';
            let rankedSegmentLines = [...stats.segmentLines];
            
            // 根据排序状态调整顺序
            if (sortStates['segment-lines-rank'] === 'asc') {
                rankedSegmentLines.sort((a, b) => a.routes.length - b.routes.length);
                // 升序时从后往前排
                rankedSegmentLines = getRankWithTiesReverseUntilAllMedals(rankedSegmentLines, item => item.routes.length);
            } else {
                rankedSegmentLines.sort((a, b) => b.routes.length - a.routes.length);
                // 降序时正常排名
                rankedSegmentLines = getRankWithTiesUntilAllMedals(rankedSegmentLines, item => item.routes.length);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['segment-lines-rank'] === 'desc' ? getMedalMap(rankedSegmentLines) : new Map();
            
            rankedSegmentLines.forEach((segmentEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(segmentEntry.rank)) {
                    medalClass = medalMap.get(segmentEntry.rank);
                }
                
                const routesInfo = segmentEntry.routes.join(' / ');
                
                // 创建一个容器来保存详细信息
                const detailId = `segment-detail-${encodeURIComponent(segmentEntry.station1)}-${encodeURIComponent(segmentEntry.station2)}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${segmentEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${segmentEntry.station1} - ${segmentEntry.station2}</div>
                        <div class="rank-value">${segmentEntry.routes.length} 条线路</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${routesInfo}</div>
                `;
                segmentLinesRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }
        
        // 显示营业时长排行（直到包含所有奖牌获得者或达到最小数量）
        const operationTimeRankEl = document.querySelector('.operation-time-rank');
        if (operationTimeRankEl) {
            operationTimeRankEl.innerHTML = '';
            let allOperationTime = [...stats.operationTime.entries()];
            
            // 根据排序状态调整顺序
            let rankedOperationTime;
            if (sortStates['operation-time-rank'] === 'asc') {
                allOperationTime.sort((a, b) => a[1].duration - b[1].duration);
                // 升序时从后往前排
                rankedOperationTime = getRankWithTiesReverseUntilAllMedals(allOperationTime, item => item[1].duration);
            } else {
                allOperationTime.sort((a, b) => b[1].duration - a[1].duration);
                // 降序时正常排名
                rankedOperationTime = getRankWithTiesUntilAllMedals(allOperationTime, item => item[1].duration);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['operation-time-rank'] === 'desc' ? getMedalMap(rankedOperationTime) : new Map();
            
            rankedOperationTime.forEach((operationEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(operationEntry.rank)) {
                    medalClass = medalMap.get(operationEntry.rank);
                }
                
                const routeInfo = operationEntry[1];
                const durationText = formatDuration(routeInfo.duration);
                
                // 创建一个容器来保存详细信息
                const detailId = `operation-detail-${encodeURIComponent(operationEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${operationEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${routeInfo.name}</div>
                        <div class="rank-value">${durationText}</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">首班 ${routeInfo.first} 末班 ${routeInfo.last}</div>
                `;
                operationTimeRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }
        
        // 显示线路平均连接度排行
        const connectivityRankEl = document.querySelector('.connectivity-rank');
        if (connectivityRankEl) {
            connectivityRankEl.innerHTML = '';
            let rankedConnectivity = [...stats.connectivity];
            
            // 根据排序状态调整顺序
            if (sortStates['connectivity-rank'] === 'asc') {
                rankedConnectivity.sort((a, b) => a.average - b.average);
                // 升序时从后往前排
                rankedConnectivity = getRankWithTiesReverseUntilAllMedals(rankedConnectivity, item => item.average);
            } else {
                rankedConnectivity.sort((a, b) => b.average - a.average);
                // 降序时正常排名
                rankedConnectivity = getRankWithTiesUntilAllMedals(rankedConnectivity, item => item.average);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['connectivity-rank'] === 'desc' ? getMedalMap(rankedConnectivity) : new Map();
            
            rankedConnectivity.forEach((connectivityEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(connectivityEntry.rank)) {
                    medalClass = medalMap.get(connectivityEntry.rank);
                }
                
                // 创建一个容器来保存详细信息
                const detailId = `connectivity-detail-${encodeURIComponent(connectivityEntry.id)}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${connectivityEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${connectivityEntry.name}</div>
                        <div class="rank-value">${Math.round(connectivityEntry.average * 100) / 100} 连接度</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">线路平均连接度</div>
                `;
                connectivityRankEl.appendChild(rankItem);
                
                // 为排行榜项添加鼠标事件
                setTimeout(() => {
                    const detailElement = document.getElementById(detailId);
                    if (detailElement) {
                        rankItem.addEventListener('mouseenter', () => {
                            detailElement.classList.add('show');
                        });
                        
                        rankItem.addEventListener('mouseleave', () => {
                            detailElement.classList.remove('show');
                        });
                    }
                }, 0);
            });
        }

    } catch (error) {
        console.error('显示统计数据时发生错误:', error);
    }
}

// 添加一个函数来确定奖牌分配
function getMedalMap(rankedData) {
    const medalMap = new Map();
    let currentRank = null;
    let rankCount = 0;
    
    for (const item of rankedData) {
        if (item.rank !== currentRank) {
            currentRank = item.rank;
            rankCount++;
        }
        
        // 只给前三个不同的排名分配奖牌
        if (rankCount === 1) {
            medalMap.set(item.rank, 'gold-medal');
        } else if (rankCount === 2) {
            medalMap.set(item.rank, 'silver-medal');
        } else if (rankCount === 3) {
            medalMap.set(item.rank, 'bronze-medal');
        } else if (rankCount === 4) {
            medalMap.set(item.rank, 'fourth-medal');
        } else {
            break;
        }
    }
    
    return medalMap;
}

// 添加一个函数来处理并列排名直到包含所有奖牌获得者
function getRankWithTiesUntilAllMedals(sortedData, valueGetter, minCount = 10) {
    if (sortedData.length === 0) {
        return [];
    }
    
    const rankedData = [];
    let currentRank = 1;
    let previousValue = null;
    let rankCount = 0; // 不同排名的数量
    
    for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        const currentValue = valueGetter(item);
        
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = rankedData.length + 1;
            rankCount++;
        }
        
        // 添加当前项目
        rankedData.push({
            ...item,
            rank: currentRank
        });
        
        previousValue = currentValue;
        
        // 如果已经找到前4个不同的排名且达到最小数量，则停止添加更多项目
        if (rankCount >= 4 && rankedData.length >= minCount) {
            break;
        }
    }
    
    // 如果数据不够4个不同的排名，但达到了最小数量，也返回结果
    if (rankedData.length >= minCount) {
        return rankedData;
    }
    
    // 如果数据不足最小数量，返回所有数据
    return rankedData;
}

// 添加一个函数来处理升序时的排名（从后往前排）
function getRankWithTiesReverse(sortedData, valueGetter) {
    if (sortedData.length === 0) {
        return [];
    }
    
    // 先按正常方式计算排名（处理并列情况）
    const normalRanked = [];
    let currentRank = 1;
    let previousValue = null;
    
    for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        const currentValue = valueGetter(item);
        
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = i + 1;
        }
        
        normalRanked.push({
            ...item,
            rank: currentRank
        });
        
        previousValue = currentValue;
    }
    
    // 获取最大排名值
    const maxRank = sortedData.length;
    
    // 反转排名数字，但保持并列组内的一致性
    // 我们需要确保并列项获得相同的排名，并且并列时取较小的数值
    const reversedRanked = [];
    for (let i = 0; i < normalRanked.length; i++) {
        const item = normalRanked[i];
        // 计算反转后的排名
        const reversedRank = maxRank - item.rank + 1;
        reversedRanked.push({
            ...item,
            rank: reversedRank
        });
    }
    
    return reversedRanked;
}

// 添加一个函数来处理升序排列时获取前N名，包括并列情况
function getRankWithTiesReverseUntilAllMedals(sortedData, valueGetter, minCount = 10) {
    if (sortedData.length === 0) {
        return [];
    }
    
    // 先按正常方式计算排名（处理并列情况）
    const normalRanked = [];
    let currentRank = 1;
    let previousValue = null;
    let rankCount = 0; // 不同排名的数量
    
    for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        const currentValue = valueGetter(item);
        
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = normalRanked.length + 1;
            rankCount++;
        }
        
        // 添加当前项目
        normalRanked.push({
            ...item,
            rank: currentRank
        });
        
        previousValue = currentValue;
        
        // 如果已经找到前4个不同的排名且达到最小数量，则停止添加更多项目
        if (rankCount >= 4 && normalRanked.length >= minCount) {
            break;
        }
    }
    
    // 获取最大排名值
    const maxRank = sortedData.length;
    
    // 反转排名数字，但保持并列组内的一致性
    const reversedRanked = [];
    for (let i = 0; i < normalRanked.length; i++) {
        const item = normalRanked[i];
        // 计算反转后的排名
        const reversedRank = maxRank - item.rank + 1;
        reversedRanked.push({
            ...item,
            rank: reversedRank
        });
    }
    
    return reversedRanked;
}

// 添加一个函数来处理并列排名直到包含铜牌获得者
function getRankWithTiesUntilBronze(sortedData, valueGetter) {
    if (sortedData.length === 0) {
        return [];
    }
    
    const rankedData = [];
    let currentRank = 1;
    let previousValue = null;
    let rankCount = 0; // 不同排名的数量
    
    for (const item of sortedData) {
        const currentValue = valueGetter(item);
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = rankedData.length + 1;
            rankCount++;
        }
        
        // 如果已经找到前3个不同的排名，则停止添加更多项目
        if (rankCount === 1) {
            medalMap.set(item.rank, 'gold-medal');
        } else if (rankCount === 2) {
            medalMap.set(item.rank, 'silver-medal');
        } else if (rankCount === 3) {
            medalMap.set(item.rank, 'bronze-medal');
        } else if (rankCount === 4) {
            medalMap.set(item.rank, 'fourth-medal');
        } else {
            break;
        }
        
        rankedData.push({
            ...item,
            rank: currentRank
        });
        
        previousValue = currentValue;
    }
    
    return rankedData;
}

// 添加一个函数来处理并列排名直到包含殿军或达到最小数量
function getRankWithTiesUntilFourthOrMin(sortedData, valueGetter, minCount = 10) {
    if (sortedData.length === 0) {
        return [];
    }
    
    const rankedData = [];
    let currentRank = 1;
    let previousValue = null;
    let rankCount = 0; // 不同排名的数量
    
    for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        const currentValue = valueGetter(item);
        
        if (previousValue !== null && currentValue !== previousValue) {
            currentRank = rankedData.length + 1;
            rankCount++;
        }
        
        // 添加当前项目
        rankedData.push({
            ...item,
            rank: currentRank
        });
        
        // 更新previousValue
        previousValue = currentValue;
        
        // 如果已经找到前4个不同的排名且达到最小数量，则停止添加更多项目
        if (rankCount >= 4 && rankedData.length >= minCount) {
            break;
        }
        
        // 如果达到最小数量但还没找到4个不同的排名，继续查找
        if (rankedData.length >= minCount && rankCount < 4) {
            // 继续直到找到第4个排名或数据结束
            if (i === sortedData.length - 1) {
                // 数据已结束但仍没找到4个排名，停止
                break;
            }
        }
    }
    
    return rankedData;
}

// 添加数字跳动动画函数
function animateNumber(element, finalValue) {
    // 检查元素是否在视口中
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 元素第一次可见时执行动画
                performAnimation(element, finalValue);
                // 动画执行一次后停止观察
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.1 // 元素10%可见时触发
    });
    
    observer.observe(element);
}

// 执行数字跳动动画
function performAnimation(element, finalValue) {
    let currentValue = 0;
    const duration = 3000; // 动画持续时间（毫秒）
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓出函数 - 典型的 easeOutCubic: 1 - (1 - t)^3
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        currentValue = finalValue * easedProgress;
        
        // 检查元素是否为连接度计数元素
        if (element.classList.contains('connectivity-count')) {
            // 对于连接度，保留一位小数
            element.textContent = currentValue.toFixed(1);
        } else {
            // 对于整数计数，使用原始逻辑
            element.textContent = Math.round(currentValue);
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStats);
} else {
    // DOM已经加载完成
    initStats();
}