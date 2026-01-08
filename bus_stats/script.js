// 在模块顶部添加数据加载逻辑
let busRoutes;
let sortStates = {}; // 存储每个排行榜的排序状态
let operatorFilters = {}; // 存储每个排行榜的公司筛选状态
let fullNetworkStats = null; // 存储完整网络的统计数据

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
        // 初始化统计数据
        initializeStats();
        // 添加排序按钮事件监听器
        addSortToggleListeners();
        // 添加运营公司排行榜类型切换监听器
        addOperatorRankingTypeListener();
        // 触发一次默认选项的显示
        triggerDefaultOperatorRanking();
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
        'connectivity-rank',
        'operator-stations-rank',
        'operator-connectivity-rank',
        'hub-contribution-rank', // 线路枢纽贡献度排行
        'operator-hub-contribution-rank' // 运营公司枢纽贡献度排行
    ];
    
    rankingLists.forEach(list => {
        sortStates[list] = 'desc'; // 默认降序
        operatorFilters[list] = 'all'; // 默认显示所有公司
    });
}

function addSortToggleListeners() {
    const sortButtons = document.querySelectorAll('.sort-toggle');
    sortButtons.forEach(button => {
        const target = button.getAttribute('data-target');
        // 排除运营公司排行榜的排序按钮
        if (target !== 'operator-lines-rank' && 
            target !== 'operator-stations-rank' && 
            target !== 'operator-connectivity-rank' &&
            target !== 'operator-hub-contribution-rank') {
            button.addEventListener('click', () => {
                toggleSortOrder(target);
            });
        }
    });
    
    // 添加公司筛选器事件监听器
    const filterSelectors = document.querySelectorAll('.operator-filter');
    filterSelectors.forEach(selector => {
        const target = selector.getAttribute('data-target');
        selector.addEventListener('change', () => {
            const selectedOperator = selector.value;
            operatorFilters[target] = selectedOperator;
            const stats = calculateStats();
            displayStats(stats);
        });
    });
}

function addOperatorRankingTypeListener() {
    const selector = document.getElementById('operator-ranking-type');
    if (selector) {
        selector.addEventListener('change', (event) => {
            const selectedType = event.target.value;
            switchOperatorRankingDisplay(selectedType);
        });
    }
}

// 新增函数：触发默认选项的显示
function triggerDefaultOperatorRanking() {
    const selector = document.getElementById('operator-ranking-type');
    if (selector) {
        // 触发默认选项的change事件
        const defaultType = selector.value;
        switchOperatorRankingDisplay(defaultType);
    }
}

function switchOperatorRankingDisplay(type) {
    // 隐藏所有内容
    const contents = document.querySelectorAll('.operator-ranking-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
    
    // 显示选中的内容
    let selectedContent;
    switch(type) {
        case 'lines':
            selectedContent = document.getElementById('operator-lines-rank');
            break;
        case 'stations':
            selectedContent = document.getElementById('operator-stations-rank');
            break;
        case 'connectivity':
            selectedContent = document.getElementById('operator-connectivity-rank');
            break;
        case 'hub-contribution':
            selectedContent = document.getElementById('operator-hub-contribution-rank');
            break;
        default:
            selectedContent = document.getElementById('operator-lines-rank');
    }
    
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
}

function toggleSortOrder(target) {
    // 切换排序状态
    sortStates[target] = sortStates[target] === 'desc' ? 'asc' : 'desc';
    
    // 更新按钮文本
    const button = document.querySelector(`.sort-toggle[data-target="${target}"]`);
    if (button) {
        button.textContent = sortStates[target] === 'desc' ? '↓ 降序' : '↑ 升序';
    }
    
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
        // 首先计算完整网络统计数据
        fullNetworkStats = calculateFullNetworkStats();
        
        // 然后计算显示统计数据
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
        connectivity: [], // 添加连接度统计
        operatorsByStations: new Map(), // 运营公司按站点数统计
        operatorsByConnectivity: new Map(), // 运营公司按连接度统计
        // 添加枢纽贡献度相关统计
        hubContribution: [], // 线路枢纽贡献度排行
        operatorsByHubContribution: new Map() // 运营公司枢纽贡献度排行
    };

    // 获取所有运营公司
    const allOperators = new Set();
    
    // 收集所有运营公司（不进行筛选）
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.operator && routeData.operator !== "-") {
            routeData.operator.forEach(op => allOperators.add(op));
        }
    }
    
    // 更新运营公司下拉菜单选项
    updateOperatorFilterOptions(allOperators);
    
    // 为每个排行榜分别计算数据
    // 线路长度排行（根据line-length-rank筛选器过滤）
    const lineLengthFilteredRoutes = {};
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (operatorFilters['line-length-rank'] === 'all' || 
            (routeData.operator && routeData.operator.includes(operatorFilters['line-length-rank']))) {
            lineLengthFilteredRoutes[routeId] = routeData;
        }
    }
    
    // 计算线路长度排行数据
    for (const [routeId, routeData] of Object.entries(lineLengthFilteredRoutes)) {
        const stations = routeData.stations;
        stats.linesByLength.push({
            name: routeData.name,
            id: routeId,
            length: stations.length,
            operator: routeData.operator || []
        });
    }
    
    // 站点接驳线路数排行（根据station-lines-rank筛选器过滤）
    const stationLinesFilteredRoutes = {};
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (operatorFilters['station-lines-rank'] === 'all' || 
            (routeData.operator && routeData.operator.includes(operatorFilters['station-lines-rank']))) {
            stationLinesFilteredRoutes[routeId] = routeData;
        }
    }
    
    // 计算站点接驳线路数排行数据
    for (const [routeId, routeData] of Object.entries(stationLinesFilteredRoutes)) {
        routeData.stations.forEach(station => {
            const stationKey = station.name;
            if (stats.stationsByLines.has(stationKey)) {
                stats.stationsByLines.set(stationKey, stats.stationsByLines.get(stationKey) + 1);
            } else {
                stats.stationsByLines.set(stationKey, 1);
            }
        });
    }
    
    // 运营公司线路数排行（不筛选）
    const operators = new Set();
    const operatorRoutes = new Map();
    const operatorStations = new Map();
    
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.operator && routeData.operator !== "-") {
            routeData.operator.forEach(operator => {
                operators.add(operator);
                
                if (!operatorRoutes.has(operator)) {
                    operatorRoutes.set(operator, new Set());
                }
                operatorRoutes.get(operator).add(routeId);
                
                if (!operatorStations.has(operator)) {
                    operatorStations.set(operator, new Set());
                }
                routeData.stations.forEach(station => {
                    operatorStations.get(operator).add(station.name);
                });
            });
        }
    }
    
    stats.operatorCount = operators.size;
    
    for (const [operator, routes] of operatorRoutes.entries()) {
        stats.operatorsByLines.set(operator, routes.size);
    }
    
    for (const [operator, stations] of operatorStations.entries()) {
        stats.operatorsByStations.set(operator, stations.size);
    }
    
    // 计算每个运营公司的平均连接度
    for (const [operator, stations] of operatorStations.entries()) {
        let totalConnectivity = 0;
        for (const station of stations) {
            totalConnectivity += fullNetworkStats.stationConnectivity.get(station) || 0;
        }
        const averageConnectivity = stations.size > 0 ? totalConnectivity / stations.size : 0;
        stats.operatorsByConnectivity.set(operator, averageConnectivity);
    }

    // 线路数量（基于线路长度排行的筛选器）
    stats.lineCount = Object.keys(lineLengthFilteredRoutes).length;
    
    // 站点数量（基于站点接驳线路数排行的筛选器）
    stats.stationCount = stats.stationsByLines.size;

    // 线路长度排行排序
    stats.linesByLength.sort((a, b) => b.length - a.length);
    
    // 使用完整网络数据进行共线站数排行
    stats.parallelStations = fullNetworkStats.parallelStations;
    
    // 使用完整网络数据进行区间线路数排行
    stats.segmentLines = fullNetworkStats.segmentLines;
    
    // 运营时长排行（根据operation-time-rank筛选器过滤）
    if (operatorFilters['operation-time-rank'] === 'all') {
        stats.operationTime = fullNetworkStats.operationTime;
    } else {
        for (const [routeId, routeInfo] of fullNetworkStats.operationTime.entries()) {
            const routeData = busRoutes[routeId];
            if (routeData && routeData.operator && 
                routeData.operator.includes(operatorFilters['operation-time-rank'])) {
                stats.operationTime.set(routeId, routeInfo);
            }
        }
    }
    
    // 线路平均连接度排行（根据connectivity-rank筛选器过滤）
    if (operatorFilters['connectivity-rank'] === 'all') {
        stats.connectivity = fullNetworkStats.connectivity;
    } else {
        fullNetworkStats.connectivity.forEach(connectivityEntry => {
            const routeData = busRoutes[connectivityEntry.id];
            if (routeData && routeData.operator && 
                routeData.operator.includes(operatorFilters['connectivity-rank'])) {
                stats.connectivity.push(connectivityEntry);
            }
        });
    }
    
    // 线路枢纽贡献度排行（根据hub-contribution-rank筛选器过滤）
    if (operatorFilters['hub-contribution-rank'] === 'all') {
        // 使用完整网络数据
        for (const [routeId, contributionData] of fullNetworkStats.hubContribution.entries()) {
            stats.hubContribution.push({
                name: contributionData.name,
                id: routeId,
                contribution: contributionData.contribution,
                operator: contributionData.operator
            });
        }
    } else {
        // 根据筛选器过滤
        for (const [routeId, contributionData] of fullNetworkStats.hubContribution.entries()) {
            const routeData = busRoutes[routeId];
            if (routeData && routeData.operator && 
                routeData.operator.includes(operatorFilters['hub-contribution-rank'])) {
                stats.hubContribution.push({
                    name: contributionData.name,
                    id: routeId,
                    contribution: contributionData.contribution,
                    operator: contributionData.operator
                });
            }
        }
    }
    
    // 运营公司枢纽贡献度排行（不筛选）
    stats.operatorsByHubContribution = fullNetworkStats.operatorsByHubContribution;

    return stats;
}

// 计算完整网络统计数据
function calculateFullNetworkStats() {
    const stats = {
        lineCount: 0,
        stationCount: 0,
        operatorCount: 0,
        stationsByLines: new Map(),
        operationTime: new Map(),
        connectivity: [],
        stationConnectivity: new Map(), // 站点 -> 连接线路数
        parallelStations: [],
        segmentLines: [],
        // 添加枢纽贡献度相关数据
        hubContribution: new Map(), // 线路的枢纽贡献度
        operatorsByHubContribution: new Map() // 运营公司的枢纽贡献度
    };

    // 线路数量
    stats.lineCount = Object.keys(busRoutes).length;

    // 统计运营公司
    const operators = new Set();
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.operator && routeData.operator !== "-") {
            routeData.operator.forEach(op => operators.add(op));
        }
    }
    stats.operatorCount = operators.size;

    // 首先计算每个站点的连接度
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        for (const station of routeData.stations) {
            const stationName = station.name;
            if (!stats.stationConnectivity.has(stationName)) {
                stats.stationConnectivity.set(stationName, 0);
            }
            stats.stationConnectivity.set(stationName, stats.stationConnectivity.get(stationName) + 1);
        }
    }
    
    // 统计每个站点出现的线路数
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        routeData.stations.forEach(station => {
            const stationKey = station.name;
            if (stats.stationsByLines.has(stationKey)) {
                stats.stationsByLines.set(stationKey, stats.stationsByLines.get(stationKey) + 1);
            } else {
                stats.stationsByLines.set(stationKey, 1);
            }
        });
    }

    // 统计不重复的站点数量
    stats.stationCount = stats.stationsByLines.size;

    // 新的共线站数排行计算逻辑
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
    
    const routePairs = new Map();
    const routeIds = Object.keys(busRoutes);
    
    for (let i = 0; i < routeIds.length; i++) {
        for (let j = i + 1; j < routeIds.length; j++) {
            const routeId1 = routeIds[i];
            const routeId2 = routeIds[j];
            
            const stations1 = new Set(busRoutes[routeId1].stations.map(s => s.name));
            const stations2 = new Set(busRoutes[routeId2].stations.map(s => s.name));
            
            const commonStations = [...stations1].filter(station => stations2.has(station));
            
            if (commonStations.length > 0) {
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
    
    const sortedParallelStations = [...routePairs.values()]
        .sort((a, b) => b.count - a.count);
    
    stats.parallelStations = getTopWithTies(sortedParallelStations, item => item.count, 10);
    
    // 新的区间线路数排行计算逻辑
    const segmentToRoutes = new Map();
    
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        const stations = routeData.stations;
        for (let i = 0; i < stations.length - 1; i++) {
            const station1 = stations[i].name;
            const station2 = stations[i + 1].name;
            
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
    
    const sortedSegmentLines = [...segmentToRoutes.values()]
        .filter(segment => segment.routes.length > 1)
        .sort((a, b) => b.routes.length - a.routes.length);
    
    stats.segmentLines = getTopWithTies(sortedSegmentLines, item => item.routes.length, 10);
    
    // 统计运营时长（排除24小时运营线路）
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.firstLastBus && routeData.firstLastBus.first && routeData.firstLastBus.last) {
            const firstTime = routeData.firstLastBus.first;
            const lastTime = routeData.firstLastBus.last;
            
            const [firstHour, firstMinute] = firstTime.split(':').map(Number);
            const [lastHour, lastMinute] = lastTime.split(':').map(Number);
            
            let duration = (lastHour * 60 + lastMinute) - (firstHour * 60 + firstMinute);
            
            if (duration < 0) {
                duration += 24 * 60;
            }
            
            if (duration < 23 * 60) {
                stats.operationTime.set(routeId, {
                    name: routeData.name,
                    duration: duration,
                    first: firstTime,
                    last: lastTime,
                    operator: routeData.operator || []
                });
            }
        }
    }

    // 计算每条线路的平均连接度
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        let totalConnectivity = 0;
        const stationCount = routeData.stations.length;
        
        for (const station of routeData.stations) {
            totalConnectivity += stats.stationConnectivity.get(station.name);
        }
        
        const averageConnectivity = stationCount > 0 ? totalConnectivity / stationCount : 0;
        
        stats.connectivity.push({
            name: routeData.name,
            id: routeId,
            average: averageConnectivity,
            operator: routeData.operator || []
        });
    }

    stats.connectivity.sort((a, b) => b.average - a.average);
    
    // 计算枢纽贡献度（修正版本）
    // 首先计算全网连接度总和
    let totalNetworkConnectivity = 0;
    for (const [stationName, connectivity] of stats.stationConnectivity.entries()) {
        totalNetworkConnectivity += connectivity;
    }
    
    // 计算每条线路的枢纽贡献度
    // 每条线路经过的每个站点对枢纽贡献度的贡献是该站点的连接度/全网连接度总和
    // 一条线路的枢纽贡献度是它经过的所有站点的贡献之和
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        let routeHubContribution = 0;
        const stationSet = new Set(); // 用于去重，避免同一条线路多次经过同一站点时重复计算
        
        for (const station of routeData.stations) {
            if (!stationSet.has(station.name)) {
                stationSet.add(station.name);
                // 每个站点对枢纽贡献度的贡献 = 该站点连接度 / 全网连接度总和
                const stationContribution = totalNetworkConnectivity > 0 ? 
                    (stats.stationConnectivity.get(station.name) / totalNetworkConnectivity) : 0;
                routeHubContribution += stationContribution;
            }
        }
        
        const hubContributionPercentage = routeHubContribution * 100;
        stats.hubContribution.set(routeId, {
            name: routeData.name,
            contribution: hubContributionPercentage,
            operator: routeData.operator || []
        });
    }
    
    // 计算每个运营公司的枢纽贡献度
    // 正确的方法：该运营商涵盖到的每个车站的连接度总和比上线网所有车站连接度的总和
    const operatorStations = new Map(); // 记录每个运营商涵盖的站点
    
    // 先收集每个运营商涵盖的站点
    for (const [routeId, routeData] of Object.entries(busRoutes)) {
        if (routeData.operator && routeData.operator.length > 0) {
            for (const operator of routeData.operator) {
                if (!operatorStations.has(operator)) {
                    operatorStations.set(operator, new Set());
                }
                
                // 添加该线路的所有站点到运营商的站点集合中
                for (const station of routeData.stations) {
                    operatorStations.get(operator).add(station.name);
                }
            }
        }
    }
    
    // 计算每个运营商的枢纽贡献度
    const operatorContributions = new Map();
    for (const [operator, stations] of operatorStations.entries()) {
        // 计算该运营商涵盖的所有站点的连接度总和
        let operatorTotalConnectivity = 0;
        for (const stationName of stations) {
            operatorTotalConnectivity += stats.stationConnectivity.get(stationName) || 0;
        }
        
        // 计算枢纽贡献度百分比
        const hubContributionPercentage = totalNetworkConnectivity > 0 ? 
            (operatorTotalConnectivity / totalNetworkConnectivity) * 100 : 0;
            
        operatorContributions.set(operator, hubContributionPercentage);
    }
    
    // 将运营公司枢纽贡献度存入stats
    stats.operatorsByHubContribution = operatorContributions;

    return stats;
}

// 检查是否应该包含某个线路用于显示（根据筛选条件）
function shouldIncludeRouteForDisplay(routeData) {
    // 获取所有激活的筛选器目标（选择不是"所有公司"的筛选器）
    // 但我们只关注当前显示的排行榜相关的筛选器
    const activeFilters = Object.keys(operatorFilters).filter(key => operatorFilters[key] !== 'all');
    
    // 如果没有激活的筛选器，包含所有线路
    if (activeFilters.length === 0) {
        return true;
    }
    
    // 检查线路是否属于任何一个选中的运营公司
    if (routeData.operator && routeData.operator !== "-") {
        // 遍历所有激活的筛选器
        for (const filterTarget of activeFilters) {
            const selectedOperator = operatorFilters[filterTarget];
            // 如果线路属于当前筛选器选中的运营公司，则包含该线路
            if (routeData.operator.includes(selectedOperator)) {
                return true;
            }
        }
    }
    
    // 如果没有指定运营公司或不属于任何选中的运营公司，则不包含
    return false;
}

// 更新所有公司筛选器的选项
function updateOperatorFilterOptions(operators) {
    const filterSelectors = document.querySelectorAll('.operator-filter');
    filterSelectors.forEach(selector => {
        // 保存当前选中的值
        const currentValue = selector.value;
        
        // 创建文档片段用于批量操作
        const fragment = document.createDocumentFragment();
        
        // 添加公司选项
        [...operators].sort().forEach(operator => {
            const option = document.createElement('option');
            option.value = operator;
            option.textContent = operator;
            fragment.appendChild(option);
        });
        
        // 替换现有选项（保留"所有公司"选项）
        if (selector.children.length > 1) {
            // 保留第一个"所有公司"选项
            const allOption = selector.children[0];
            // 清空除第一个外的所有选项
            while (selector.children.length > 1) {
                selector.removeChild(selector.lastChild);
            }
            // 添加新创建的选项
            selector.appendChild(fragment);
            // 重新添加"所有公司"选项
            selector.insertBefore(allOption, selector.firstChild);
        } else {
            // 如果没有"所有公司"选项，直接添加
            selector.appendChild(fragment);
        }
        
        // 恢复之前选中的值（如果仍然有效）
        if (currentValue !== 'all' && operators.has(currentValue)) {
            selector.value = currentValue;
        }
    });
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
        // 显示基本统计数据（只在初始化时更新一次）
        const lineCountEl = document.querySelector('.line-count');
        const stationCountEl = document.querySelector('.station-count');
        const operatorCountEl = document.querySelector('.operator-count');
        const connectivityCountEl = document.querySelector('.connectivity-count'); // 添加连接度统计元素
        
        // 只有在元素还没有数值时才设置初始值
        if (lineCountEl && !lineCountEl.textContent) animateNumber(lineCountEl, fullNetworkStats.lineCount);
        if (stationCountEl && !stationCountEl.textContent) animateNumber(stationCountEl, fullNetworkStats.stationCount);
        if (operatorCountEl && !operatorCountEl.textContent) animateNumber(operatorCountEl, fullNetworkStats.operatorCount);
        // 计算并显示线网平均连接度
        if (connectivityCountEl && !connectivityCountEl.textContent && fullNetworkStats.connectivity.length > 0) {
            const totalConnectivity = fullNetworkStats.connectivity.reduce((sum, route) => sum + route.average, 0);
            const averageNetworkConnectivity = totalConnectivity / fullNetworkStats.connectivity.length;
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
        const operatorLinesRankEl = document.querySelector('#operator-lines-rank');
        if (operatorLinesRankEl) {
            operatorLinesRankEl.innerHTML = '';
            let allOperators = [...stats.operatorsByLines.entries()];
            
            // 运营公司排行榜默认降序排列，不支持切换
            allOperators.sort((a, b) => b[1] - a[1]);
            // 获取排名（包括并列情况）- 修改为显示所有公司
            const rankedOperators = getRankWithTies(allOperators, item => item[1]);
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = getMedalMap(rankedOperators);
            
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
        
        // 显示运营公司站点数排行
        const operatorStationsRankEl = document.querySelector('#operator-stations-rank');
        if (operatorStationsRankEl) {
            operatorStationsRankEl.innerHTML = '';
            let allOperatorsByStations = [...stats.operatorsByStations.entries()];
            
            // 运营公司站点数排行榜默认降序排列，不支持切换
            allOperatorsByStations.sort((a, b) => b[1] - a[1]);
            // 获取排名（包括并列情况）- 修改为显示所有公司
            const rankedOperators = getRankWithTies(allOperatorsByStations, item => item[1]);
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = getMedalMap(rankedOperators);
            
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
                const detailId = `operator-stations-detail-${encodeURIComponent(operatorEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${operatorEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${operatorEntry[0]}</div>
                        <div class="rank-value">${operatorEntry[1]} 个站点</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${linesInfo}</div>
                `;
                operatorStationsRankEl.appendChild(rankItem);
                
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
        
        // 显示运营公司平均连接度排行
        const operatorConnectivityRankEl = document.querySelector('#operator-connectivity-rank');
        if (operatorConnectivityRankEl) {
            operatorConnectivityRankEl.innerHTML = '';
            let allOperatorsByConnectivity = [...stats.operatorsByConnectivity.entries()];
            
            // 运营公司平均连接度排行榜默认降序排列，不支持切换
            allOperatorsByConnectivity.sort((a, b) => b[1] - a[1]);
            // 获取排名（包括并列情况）- 修改为显示所有公司
            const rankedOperators = getRankWithTies(allOperatorsByConnectivity, item => item[1]);
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = getMedalMap(rankedOperators);
            
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
                const detailId = `operator-connectivity-detail-${encodeURIComponent(operatorEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${operatorEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${operatorEntry[0]}</div>
                        <div class="rank-value">${Math.round(operatorEntry[1] * 100) / 100} 连接度</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${linesInfo}</div>
                `;
                operatorConnectivityRankEl.appendChild(rankItem);
                
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
        
        // 显示线路枢纽贡献度排行
        const hubContributionRankEl = document.querySelector('.hub-contribution-rank');
        if (hubContributionRankEl) {
            hubContributionRankEl.innerHTML = '';
            let rankedHubContribution = [...stats.hubContribution];
            
            // 根据排序状态调整顺序
            if (sortStates['hub-contribution-rank'] === 'asc') {
                rankedHubContribution.sort((a, b) => a.contribution - b.contribution);
                // 升序时从后往前排
                rankedHubContribution = getRankWithTiesReverseUntilAllMedals(rankedHubContribution, item => item.contribution);
            } else {
                rankedHubContribution.sort((a, b) => b.contribution - a.contribution);
                // 降序时正常排名
                rankedHubContribution = getRankWithTiesUntilAllMedals(rankedHubContribution, item => item.contribution);
            }
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = sortStates['hub-contribution-rank'] === 'desc' ? getMedalMap(rankedHubContribution) : new Map();
            
            rankedHubContribution.forEach((contributionEntry) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'ranking-item';
                
                // 根据排名确定奖牌类型
                let medalClass = '';
                if (medalMap.has(contributionEntry.rank)) {
                    medalClass = medalMap.get(contributionEntry.rank);
                }
                
                // 创建一个容器来保存详细信息
                const detailId = `hub-contribution-detail-${encodeURIComponent(contributionEntry.id)}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${contributionEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${contributionEntry.name}</div>
                        <div class="rank-value">${contributionEntry.contribution.toFixed(2)}%</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">枢纽贡献度</div>
                `;
                hubContributionRankEl.appendChild(rankItem);
                
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
        
        // 显示运营公司枢纽贡献度排行
        const operatorHubContributionRankEl = document.querySelector('#operator-hub-contribution-rank');
        if (operatorHubContributionRankEl) {
            operatorHubContributionRankEl.innerHTML = '';
            let allOperatorsByHubContribution = [...stats.operatorsByHubContribution.entries()];
            
            // 运营公司枢纽贡献度排行榜默认降序排列，不支持切换
            allOperatorsByHubContribution.sort((a, b) => b[1] - a[1]);
            // 获取排名（包括并列情况）- 修改为显示所有公司
            const rankedOperators = getRankWithTies(allOperatorsByHubContribution, item => item[1]);
            
            // 确定奖牌分配（仅在降序时）
            const medalMap = getMedalMap(rankedOperators);
            
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
                    if (routeData.operator && routeData.operator.includes(operatorEntry[0])) {
                        linesByOperator.push(routeData.name);
                    }
                }
                const linesInfo = linesByOperator.join(' / ');
                
                // 创建一个容器来保存详细信息
                const detailId = `operator-hub-contribution-detail-${encodeURIComponent(operatorEntry[0])}`;
                
                rankItem.innerHTML = `
                    <div class="rank-number ${medalClass}">${operatorEntry.rank}</div>
                    <div class="rank-content">
                        <div class="rank-title">${operatorEntry[0]}</div>
                        <div class="rank-value">${operatorEntry[1].toFixed(2)}%</div>
                    </div>
                    <div id="${detailId}" class="rank-detail">${linesInfo}</div>
                `;
                operatorHubContributionRankEl.appendChild(rankItem);
                
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