const map = document.getElementById('metro-map');
const background = document.getElementById('background')
const tooltip = document.getElementById('tooltip');
const routeResult = document.getElementById('route-result');
const routeList = document.getElementById('route-list');
const lineSummary = document.getElementById('line-summary');
const fareZoneSummary = document.getElementById('fare-zone-summary'); // 新增付费区总结元素
let zoomLevel = 1;
let minZoomLevel = 0.1;
const MAX_ZOOM_LEVEL = 5;
const ZOOM_PADDING = 40;
let resizeTimeout = null;
let startPoint = null;
let endPoint = null;
let currentStation = null;
let stationsData = {};
let linesData = {};
let offsetX = 0;
let offsetY = 0;
let startX, startY;
let maxX = 0;
let maxY = 0;
let minX = 0;
let minY = 0;
let isDragging = false;
let dragStartX, dragStartY;


// 创建线路名称到线路对象的映射
const lineNameMap = {};
Object.values(lines).forEach(line => {
    lineNameMap[line.name] = line;
});

// 添加线路颜色映射函数
function getLineColorByName(lineName) {
    const line = lineNameMap[lineName];
    return line ? line.color : null;
}

// 添加获取线路颜色的函数
function getLineColor(color) {
    for (const line of Object.values(lines)) {
        if (line.color === color) {
            return line.name;
        }
    }
    return "未知线路";
}

function drawLine(x1, y1, x2, y2, color, lineId) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("id", lineId);
    line.classList.add("line");
    line.dataset.baseWidth = "3";
    map.appendChild(line);
    if (!linesData[color]) linesData[color] = [];
    linesData[color].push({ x1, y1, x2, y2, id: lineId });
}

function drawStation(x, y, name, isTransfer, lineColor, labelOffset) {
    const existingText = map.querySelector(`text[station-name="${name}"]`);
    if (existingText) return;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 6);
    circle.classList.add("station");
    circle.style.stroke = lineColor;
    circle.addEventListener("click", (event) => showStationInfo(circle, name, event));

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + labelOffset.x);
    text.setAttribute("y", y + labelOffset.y);
    text.textContent = name;
    text.setAttribute("station-name", name);
    text.addEventListener("click", (event) => showStationInfo(circle, name, event));
    text.style.cursor = "pointer";

    if (isTransfer) {
        circle.setAttribute("r", 7);
        circle.style.stroke = "#888";
        circle.style.strokeWidth = 3.5;
        text.style.fontWeight = "bold";
    }

    map.appendChild(circle);
    map.appendChild(text);

    // ✅ 原始结构
    stationsData[name] = {
        x,
        y,
        element: circle,
        fareZones: Object.values(lines)
            .filter(line => {
                return line.stations.some(station => station.name === name);
            })
            .reduce((acc, line) => {
                const station = line.stations.find(s => s.name === name);
                acc[line.name] = station?.fareZone || '市区';
                return acc;
            }, {}),
    };

    // Update max dimensions for auto-resizing canvas
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
}

function showStationInfo(stationOrElement, name, event) {
    // 如果传入的是DOM元素，从元素获取站名
    if (stationOrElement instanceof SVGElement) {
        const stationData = Object.entries(stationsData).find(([_, data]) => data.element === stationOrElement);
        if (stationData) {
            name = stationData[0];
        }
    }
    
    // 确保我们有站名
    if (!name || !stationsData[name]) return;
    
    currentStation = name;
    const station = stationsData[name];
    
    // 更新站点信息
    const stationNameElement = document.getElementById("station-name");
    stationNameElement.textContent = `${name}站`;
    stationNameElement.className = 'h3';

    // 修改 showStationInfo 函数中的计费区显示部分
    const fareZoneInfoElement = document.getElementById("fare-zone-info");
    const fareZones = stationsData[name]?.fareZones ? Object.values(stationsData[name].fareZones) : ['市区'];
    fareZoneInfoElement.textContent = `${[...new Set(fareZones)].join('/')}计费区`;

    const linesInfoElement = document.getElementById("lines-info");
    linesInfoElement.textContent = `${Array.from(new Set(getLinesForStation(name))).join('/')}`;
    
    // 显示tooltip
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = "block";
    
    // 获取tooltip的实际尺寸
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    // 获取鼠标点击位置
    let mouseX, mouseY;
    if (event) {
        // 如果有事件对象，使用事件的坐标
        mouseX = event.clientX;
        mouseY = event.clientY;
    } else {
        // 如果没有事件对象，使用站点在视口中的位置
        const svgRect = map.getBoundingClientRect();
        mouseX = station.x * zoomLevel + offsetX + svgRect.left;
        mouseY = station.y * zoomLevel + offsetY + svgRect.top;
    }
    
    // 计算位置，默认在鼠标左上方
    let left = mouseX - tooltipWidth - 20;
    let top = mouseY - tooltipHeight - 20;
    
    // 确保不会超出视口
    if (left < 10) {
        // 如果左侧空间不足，显示在右侧
        left = mouseX + 20;
    }
    if (top < 10) {
        // 如果上方空间不足，显示在下方
        top = mouseY + 20;
    }
    
    // 确保不会超出右侧和底部
    if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
    }
    if (top + tooltipHeight > window.innerHeight - 10) {
        top = window.innerHeight - tooltipHeight - 10;
    }
    
    // 应用位置
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // 显示背景遮罩
    background.style.display = "block";
}

function getLinesForStation(name) {
    const lines = [];
    Object.keys(linesData).forEach(color => {
        linesData[color].forEach(line => {
            const startStation = findStationByCoordinates(line.x1, line.y1);
            const endStation = findStationByCoordinates(line.x2, line.y2);
            if ((startStation && startStation.name === name) || (endStation && endStation.name === name)) {
                lines.push(getLineColor(color));
            }
        });
    });
    return lines;
}

function openWikiPage(stationName) {
    window.open(`https://wiki.shangxiaoguan.top/${encodeURIComponent(stationName)}站`, '_blank');
    setToastText("正在跳转…");
    showToast();
    setTimeout(() => hideToast(), 5000)
}

function setStartPoint(name) {
    clearRoute();
    startPoint = name;
    document.getElementById("start-search").value = name;
    hideTooltip();
    updateMarkers();
}

function setEndPoint(name) {
    endPoint = name;
    document.getElementById("end-search").value = name;
    hideTooltip();
    highlightRoute();
    updateMarkers();
}

function hideTooltip() {
    tooltip.style.display = "none";
    background.style.display = "none";
}

function clearRoute() {
    startPoint = null;
    endPoint = null;
    document.getElementById("start-search").value = "";
    document.getElementById("end-search").value = "";
    resetMap();
    routeResult.style.display = "none";
    removeMarkers();
    // 清除查询信息
    localStorage.removeItem('metroTransferQuery');
}

function resetMap() {
    // 移除调暗效果
    document.querySelectorAll('.line, .station, text').forEach(element => {
        element.classList.remove('map-dimmed');
    });
    
    // 移除高亮组
    const highlightedGroup = document.querySelector('.highlighted-group');
    if (highlightedGroup) {
        highlightedGroup.remove();
    }

    // 重置站点标记
    const stations = document.querySelectorAll(".station");
    stations.forEach(station => {
        station.classList.remove("start-point");
        station.classList.remove("end-point");
    });
}

function setGrayTextColors() {
    const grayTextItems = document.querySelectorAll('.line-stations');
    grayTextItems.forEach(item => {
        const lineColor = item.dataset.lineColor;
        if (lineColor) {
            item.style.setProperty('--line-color', lineColor);
        }
    });
}

// Dijkstra's Algorithm to find the shortest path with weights
function dijkstraFindShortestPath(graph, start, end, optimizeFor = 'time') {
    const distances = {};
    const previousNodes = {};
    const previousEdges = {};
    const unvisitedNodes = new Set(Object.keys(graph));
    const TRANSFER_TIME = 3; // 换乘等候时间（分钟）

    // 初始化距离和前置节点
    for (const node in graph) {
        distances[node] = {
            time: Infinity,
            transfers: Infinity,
            currentLine: null
        };
        previousNodes[node] = null;
        previousEdges[node] = null;
    }
    distances[start] = {
        time: 0,
        transfers: 0,
        currentLine: null
    };

    while (unvisitedNodes.size > 0) {
        // 找到当前最近的节点
        let closestNode = null;
        for (const node of unvisitedNodes) {
            if (closestNode === null || 
                (optimizeFor === 'time' && distances[node].time < distances[closestNode].time) ||
                (optimizeFor === 'transfers' && 
                    (distances[node].transfers < distances[closestNode].transfers || 
                    (distances[node].transfers === distances[closestNode].transfers && 
                     distances[node].time < distances[closestNode].time))) ||
                (optimizeFor === 'fare' && 
                    distances[node].time + distances[node].transfers < distances[closestNode].time + distances[closestNode].transfers)
                ){
                closestNode = node;
            }
        }

        if (distances[closestNode].time === Infinity) break;
        if (closestNode === end) break;

        unvisitedNodes.delete(closestNode);

        // 更新邻居节点的距离
        for (const neighbor in graph[closestNode]) {
            const edge = graph[closestNode][neighbor];
            const currentLine = edge.line;
            
            // 计算新的时间，包括运行时间和换乘等候时间
            let newTime = distances[closestNode].time + edge.time;
            let newTransfers = distances[closestNode].transfers;
            
            // 如果是换乘，增加换乘等候时间和换乘次数
            if (distances[closestNode].currentLine !== null && 
                currentLine !== distances[closestNode].currentLine) {
                newTransfers++;
                // 在计算最短时间时，也要考虑换乘等候时间
                newTime += TRANSFER_TIME;
            }

            // 根据优化目标决定是否更新
            let shouldUpdate = false;
            if (optimizeFor === 'time') {
                // 对于时间优化，直接比较总时间（包括换乘等待时间）
                shouldUpdate = newTime < distances[neighbor].time;
            } else if (optimizeFor === 'transfers') {
                // 对于换乘优化，优先考虑换乘次数，次要考虑总时间
                shouldUpdate = newTransfers < distances[neighbor].transfers || 
                             (newTransfers === distances[neighbor].transfers && 
                              newTime < distances[neighbor].time);
            } else if (optimizeFor === 'fare') {
                // 对于费用优化，优先考虑费用，次要考虑换乘次数，再考虑总时间
                shouldUpdate = edge.fare < distances[neighbor].fare || 
                             (edge.fare === distances[neighbor].fare && 
                              newTransfers < distances[neighbor].transfers) ||
                             (edge.fare === distances[neighbor].fare && 
                              newTransfers === distances[neighbor].transfers && 
                              newTime < distances[neighbor].time);
            }

            if (shouldUpdate) {
                distances[neighbor] = {
                    time: newTime,
                    transfers: newTransfers,
                    currentLine: currentLine
                };
                previousNodes[neighbor] = closestNode;
                previousEdges[neighbor] = edge;
            }
        }
    }

    // 重建路径
    const path = [];
    const edges = [];
    let currentNode = end;
    
    while (currentNode !== start) { // ✅ 修正终止条件
        path.unshift(currentNode);
        if (previousEdges[currentNode]) {
            edges.unshift(previousEdges[currentNode]);
        }
        currentNode = previousNodes[currentNode];
    }
    
    // 添加起始点
    path.unshift(start);

    // 在返回结果中添加 totalFare 字段
    return {
        path,
        edges,
        totalTime: distances[end].time,
        totalTransfers: distances[end].transfers,
        totalFare: calculateFare(path) // 调用一个计算总票价的函数
    };
}

function calculateFare(path) {
    let totalFare = 0;
    let currentSegmentDistance = 0;
    let fareZones = new Set();
    let lastFareZone = null;
    let segmentCount = 1;

    const segments = []; // 新增：用于保存每个区段的详细信息

    for (let i = 0; i < path.length; i++) {
        const node = path[i];
        const [stationName, lineName] = node.split('_');
        const station = stationsData[stationName];
        const line = Object.values(lines).find(l => l.name === lineName);

        const lineStation = line?.stations.find(s => s.name === stationName);
        if (!lineStation) continue;

        const isTransferLine = /^#000000[0-9a-fA-F]{2}$/.test(line.color);
        const currentFareZone = stationName === "万方铁博" ? "铁路" : (lineStation.fareZone || '市区');

        const fareZoneChanged = stationName !== "万方铁博" && currentFareZone !== lastFareZone;

        //if (isTransferLine || fareZoneChanged) 
        if (isTransferLine) {
            if (currentSegmentDistance > 0) {
                const segmentFare = calculateSegmentFare(currentSegmentDistance);
                totalFare += segmentFare;
                segments.push({
                    distance: currentSegmentDistance,
                    fare: segmentFare,
                    segmentNumber: segmentCount,
                    fareZone: lastFareZone
                });
                currentSegmentDistance = 0;
                segmentCount++;
            }

            /*if (fareZoneChanged) {
                lastFareZone = currentFareZone;
                fareZones.add(currentFareZone);
            }*/
            if (isTransferLine) continue;
        }

        if (i > 0 && !isTransferLine) {
            const prevNode = path[i-1];
            const [prevStationName, prevLineName] = prevNode.split('_');
            const prevLine = Object.values(lines).find(l => l.name === prevLineName);

            if (prevLine && prevLine.stations) {
                const prevLineStation = prevLine.stations.find(s => s.name === prevStationName);
                const prevLineStationIndex = prevLine.stations.indexOf(prevLineStation);

                const isDownbound = prevLine.stations[prevLineStationIndex + 1]?.name === stationName;
                //console.log(`Is downbound for ${stationName} on ${lineName}:`, isDownbound);

                const stationDistanceSource = isDownbound ? prevLine.stations[prevLineStationIndex + 1] : prevLine.stations[prevLineStationIndex];
                //console.log(`Source station for ${stationName} on ${lineName}:`, stationDistanceSource);

                //if (prevLineStation && prevLineStation.distance) {
                if (prevLineStation) {
                    currentSegmentDistance += stationDistanceSource.distance || 1000; // 默认距离为1000米
                }
            }
        }
    }

    if (currentSegmentDistance > 0) {
        const segmentFare = calculateSegmentFare(currentSegmentDistance);
        totalFare += segmentFare;
        segments.push({
            distance: currentSegmentDistance,
            fare: segmentFare,
            segmentNumber: segmentCount,
            fareZone: lastFareZone
        });
    }

    return {
        totalFare,
        segments
    };
}

// 分段计价函数
function calculateSegmentFare(distance) {
    if (distance <= 6000) return 2;
    if (distance <= 10000) return 3;
    if (distance <= 14000) return 4;
    if (distance <= 21000) return 5;
    if (distance <= 28000) return 6;
    return 7; // 暂行票价7元封顶优惠
    //if (distance <= 38000) return 7;
    //if (distance <= 48000) return 8;
    // 超过48000米的部分按每10000米加1元计算
    //return 8 + Math.ceil((distance - 48000) / 10000);
}

function buildWeightedGraph(lines, options = {}) {
    const graph = {};
    const { excludeAirportLine = false } = options;
    const TRANSFER_TIME = 3; // 普通换乘等候时间（分钟）
    const FAST_TRANSFER_TIME = 1.5; // 快速换乘等候时间（分钟）

    // 创建站点到线路的映射
    const stationToLines = {};
    Object.values(lines).forEach(line => {
        if (excludeAirportLine && line.name === "机场线") return;
        
        line.stations.forEach((station, index) => {
            if (!stationToLines[station.name]) {
                stationToLines[station.name] = [];
            }

            line.stations.forEach(station => {
                // 设置默认值
                if (station.travelTime === undefined) {
                    station.travelTime = 2;
                }
                if (station.fareZone === undefined) {
                    station.fareZone = '市区';
                }
            });

            // 记录站点在线路中的位置和方向终点站
            const isDownbound = index > line.stations[Math.floor(line.stations.length / 2)].index;
            const directionEndStation = isDownbound ? 
                line.stations[line.stations.length - 1].name : 
                line.stations[0].name;
            
            stationToLines[station.name].push({
                line: line.name,
                index: index,
                totalStations: line.stations.length,
                travelTime: station.travelTime,
                directionEndStation: directionEndStation
            });
        });
    });

    // 为每个站点创建线路专用的节点
    Object.values(lines).forEach(line => {
        if (excludeAirportLine && line.name === "机场线") return;

        line.stations.forEach(station => {
            const nodeId = `${station.name}_${line.name}`;
            graph[nodeId] = {};
        });
    });

    // 添加同一线路上相邻站点之间的边
    Object.values(lines).forEach(line => {
        if (excludeAirportLine && line.name === "机场线") return;

        line.stations.forEach((station, index) => {
            if (index > 0) {
                const prevStation = line.stations[index - 1];
                const fromNode = `${prevStation.name}_${line.name}`;
                const toNode = `${station.name}_${line.name}`;
                const travelTime = prevStation.travelTime;

                // 添加双向边
                addWeightedEdge(graph, fromNode, toNode, {
                    time: travelTime,
                    line: line.name,
                    isTransfer: false
                });
                addWeightedEdge(graph, toNode, fromNode, {
                    time: travelTime,
                    line: line.name,
                    isTransfer: false
                });
            }
        });
    });

    // 添加同一站点不同线路之间的换乘边
    Object.keys(stationToLines).forEach(stationName => {
        const stationLines = stationToLines[stationName];
        if (stationLines.length > 1) {
            for (let i = 0; i < stationLines.length; i++) {
                for (let j = i + 1; j < stationLines.length; j++) {
                    const line1 = stationLines[i];
                    const line2 = stationLines[j];
                    const fromNode = `${stationName}_${line1.line}`;
                    const toNode = `${stationName}_${line2.line}`;

                    // 判断是否为特殊换乘站
                    let transferTime = TRANSFER_TIME;
                    
                    if (stationName === "海洋基地" && 
                        ((line1.line === "1号线" && line2.line === "2号线") || 
                         (line1.line === "2号线" && line2.line === "1号线"))) {
                        // 海洋基地站：临北路方向和临南中路方向之间，或冰岭西路方向和方形广场方向之间快速换乘
                        const isValidTransfer = 
                            // 临北路方向和临南中路方向之间
                            (line1.directionEndStation === "临北路" && line2.directionEndStation === "临南中路") ||
                            (line1.directionEndStation === "临南中路" && line2.directionEndStation === "临北路") ||
                            // 冰岭西路方向和方形广场方向之间
                            (line1.directionEndStation === "冰岭西路" && line2.directionEndStation === "方形广场") ||
                            (line1.directionEndStation === "方形广场" && line2.directionEndStation === "冰岭西路");
                        
                        if (isValidTransfer) {
                            transferTime = FAST_TRANSFER_TIME;
                        }
                    } else if (stationName === "忌城路" && 
                             ((line1.line === "1号线" && line2.line === "2号线") || 
                              (line1.line === "2号线" && line2.line === "1号线"))) {
                        // 忌城路站：临北路方向和方形广场方向之间，或冰岭西路和临南中路方向之间快速换乘
                        const isValidTransfer = 
                            // 临北路方向和方形广场方向之间
                            (line1.directionEndStation === "临北路" && line2.directionEndStation === "方形广场") ||
                            (line1.directionEndStation === "方形广场" && line2.directionEndStation === "临北路") ||
                            // 冰岭西路和临南中路方向之间
                            (line1.directionEndStation === "冰岭西路" && line2.directionEndStation === "临南中路") ||
                            (line1.directionEndStation === "临南中路" && line2.directionEndStation === "冰岭西路");
                        
                        if (isValidTransfer) {
                            transferTime = FAST_TRANSFER_TIME;
                        }
                    }

                    // 添加双向换乘边
                    addWeightedEdge(graph, fromNode, toNode, {
                        time: transferTime,
                        line: line2.line,
                        isTransfer: true
                    });
                    addWeightedEdge(graph, toNode, fromNode, {
                        time: transferTime,
                        line: line1.line,
                        isTransfer: true
                    });
                }
            }
        }
    });

    return graph;
}

function addWeightedEdge(graph, from, to, weight) {
    if (!graph[from]) {
        graph[from] = {};
    }
    graph[from][to] = weight;
}

function findShortestPath(start, end) {
    const queue = [{ node: start, path: [] }];
    const visited = new Set([start]);

    while (queue.length > 0) {
        const { node, path } = queue.shift();

        if (node === end) {
            return [...path, node];
        }

        const neighbors = getNeighbors(node);
        neighbors.forEach(neigh => {
            if (!visited.has(neigh)) {
                visited.add(neigh);
                queue.push({ node: neigh, path: [...path, node] });
            }
        });
    }

    return [];
}

function getNeighbors(station) {
    const neighbors = [];
    Object.keys(linesData).forEach(color => {
        linesData[color].forEach(line => {
            const startStation = findStationByCoordinates(line.x1, line.y1, station);
            const endStation = findStationByCoordinates(line.x2, line.y2, station);
            if (startStation && startStation.name === station) {
                neighbors.push(endStation.name);
            }
            if (endStation && endStation.name === station) {
                neighbors.push(startStation.name);
            }
        });
    });
    return neighbors;
}

function findStationByCoordinates(x, y, targetName = null) {
    let closestStation = null;
    let minDistance = Infinity;

    for (const [name, data] of Object.entries(stationsData)) {
        // 如果提供了目标名称，且当前名称不匹配，则跳过
        if (targetName && name !== targetName) continue;

        const dx = data.x - x;
        const dy = data.y - y;

        // 检查坐标是否在允许范围内
        if (dx >= -20 && dx <= 20 && dy >= -20 && dy <= 20) {
            const distance = dx * dx + dy * dy; // 使用欧几里得距离平方

            if (!closestStation || distance < minDistance) {
                closestStation = { name, ...data };
                minDistance = distance;
            }
        }
    }

    return closestStation;
}

function findLineBetweenStations(start, end, targetLine = null) {
    let bestMatch = null;
    let sharedLines = [];

    // 遍历所有线段
    for (const color of Object.keys(linesData)) {
        for (const line of linesData[color]) {
            const startStation = findStationByCoordinates(line.x1, line.y1, start);
            const endStation = findStationByCoordinates(line.x2, line.y2, end);

            // 正向匹配
            if (startStation && endStation && startStation.name === start && endStation.name === end) {
                sharedLines.push({...line, color});
                bestMatch = {...line, color};
            }

            // 反向匹配
            const reverseStartStation = findStationByCoordinates(line.x2, line.y2, start);
            const reverseEndStation = findStationByCoordinates(line.x1, line.y1, end);

            if (reverseStartStation && reverseEndStation && reverseStartStation.name === start && reverseEndStation.name === end) {
                sharedLines.push({...line, color});
                bestMatch = {...line, color};
            }
        }
    }

    // 如果指定了目标线路，尝试找到匹配的线段
    if (targetLine && sharedLines.length > 0) {
        const targetColor = Object.values(lines).find(l => l.name === targetLine)?.color;
        const matchingLine = sharedLines.find(l => l.color === targetColor);
        if (matchingLine) {
            return matchingLine;
        }
    }

    return bestMatch;
}

function markStation(name, className) {
    const station = stationsData[name];
    if (station) {
        station.element.classList.add(className);
    }
}

function zoomIn() {
    zoomLevel *= 1.5;
    if (zoomLevel > MAX_ZOOM_LEVEL) {
        zoomLevel = MAX_ZOOM_LEVEL;
    }
    updateTransform();
}

function zoomOut() {
    zoomLevel /= 1.5;
    if (zoomLevel < minZoomLevel) {
        zoomLevel = minZoomLevel;
    }
    updateTransform();
}

function updateTransform() {
    if (!zoomLevel || zoomLevel <= 0) zoomLevel = 1;
    
    const scaleFactor = Math.pow(zoomLevel, 1 / 5);
    const lineScaleFactor = Math.pow(zoomLevel, 1 / 20);
    
    map.style.transition = 'transform 0.15s ease-out';
    map.setAttribute("transform", `translate(${offsetX}, ${offsetY}) scale(${zoomLevel})`);

    map.querySelectorAll('text').forEach(text => {
        text.style.transition = 'transform 0.15s ease-out';
        text.style.transform = `scale(${1 / scaleFactor})`;
        text.style.transformOrigin = `${text.getAttribute('x')}px ${text.getAttribute('y')}px`;
    });

    map.querySelectorAll('.station').forEach(circle => {
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');
        circle.style.transition = 'transform 0.15s ease-out';
        circle.style.transform = `scale(${1 / scaleFactor})`;
        circle.style.transformOrigin = `${cx}px ${cy}px`;
    });

    map.querySelectorAll('line.line').forEach(line => {
        const baseWidth = parseFloat(line.dataset.baseWidth) || 3;
        line.setAttribute('stroke-width', Math.max(1, Math.min(3, baseWidth * lineScaleFactor)));
    });

    if (labelLoadingState.collisionDetected) {
        dynamicCollisionDetection();
    }

    if (currentStation && tooltip.style.display === "block") {
        showStationInfo(null, currentStation);
    }
}

function dragStart(event) {
    event.preventDefault();
    const transform = map.getAttribute("transform") || "translate(0, 0) scale(1)";
    const translateMatch = transform.match(/translate\((-?\d+), (-?\d+)\)/);
    offsetX = parseInt(translateMatch ? translateMatch[1] : 0, 10);
    offsetY = parseInt(translateMatch ? translateMatch[2] : 0, 10);
    startX = event.clientX;
    startY = event.clientY;
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
}

function dragMove(event) {
    offsetX += event.clientX - startX;
    offsetY += event.clientY - startY;
    startX = event.clientX;
    startY = event.clientY;
    updateTransform();
}

function dragEnd() {
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
}

map.addEventListener("mousedown", dragStart);

map.addEventListener("wheel", (event) => {
    event.preventDefault();
    const delta = Math.sign(event.deltaY);
    if (delta > 0) {
        zoomOut();
    } else {
        zoomIn();
    }
});

map.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const initialDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        map.addEventListener("touchmove", (moveEvent) => {
            if (moveEvent.touches.length === 2) {
                const moveTouch1 = moveEvent.touches[0];
                const moveTouch2 = moveEvent.touches[1];
                const currentDistance = Math.hypot(moveTouch1.clientX - moveTouch2.clientX, moveTouch1.clientY - moveTouch2.clientY);
                const delta = currentDistance - initialDistance;
                if (delta > 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        }, { passive: false });
        map.addEventListener("touchend", () => {
            map.removeEventListener("touchmove", () => { });
        });
    } else {
        isDragging = true;
        dragStartX = event.touches[0].clientX;
        dragStartY = event.touches[0].clientY;
        startX = offsetX;
        startY = offsetY;
    }
}, { passive: false });

map.addEventListener("touchmove", (event) => {
    if (!isDragging || event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    offsetX = startX + (touch.clientX - dragStartX);
    offsetY = startY + (touch.clientY - dragStartY);
    updateTransform();
}, { passive: false });

map.addEventListener("touchend", () => {
    isDragging = false;
});

function highlightRoute() {
    if (!startPoint || !endPoint) {
        console.error('Start point or end point is not set');
        return;
    }

    resetMap();

    const timeOptimizedPath = findOptimalPath(startPoint, endPoint, 'time');
    const transferOptimizedPath = findOptimalPath(startPoint, endPoint, 'transfers');
    const noAirportPath = findOptimalPath(startPoint, endPoint, 'time', true);
    const fareOptimizedPath = findOptimalPath(startPoint, endPoint, 'fare');

    // 修改 highlightRoute 中 routes 的构建方式，确保每个 route 对象包含 totalFare
    const routes = [
        timeOptimizedPath && timeOptimizedPath.path.length >= 2 ? {
            type: '时间短',
            path: timeOptimizedPath.path,
            totalTime: timeOptimizedPath.totalTime,
            totalTransfers: timeOptimizedPath.totalTransfers,
            totalFare: timeOptimizedPath.totalFare,
            fareData: timeOptimizedPath.fare,
            edges: timeOptimizedPath.edges
        } : null,
        transferOptimizedPath && transferOptimizedPath.path.length >= 2 ? {
            type: '少换乘',
            path: transferOptimizedPath.path,
            totalTime: transferOptimizedPath.totalTime,
            totalTransfers: transferOptimizedPath.totalTransfers,
            totalFare: transferOptimizedPath.totalFare,
            fareData: transferOptimizedPath.fare,
            edges: transferOptimizedPath.edges
        } : null,
        fareOptimizedPath && fareOptimizedPath.path.length >= 2 && fareOptimizedPath.totalFare > 0 ? {
            type: '票价低',
            path: fareOptimizedPath.path,
            totalTime: fareOptimizedPath.totalTime,
            totalTransfers: fareOptimizedPath.totalTransfers,
            totalFare: fareOptimizedPath.totalFare,
            fareData: fareOptimizedPath.fare,
            edges: fareOptimizedPath.edges
        } : null
    ]

    console.log('highlightRoute routes:', routes);

    // 调用 showRouteResults
    showRouteResults(routes);
}

// 比较两条路线是否相同
function areRoutesEqual(route1, route2) {
    if (route1.path.length !== route2.path.length) return false;
    
    for (let i = 0; i < route1.path.length; i++) {
        if (route1.path[i] !== route2.path[i]) return false;
    }
    
    return true;
}

// 修改 findOptimalPath 函数内的容错逻辑
function findOptimalPath(start, end, optimizeFor = 'time', excludeAirport = false) {
    const graph = buildWeightedGraph(lines, { excludeAirportLine: excludeAirport });
    const startLines = getLinesForStation(start);
    const endLines = getLinesForStation(end);

    let bestResult = null;
    let shortestTime = Infinity;
    let leastTransfers = Infinity;
    let lowestFare = Infinity;

    for (const startLine of startLines) {
        for (const endLine of endLines) {
            const startNode = `${start}_${startLine}`;
            const endNode = `${end}_${endLine}`;

            if (graph[startNode] && graph[endNode]) {
                const result = dijkstraFindShortestPath(graph, startNode, endNode, optimizeFor);
                const fareData = calculateFare(result.path);
                result.totalFare = fareData.totalFare;
                result.fareSegments = fareData.segments;

                // ✅ 增加路径有效性检查
                if (result.path?.length >= 2 && result.edges?.length === result.path.length - 1) {
                    // ✅ 确保 edges 长度与路径匹配
                    if (optimizeFor === 'fare' && result.totalFare < lowestFare) {
                        lowestFare = result.totalFare;
                        bestResult = result;
                    } else if (optimizeFor === 'time' && result.totalTime < shortestTime) {
                        shortestTime = result.totalTime;
                        bestResult = result;
                    } else if (optimizeFor === 'transfers' && 
                              (result.totalTransfers < leastTransfers || 
                               (result.totalTransfers === leastTransfers && result.totalTime < shortestTime))) {
                        leastTransfers = result.totalTransfers;
                        shortestTime = result.totalTime;
                        bestResult = result;
                    }
                }
            }
        }
    }

    console.log('findOptimalPath result:', bestResult, 'optimizeFor:', optimizeFor);
    return bestResult ? {
        ...bestResult,
        fare: {
            base: 0,
            additional: 0,
            airport: 0,
            total: bestResult.totalFare || 0,
            segments: bestResult.fareSegments || [],
        },
    } : null;
}

function showRouteResults(routes) {
    const routeResult = document.getElementById('route-result');
    const lineSummary = document.getElementById('line-summary');
    const fareZoneSummary = document.getElementById('fare-zone-summary');

    // 清空现有内容
    //lineSummary.innerHTML = '';
    fareZoneSummary.innerHTML = '';

    // ✅ 正确过滤路径，使用 route.totalFare 而不是 route.path.totalFare
    //const validRoutes = routes.filter(route => route.path?.length >= 2 && route.totalFare > 0);

    routeResult.style.display = 'block';

    /*if (validRoutes.length === 0) {
        showToast('没有找到有效路径');
        return;
    }*/

    // ✅ 获取最优路径
    const bestTimeRoute = [...routes].sort((a, b) => a.totalTime - b.totalTime)[0];
    const bestTransferRoute = [...routes].sort((a, b) => a.totalTransfers - b.totalTransfers)[0];
    const bestFareRoute = [...routes].sort((a, b) => a.totalFare - b.totalFare)[0];

    // ✅ 构建展示路径列表
    const displayRoutes = [];

    displayRoutes.push({
        type: '时间短',
        path: bestTimeRoute.path,
        totalTime: bestTimeRoute.totalTime,
        totalTransfers: bestTimeRoute.totalTransfers,
        totalFare: bestTimeRoute.totalFare,
        fareData: bestTimeRoute.fareData,
        isSelected: false,
        edges: bestTimeRoute.edges
    });

    if (!areRoutesEqual(bestTimeRoute, bestTransferRoute) && bestTransferRoute.totalTransfers < bestTimeRoute.totalTransfers) {
        displayRoutes.push({
            type: '少换乘',
            path: bestTransferRoute.path,
            totalTime: bestTransferRoute.totalTime,
            totalTransfers: bestTransferRoute.totalTransfers,
            totalFare: bestTransferRoute.totalFare,
            fareData: bestTransferRoute.fareData,
            isSelected: false,
            edges: bestTransferRoute.edges
        });
    }

    if (!areRoutesEqual(bestFareRoute, bestTimeRoute) &&
        !areRoutesEqual(bestFareRoute, bestTransferRoute) &&
        bestFareRoute.totalFare < bestTimeRoute.totalFare) {
        displayRoutes.push({
            type: '票价低',
            path: bestFareRoute.path,
            totalTime: bestFareRoute.totalTime,
            totalTransfers: bestFareRoute.totalTransfers,
            totalFare: bestFareRoute.totalFare,
            fareData: bestFareRoute.fareData,
            isSelected: false,
            edges: bestFareRoute.edges
        });
    }

    // ✅ 合并相同路径
    const mergedRoutes = mergeIdenticalRoutes(displayRoutes);

    // ✅ 设置默认选中路径
    const defaultRoute = mergedRoutes.find(r => r.type === '时间短') || mergedRoutes[0];
    mergedRoutes.forEach(route => {
        route.isSelected = (route.type === defaultRoute.type);
    });

    // ✅ 创建路径选择器
    const routeSelector = document.createElement('div');
    routeSelector.className = 'route-selector';

    mergedRoutes.forEach(route => {
        const button = document.createElement('button');
        button.textContent = route.type;
        button.className = route.isSelected ? 'selected' : '';
        button.onclick = () => {
            document.querySelectorAll('.route-selector button').forEach(btn => btn.className = '');
            button.className = 'selected';
            displayRoute(route);
        };
        routeSelector.appendChild(button);
    });

    lineSummary.appendChild(routeSelector);

    // ✅ 默认显示时间最短的路径
    displayRoute(defaultRoute);
}

// ✅ 新增路线合并函数
function mergeIdenticalRoutes(routes) {
    const result = [];
    const seenPaths = new Set();
    
    routes.forEach(route => {
        const pathKey = JSON.stringify(route.path);
        
        if (!seenPaths.has(pathKey)) {
            seenPaths.add(pathKey);
            result.push({ ...route });
        } else {
            // 合并相同路径的标签
            const existing = result.find(r => JSON.stringify(r.path) === pathKey);
            if (existing) {
                existing.type += '/' + route.type;
            }
        }
    });
    
    return result;
}

function displayRoute(routeInfo) {
    const { path, edges, totalTime, totalTransfers, totalFare, fareData } = routeInfo;

    if (!path || path.length < 2) {
        console.error('Invalid path');
        setToastText('没有找到有效路径');
        showToast();
        setTimeout(hideToast, 3000);
        return;
    }

    // ✅ 强化 edges 校验
    if (!edges || edges.length !== path.length - 1) {
        console.error('Edges data is invalid or missing');
        setToastText('路径数据无效，请重新查询');
        showToast();
        setTimeout(hideToast, 3000);
        return;
    }

    // ✅ 正常执行绘制与信息展示
    routeResult.style.display = "block"; // 显示 route-result

    // 清空所有路线相关内容
    const lineSummary = document.getElementById('line-summary');
    const routeSelector = lineSummary.querySelector('.route-selector');
    lineSummary.innerHTML = '';
    if (routeSelector) {
        lineSummary.appendChild(routeSelector);
    }

    let currentLine = null;
    let currentSegment = {
        line: null,
        startStation: null,
        stations: 0,
        time: 0
    };
    const segments = [];

    // 计算实际运行时间和等候时间
    let actualRunningTime = 0;
    let totalWaitingTime = totalTransfers * 3; // 每次换乘3分钟等候时间

    // 调暗所有线路、站点和站点标签
    document.querySelectorAll('.line, .station, text').forEach(element => {
        element.classList.add('map-dimmed');
    });

    // 创建高亮组
    let highlightedGroup = document.querySelector('.highlighted-group');
    if (!highlightedGroup) {
        highlightedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        highlightedGroup.setAttribute("class", "highlighted-group");
    }
    highlightedGroup.innerHTML = ''; // 清空之前的高亮内容

    // 处理每个站点
    const highlightedStations = new Set();
    for (let i = 0; i < path.length - 1; i++) {

        if (!edges || i >= edges.length) {
            console.error(`Edge data missing for path index ${i}`);
            continue; // 或者返回，根据业务逻辑决定
        }

        const edge = edges[i];
        const station = path[i].split('_')[0];
        const nextStation = path[i + 1].split('_')[0];

        if (!edges || edges.length < path.length - 1) {
            console.error('Edges data is invalid or missing');
            setToastText('路径数据无效');
            showToast();
            setTimeout(() => {hideToast();}, 1000);
            return;
        }

        // 记录站点
        highlightedStations.add(station);
        highlightedStations.add(nextStation);

        // 只累加运行时间，不包括换乘等候时间
        if (!edge.isTransfer) {
            actualRunningTime += edge.time;
        }

        // 如果是新的线路或第一个站点
        if (edge.line !== currentLine) {
            if (currentSegment.line) {
                segments.push({ ...currentSegment });
            }
            currentSegment = {
                line: edge.line,
                startStation: station,
                stations: 0,
                time: 0
            };
            currentLine = edge.line;
        }
        
        // 仅对非换乘边进行计数
        if (!edge.isTransfer) {
            currentSegment.stations += 1;
            currentSegment.time += edge.time;
        }

        // 添加调试日志
        console.log(
        `车站: ${station}, 线路: ${edge.line}, 当前站数: ${currentSegment.stations}`
        );

        // 在高亮组中绘制线路
        if (!edge.isTransfer) {  // 只绘制非换乘边
            const line = findLineBetweenStations(station, nextStation, edge.line);
            if (line) {
                const highlightedLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                highlightedLine.setAttribute("x1", line.x1);
                highlightedLine.setAttribute("y1", line.y1);
                highlightedLine.setAttribute("x2", line.x2);
                highlightedLine.setAttribute("y2", line.y2);
                highlightedLine.setAttribute("stroke", line.color);
                highlightedLine.setAttribute("class", "highlighted-line");
                highlightedGroup.appendChild(highlightedLine);
            }
        }
    }
    segments.push(currentSegment);

    // 在高亮组中绘制站点，并恢复相关站点和标签的不透明度
    highlightedStations.forEach(stationName => {
        const station = stationsData[stationName];
        if (station) {
            // 绘制高亮站点
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", station.x);
            circle.setAttribute("cy", station.y);
            circle.setAttribute("r", 6);
            circle.setAttribute("class", "station");
            circle.style.fill = "#fff";
            circle.style.stroke = station.element.style.stroke;
            highlightedGroup.appendChild(circle);

            // 恢复站点和对应标签的不透明度
            station.element.classList.remove('map-dimmed');
            const stationLabels = Array.from(document.querySelectorAll('text')).filter(
                text => text.textContent === stationName
            );
            stationLabels.forEach(label => {
                label.classList.remove('map-dimmed');
            });
        }
    });

    // 确保高亮组在最上层
    map.appendChild(highlightedGroup);

    // 显示行程信息
    displaySegments(segments);
    markStation(startPoint, "start-point");
    markStation(endPoint, "end-point");

    // 显示票价和行程信息
    const fareZoneSummary = document.getElementById('fare-zone-summary');
    // ✅ 重点修改：直接使用新版总票价
    let fareText = `<p class="clickable-info fare-detail">票价 ${routeInfo.totalFare} 元</p>`;
    
    fareZoneSummary.innerHTML = `
        ${fareText}
        <p class="clickable-info" onclick="showTimeDetail(${Math.ceil(actualRunningTime)}, ${totalWaitingTime})">预计 ${Math.ceil(actualRunningTime + totalWaitingTime)} 分钟</p>
        <p>换乘 ${totalTransfers} 次</p>
    `;

    // 添加鼠标样式
    const clickableInfos = fareZoneSummary.querySelectorAll('.clickable-info');
    clickableInfos.forEach(info => {
        info.style.cursor = 'pointer';
    });

    const fareDetail = document.querySelector(".fare-detail");
    fareDetail.addEventListener("click", () => {
        showFareDetail(fareData);
    })
}

function displaySegments(segments) {
    const lineSummary = document.getElementById('line-summary');
    
    segments.forEach((segment, index) => {
        const startItem = document.createElement('p');
        startItem.textContent = `${segment.startStation}站${index === 0 ? ' 出发' : ' 换乘'}`;
        startItem.style.fontWeight = index === 0 ? 'bold' : 'normal';
        startItem.className = index === 0 ? 'start' : 'transfer';
        lineSummary.appendChild(startItem);

        const lineItem = document.createElement('p');
        // 获取该线路的终点站（方向）
        const line = Object.values(lines).find(l => l.name === segment.line);
        if (!line) {
            console.error(`线路 ${segment.line} 未找到`);
        }
        
        // 找到当前段的起点和终点在线路中的索引
        let startIndex = -1;
        let endIndex = -1;
        let nextStation = '';
        
        // 如果是最后一段，使用终点站，否则使用下一段的起点
        if (index < segments.length - 1) {
            nextStation = segments[index + 1].startStation;
        } else {
            nextStation = endPoint;
        }
        
        // 找到相关站点的索引
        for (let i = 0; i < line.stations.length; i++) {
            if (line.stations[i].name === segment.startStation) {
                startIndex = i;
            }
            if (line.stations[i].name === nextStation) {
                endIndex = i;
            }
        }
        
        // 根据实际运行方向判断上下行
        const isDownbound = startIndex < endIndex;
        const directionStation = isDownbound ? line.stations[line.stations.length - 1].name : line.stations[0].name;
        
        lineItem.textContent = `${segment.line} ${directionStation}方向\n  乘坐${segment.stations}站 (${Math.ceil(segment.time)}分钟)`;
        lineItem.className = 'line-stations';
        lineItem.dataset.lineColor = getLineColorByName(segment.line);
        lineSummary.appendChild(lineItem);
    });

    const lastStation = document.createElement('p');
    lastStation.textContent = `到达 ${endPoint}站`;
    lastStation.style.fontWeight = 'bold';
    lastStation.className = 'end';
    lineSummary.appendChild(lastStation);

    setGrayTextColors();
}

function copyToClipboard() {
    const routeSelector = document.querySelector('.route-selector');
    const selectedButton = routeSelector.querySelector('button.selected');
    const selectedRouteType = selectedButton ? selectedButton.textContent : '推荐路线';

    // 获取所有行程信息段落
    const paragraphs = lineSummary.querySelectorAll('p');
    let routeText = '';

    // 遍历每个段落，根据类名添加相应的符号
    paragraphs.forEach(p => {
        if (p.className === 'start') {
            routeText += '● ' + p.textContent + '\n';
        } else if (p.className === 'transfer') {
            routeText += '○ ' + p.textContent + '\n';
        } else if (p.className === 'line-stations') {
            routeText += '↓ ' + p.textContent + '\n';
        } else if (p.className === 'end') {
            routeText += '● ' + p.textContent + '\n';
        }
    });

    // 获取票价和时间信息
    const fareInfo = fareZoneSummary.innerText.split('\n').filter(line => line.trim()).join('\n');

    const textToCopy = `${selectedRouteType}\n${routeText}\n${fareInfo}\n\n此方案由「雨城通」提供：yct.shangxiaoguan.top\n「临东市」及其相关组织机构均为虚构`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            setToastText("已复制到剪贴板");
            showToast();
            setTimeout(() => hideToast(), 2000)
        })
        .catch(err => {
            console.error('无法复制文本: ', err);
            setToastText("复制失败，请尝试手动复制");
            showToast();
            setTimeout(() => hideToast(), 2000)
        });
}

function filterStations(query, type) {
    query = query.toLowerCase();
    const filteredStations = Object.keys(stationsData).filter(station => station.toLowerCase().includes(query));
    const searchInput = document.getElementById(`${type}-search`);
    searchInput.setAttribute("list", `${type}-stations`);

    const datalist = document.createElement("datalist");
    datalist.id = `${type}-stations`;
    searchInput.parentNode.replaceChild(datalist, searchInput.nextSibling);

    filteredStations.forEach(station => {
        const option = document.createElement("option");
        option.value = station;
        datalist.appendChild(option);
    });
}

function setRouteFromSearch() {
    const startValue = document.getElementById("start-search").value.trim();
    const endValue = document.getElementById("end-search").value.trim();

    if (startValue) {
        startPoint = startValue;
    }

    if (endValue) {
        endPoint = endValue;
    }

    highlightRoute();
    updateMarkers();
}

function updateMarkers() {
    removeMarkers();

    if (startPoint) {
        const startStation = stationsData[startPoint];
        if (startStation) {
            const marker = createMarker(startStation.x, startStation.y, "#008000");
            map.appendChild(marker);
        }
    }

    if (endPoint) {
        const endStation = stationsData[endPoint];
        if (endStation) {
            const marker = createMarker(endStation.x, endStation.y, "#ffa500");
            map.appendChild(marker);
        }
    }
}

function createMarker(x, y, color) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", x);
    marker.setAttribute("cy", y);
    marker.setAttribute("r", 8);
    marker.style.fill = color;
    marker.style.opacity = 1;
    marker.style.stroke = "white"; // Add a white stroke
    marker.style.strokeWidth = "4"; // Set the stroke width
    return marker;
}

function removeMarkers() {
    const markers = map.querySelectorAll("circle[r='8']");
    markers.forEach(marker => marker.remove());
}

Object.values(lines).forEach(line => {
    const color = line.color;
    line.stations.forEach((station, index) => {
        const { name, coordinates, fareZone, labelOffset } = station;
        const isTransfer = Object.values(lines).some(l => l.stations.some(s => s.name === name && l.color !== color));
        drawStation(coordinates.x, coordinates.y, name, isTransfer, color, labelOffset);
        if (index < line.stations.length - 1) {
            const nextStation = line.stations[index + 1];
            drawLine(coordinates.x, coordinates.y, nextStation.coordinates.x, nextStation.coordinates.y, color, `line_${line.name.replace(/\s+/g, '_').toLowerCase()}_${index}`);
        }
    });
});

// ==================== 文本碰撞检测与智能避让系统 ====================
let overlapHiddenTexts = new Map();
let labelStateCache = new Map();
let labelOptimizationResults = new Map();
let collisionDetectionThrottle = null;
let lastCollisionCheckTime = 0;
const COLLISION_CHECK_INTERVAL = 100;
const DEBOUNCE_DELAY = 50;

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function getAnchorFromAngle(angle) {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    if (normalizedAngle >= 270 || normalizedAngle <= 90) {
        return 'start';
    } else if (normalizedAngle > 90 && normalizedAngle < 270) {
        return 'end';
    }
    
    return 'middle';
}

function generateCandidates(sx, sy, textWidth, textHeight, spacing = 6) {
    if (isNaN(sx) || isNaN(sy) || isNaN(textWidth) || isNaN(textHeight)) return [];
    
    const candidates = [];
    const angles = [0, 20, -20, 40, -40, 60, -60, 80, -80, 
                    180, 160, 200, 140, 220, 120, 240, 100, 260, 
                    90, 270];
    
    angles.forEach((angleDeg, index) => {
        let x, y, anchor;
        
        const normalizedAngle = ((angleDeg % 360) + 360) % 360;
        
        if (normalizedAngle === 0 || normalizedAngle === 180) {
            const direction = normalizedAngle === 0 ? 1 : -1;
            x = sx + direction * spacing;
            y = sy + textHeight * 0.35;
            anchor = normalizedAngle === 0 ? 'start' : 'end';
        } else if (normalizedAngle === 90 || normalizedAngle === 270) {
            x = sx - textWidth / 2;
            y = normalizedAngle === 90 ? sy - spacing - textHeight : sy + spacing + textHeight * 0.8;
            anchor = 'middle';
        } else if ((normalizedAngle > 0 && normalizedAngle < 90) || 
                   (normalizedAngle > 270 && normalizedAngle < 360)) {
            x = sx + spacing;
            const offsetRatio = normalizedAngle > 270 ? 
                (360 - normalizedAngle) / 90 : normalizedAngle / 90;
            y = sy + textHeight * (1 - offsetRatio);
            anchor = 'start';
        } else if (normalizedAngle > 90 && normalizedAngle < 270) {
            x = sx - spacing;
            const offsetRatio = normalizedAngle > 180 ? 
                (normalizedAngle - 180) / 90 : (180 - normalizedAngle) / 90;
            y = sy + textHeight * (1 - offsetRatio);
            anchor = 'end';
        } else {
            return;
        }
        
        candidates.push({ 
            x: x, 
            y: y, 
            anchor: anchor, 
            angle: angleDeg,
            radius: spacing,
            index: index
        });
    });
    
    return candidates.filter(c => c.x !== undefined && !isNaN(c.x));
}

function isTextsOverlapping(text1, text2) {
    try {
        const bbox1 = text1.getBBox();
        const bbox2 = text2.getBBox();
        
        if (!bbox1 || !bbox2) return false;
        
        const padding = 2;
        return !(bbox1.x + bbox1.width + padding < bbox2.x ||
                 bbox2.x + bbox2.width + padding < bbox1.x ||
                 bbox1.y + bbox1.height + padding < bbox2.y ||
                 bbox2.y + bbox2.height + padding < bbox1.y);
    } catch (e) {
        return false;
    }
}

function isTextOverlappingLine(textBBox, line) {
    try {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        
        if ([x1, y1, x2, y2].some(isNaN)) return false;
        
        const lineWidth = parseFloat(line.getAttribute('stroke-width')) || 3;
        const linePadding = lineWidth + 4;
        
        const lineBounds = {
            x: Math.min(x1, x2) - linePadding,
            y: Math.min(y1, y2) - linePadding,
            width: Math.abs(x2 - x1) + linePadding * 2,
            height: Math.abs(y2 - y1) + linePadding * 2
        };
        
        return !(textBBox.x + textBBox.width < lineBounds.x ||
                 lineBounds.x + lineBounds.width < textBBox.x ||
                 textBBox.y + textBBox.height < lineBounds.y ||
                 lineBounds.y + lineBounds.height < textBBox.y);
    } catch (e) {
        return false;
    }
}

function isTextOverlappingCircle(textBBox, circle) {
    try {
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        const r = parseFloat(circle.getAttribute('r')) || 6;
        
        if (isNaN(cx) || isNaN(cy) || isNaN(r)) return false;
        
        const circlePadding = r + 4;
        const circleBounds = {
            x: cx - circlePadding,
            y: cy - circlePadding,
            width: circlePadding * 2,
            height: circlePadding * 2
        };
        
        return !(textBBox.x + textBBox.width < circleBounds.x ||
                 circleBounds.x + circleBounds.width < textBBox.x ||
                 textBBox.y + textBBox.height < circleBounds.y ||
                 circleBounds.y + circleBounds.height < textBBox.y);
    } catch (e) {
        return false;
    }
}

function calculateTextCollisionScore(text) {
    try {
        const bbox = text.getBBox();
        if (!bbox) return { total: 0, textCollisions: 0, lineCollisions: 0, circleCollisions: 0 };
        
        const paddedBBox = {
            x: bbox.x - 3,
            y: bbox.y - 3,
            width: bbox.width + 6,
            height: bbox.height + 6
        };
        
        let textCollisions = 0;
        let lineCollisions = 0;
        let circleCollisions = 0;
        
        const allTexts = Array.from(map.querySelectorAll('text'));
        for (const otherText of allTexts) {
            if (otherText !== text && isTextsOverlapping(text, otherText)) {
                textCollisions++;
            }
        }
        
        const allLines = Array.from(map.querySelectorAll('line.line'));
        for (const line of allLines) {
            if (isTextOverlappingLine(paddedBBox, line)) {
                lineCollisions++;
            }
        }
        
        const allCircles = Array.from(map.querySelectorAll('.station'));
        for (const circle of allCircles) {
            if (isTextOverlappingCircle(paddedBBox, circle)) {
                circleCollisions++;
            }
        }
        
        return {
            total: textCollisions * 10 + lineCollisions * 5 + circleCollisions * 8,
            textCollisions,
            lineCollisions,
            circleCollisions
        };
    } catch (e) {
        return { total: 0, textCollisions: 0, lineCollisions: 0, circleCollisions: 0 };
    }
}

function checkAndHandleOverlaps() {
    try {
        const allTexts = Array.from(map.querySelectorAll('text'));
        const currentZoomLevel = zoomLevel;
        
        if (currentZoomLevel >= 0.8) {
            restoreAllLabelsToDefault();
            return;
        }

        const optimizationResults = resolveCollisions();

        const labelsToHide = [];
        const labelsToShow = [];

        allTexts.forEach(text => {
            const result = optimizationResults.get(text);
            if (!result) return;

            const priority = result.priority || parseInt(text.dataset.labelPriority) || 1;
            const stationName = text.getAttribute('station-name');
            
            labelStateCache.set(stationName || text, {
                originalCollisions: result.originalCollisions,
                bestCollisions: result.bestCollisions,
                candidatesExhausted: result.candidatesExhausted,
                priority: priority,
                zoomLevel: currentZoomLevel,
                timestamp: Date.now()
            });

            if (result.candidatesExhausted && result.bestCollisions > 0) {
                const hideThreshold = currentZoomLevel < 0.4 ? 0 :
                                     currentZoomLevel < 0.6 ? (priority < 2 ? 5 : 10) :
                                     (priority < 2 ? 8 : 15);
                
                if (result.bestCollisions >= hideThreshold) {
                    labelsToHide.push({
                        text: text,
                        priority: priority,
                        collisionCount: result.bestCollisions,
                        originalCollisions: result.originalCollisions
                    });
                } else {
                    labelsToShow.push(text);
                }
            } else {
                labelsToShow.push(text);
            }
        });

        labelsToHide.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.collisionCount - a.collisionCount;
        });

        const maxHideRatio = currentZoomLevel < 0.4 ? 0.8 :
                             currentZoomLevel < 0.6 ? 0.5 : 0.3;
        const maxHideCount = Math.floor(allTexts.length * maxHideRatio);
        const finalToHide = labelsToHide.slice(0, maxHideCount);

        finalToHide.forEach(({ text, collisionCount }) => {
            if (!overlapHiddenTexts.has(text)) {
                const currentOpacity = text.style.opacity || getComputedStyle(text).opacity || "1";
                overlapHiddenTexts.set(text, {
                    originalOpacity: currentOpacity,
                    hideReason: 'candidates_exhausted',
                    collisionScore: collisionCount,
                    candidatesExhausted: true
                });
                text.style.opacity = "0";
                text.dataset.autoHidden = "true";
            }
        });

        labelsToShow.forEach(text => {
            if (overlapHiddenTexts.has(text)) {
                const state = overlapHiddenTexts.get(text);
                text.style.opacity = state.originalOpacity || "1";
                delete text.dataset.autoHidden;
                overlapHiddenTexts.delete(text);
            }
        });
        
    } catch (error) {
        console.warn("重叠检测出错:", error);
    }
}

function restoreAllLabelsToDefault() {
    if (overlapHiddenTexts.size > 0) {
        overlapHiddenTexts.forEach((state, text) => {
            if (text && text.parentNode) {
                text.style.opacity = state.originalOpacity || "1";
                delete text.dataset.autoHidden;
            }
        });
        overlapHiddenTexts.clear();
    }
}

function dynamicCollisionDetection() {
    const now = Date.now();
    
    if (now - lastCollisionCheckTime < COLLISION_CHECK_INTERVAL) {
        if (collisionDetectionThrottle) {
            clearTimeout(collisionDetectionThrottle);
        }
        collisionDetectionThrottle = setTimeout(() => {
            performDynamicCollisionCheck();
        }, DEBOUNCE_DELAY);
        return;
    }
    
    lastCollisionCheckTime = now;
    performDynamicCollisionCheck();
}

function performDynamicCollisionCheck() {
    if (!labelLoadingState.collisionDetected) return;
    
    try {
        resolveCollisions();
        checkAndHandleOverlaps();
        
        if (labelLoadingState.debugMode) {
            visualizeCollisionResults();
        }
    } catch (error) {
        console.error("动态碰撞检测错误:", error);
    }
}

function resolveCollisions() {
    try {
        const allCircles = Array.from(map.querySelectorAll('circle'));
        const allTexts = Array.from(map.querySelectorAll('text'));
        const allLines = Array.from(map.querySelectorAll('line'));
        const PADDING = 4;
        
        labelOptimizationResults.clear();

        function getBBox(el) {
            try {
                const bbox = el.getBBox();
                return {
                    x: bbox.x - PADDING,
                    y: bbox.y - PADDING,
                    width: bbox.width + PADDING * 2,
                    height: bbox.height + PADDING * 2
                };
            } catch (e) {
                return null;
            }
        }

        function getCircleBounds(circle) {
            const cx = parseFloat(circle.getAttribute('cx'));
            const cy = parseFloat(circle.getAttribute('cy'));
            const r = parseFloat(circle.getAttribute('r')) || 6;
            
            if (isNaN(cx) || isNaN(cy) || isNaN(r)) {
                return { x: 0, y: 0, width: 12, height: 12 };
            }
            
            return {
                x: cx - r - PADDING,
                y: cy - r - PADDING,
                width: r * 2 + PADDING * 2,
                height: r * 2 + PADDING * 2
            };
        }

        function getLineBounds(line) {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            const baseWidth = parseFloat(line.dataset.baseWidth) || 3;
            const lineWidth = Math.max(baseWidth * 2, 8);
            
            if ([x1, y1, x2, y2].some(isNaN)) {
                return { x: 0, y: 0, width: 10, height: 10 };
            }
            
            return {
                x: Math.min(x1, x2) - lineWidth,
                y: Math.min(y1, y2) - lineWidth,
                width: Math.abs(x2 - x1) + lineWidth * 2,
                height: Math.abs(y2 - y1) + lineWidth * 2
            };
        }

        function checkCollision(bbox1, bbox2) {
            if (!bbox1 || !bbox2) return false;
            return !(bbox1.x + bbox1.width < bbox2.x ||
                     bbox2.x + bbox2.width < bbox1.x ||
                     bbox1.y + bbox1.height < bbox2.y ||
                     bbox2.y + bbox2.height < bbox1.y);
        }

        function countCollisions(bbox, excludeText) {
            let count = 0;
            let lineCollisions = 0;
            let circleCollisions = 0;
            let textCollisions = 0;
            
            for (const circle of allCircles) {
                if (checkCollision(bbox, getCircleBounds(circle))) {
                    circleCollisions++;
                    count++;
                }
            }
            for (const line of allLines) {
                if (checkCollision(bbox, getLineBounds(line))) {
                    lineCollisions++;
                    count += 3;
                }
            }
            for (const text of allTexts) {
                if (text === excludeText) continue;
                const textBBox = getBBox(text);
                if (textBBox && checkCollision(bbox, textBBox)) {
                    textCollisions++;
                    count += 2;
                }
            }
            
            return { 
                total: count,
                lineCollisions: lineCollisions,
                circleCollisions: circleCollisions,
                textCollisions: textCollisions
            };
        }

        const viewBounds = {
            x: minX - 50,
            y: minY - 50,
            width: (maxX - minX) + 1200,
            height: (maxY - minY) + 400
        };

        function isInView(bbox) {
            return bbox.x >= viewBounds.x &&
                   bbox.y >= viewBounds.y &&
                   bbox.x + bbox.width <= viewBounds.x + viewBounds.width &&
                   bbox.y + bbox.height <= viewBounds.y + viewBounds.height;
        }

        allTexts.forEach(text => {
            const stationName = text.textContent;
            const stationData = stationsData[stationName];
            if (!stationData) return;

            const sx = stationData.x;
            const sy = stationData.y;
            
            if (isNaN(sx) || isNaN(sy)) return;
            
            const currentBBox = getBBox(text);
            if (!currentBBox) return;

            const originalResult = countCollisions(currentBBox, text);
            const originalCollisions = originalResult.total;
            
            if (originalCollisions === 0 && isInView(currentBBox)) {
                labelOptimizationResults.set(text, {
                    originalCollisions: 0,
                    bestCollisions: 0,
                    candidatesExhausted: false,
                    wasRelocated: false,
                    priority: parseInt(text.dataset.labelPriority) || 1
                });
                return;
            }

            const textWidth = currentBBox.width;
            const textHeight = currentBBox.height;
            
            if (isNaN(textWidth) || isNaN(textHeight)) return;

            const candidates = generateCandidates(sx, sy, textWidth, textHeight, 6);

            let bestCandidate = null;
            let bestScore = Infinity;
            let bestCollisionResult = null;
            let allCandidatesHaveCollisions = true;

            candidates.forEach(candidate => {
                const testBBox = {
                    x: candidate.x,
                    y: candidate.y,
                    width: textWidth,
                    height: textHeight
                };

                const collisionResult = countCollisions(testBBox, text);
                const inView = isInView(testBBox);
                
                const score = collisionResult.total * 1000 + 
                             collisionResult.lineCollisions * 500 +
                             (inView ? 0 : 500);

                if (collisionResult.total === 0 && inView) {
                    allCandidatesHaveCollisions = false;
                }

                if (score < bestScore) {
                    bestScore = score;
                    bestCandidate = candidate;
                    bestCollisionResult = collisionResult;
                }
            });

            const bestCollisionCount = bestCollisionResult ? bestCollisionResult.total : Infinity;

            const shouldRelocate = bestCandidate && 
                                   bestCollisionCount < originalCollisions && 
                                   bestScore < Infinity;

            if (shouldRelocate) {
                text.setAttribute('x', bestCandidate.x);
                text.setAttribute('y', bestCandidate.y);
                text.setAttribute('text-anchor', bestCandidate.anchor);
                
                labelOptimizationResults.set(text, {
                    originalCollisions: originalCollisions,
                    bestCollisions: bestCollisionCount,
                    candidatesExhausted: allCandidatesHaveCollisions && bestCollisionCount > 0,
                    wasRelocated: true,
                    newCandidate: bestCandidate,
                    priority: parseInt(text.dataset.labelPriority) || 1
                });
            } else {
                labelOptimizationResults.set(text, {
                    originalCollisions: originalCollisions,
                    bestCollisions: originalCollisions,
                    candidatesExhausted: allCandidatesHaveCollisions,
                    wasRelocated: false,
                    priority: parseInt(text.dataset.labelPriority) || 1
                });
            }
        });
        
        return labelOptimizationResults;
    } catch (error) {
        console.error("碰撞检测系统错误:", error);
        return labelOptimizationResults;
    }
}

// ==================== 图形范围自适应调整功能 ====================
function calculateGraphBounds() {
    let bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };

    const allElements = map.querySelectorAll('circle, line, text, rect, path');
    allElements.forEach(el => {
        try {
            const bbox = el.getBBox();
            if (bbox.width === 0 && bbox.height === 0) {
                const cx = parseFloat(el.getAttribute('cx')) || 0;
                const cy = parseFloat(el.getAttribute('cy')) || 0;
                const r = parseFloat(el.getAttribute('r')) || 0;
                bounds.minX = Math.min(bounds.minX, cx - r);
                bounds.minY = Math.min(bounds.minY, cy - r);
                bounds.maxX = Math.max(bounds.maxX, cx + r);
                bounds.maxY = Math.max(bounds.maxY, cy + r);
            } else {
                bounds.minX = Math.min(bounds.minX, bbox.x);
                bounds.minY = Math.min(bounds.minY, bbox.y);
                bounds.maxX = Math.max(bounds.maxX, bbox.x + bbox.width);
                bounds.maxY = Math.max(bounds.maxY, bbox.y + bbox.height);
            }
        } catch (e) {
            // 忽略无法获取边界框的元素
        }
    });

    return bounds;
}

function updateViewBox() {
    const bounds = calculateGraphBounds();
    const padding = 80;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;
    map.setAttribute("viewBox", `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`);
}

function calculateMinZoomLevel() {
    try {
        const svgRect = map.getBoundingClientRect();
        const containerWidth = svgRect.width || window.innerWidth * 0.8;
        const containerHeight = svgRect.height || window.innerHeight * 0.7;
        
        const viewBox = map.getAttribute('viewBox');
        if (!viewBox) return 0.1;
        
        const parts = viewBox.split(/\s+/).map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return 0.1;
        
        const vbWidth = parts[2];
        const vbHeight = parts[3];
        
        if (vbWidth <= 0 || vbHeight <= 0) return 0.1;
        
        const scaleX = containerWidth / vbWidth;
        const scaleY = containerHeight / vbHeight;
        const fitZoom = Math.min(scaleX, scaleY);
        
        return Math.max(0.1, Math.min(fitZoom, MAX_ZOOM_LEVEL));
    } catch (error) {
        console.warn('计算最小缩放级别失败:', error);
        return 0.1;
    }
}

function updateZoomLimits() {
    minZoomLevel = calculateMinZoomLevel();
    
    if (zoomLevel < minZoomLevel) {
        zoomLevel = minZoomLevel;
        updateTransform();
    }
}

function initZoomLimitSystem() {
    updateZoomLimits();
    
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
            updateZoomLimits();
        }, 150);
    });
}

// ==================== 标签加载与碰撞检测系统 ====================
let labelLoadingState = {
    phase: 'idle',
    linesLoaded: false,
    circlesLoaded: false,
    labelsLoaded: false,
    collisionDetected: false,
    debugMode: false,
    collisionVisualizer: null
};

let labelPriorityMap = new Map();
let hiddenLabelsByPriority = new Map();

function initializeLabelSystem() {
    labelLoadingState.phase = 'loading';
    
    requestAnimationFrame(() => {
        loadPhase1_LinesAndCircles();
    });
}

function loadPhase1_LinesAndCircles() {
    labelLoadingState.phase = 'phase1';
    
    Object.values(lines).forEach(line => {
        const color = line.color;
        line.stations.forEach((station, index) => {
            const { name, coordinates, fareZone, labelOffset } = station;
            const isTransfer = Object.values(lines).some(l => l.stations.some(s => s.name === name && l.color !== color));
            
            drawStationCircleOnly(coordinates.x, coordinates.y, name, isTransfer, color);
            
            if (index < line.stations.length - 1) {
                const nextStation = line.stations[index + 1];
                drawLine(coordinates.x, coordinates.y, nextStation.coordinates.x, nextStation.coordinates.y, color, `line_${line.name.replace(/\s+/g, '_').toLowerCase()}_${index}`);
            }
            
            const priority = isTransfer ? 2 : 1;
            labelPriorityMap.set(name, Math.max(labelPriorityMap.get(name) || 0, priority));
        });
    });
    
    labelLoadingState.linesLoaded = true;
    labelLoadingState.circlesLoaded = true;
    
    setTimeout(() => {
        loadPhase2_Labels();
    }, 50);
}

function drawStationCircleOnly(x, y, name, isTransfer, lineColor) {
    const existingCircle = map.querySelector(`circle[station-name="${name}"]`);
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 6);
    circle.classList.add("station");
    circle.style.stroke = lineColor;
    circle.setAttribute("station-name", name);
    circle.addEventListener("click", (event) => showStationInfo(circle, name, event));

    if (isTransfer) {
        circle.setAttribute("r", 7);
        circle.style.stroke = "#888";
        circle.style.strokeWidth = 3.5;
    }

    if (!existingCircle) {
        stationsData[name] = {
            x,
            y,
            element: circle,
            fareZones: Object.values(lines)
                .filter(line => line.stations.some(station => station.name === name))
                .reduce((acc, line) => {
                    const station = line.stations.find(s => s.name === name);
                    acc[line.name] = station?.fareZone || '市区';
                    return acc;
               }, {}),
        };

        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
    }
    
    map.appendChild(circle);
}

function loadPhase2_Labels() {
    labelLoadingState.phase = 'phase2';
    
    const labelBatch = [];
    
    Object.values(lines).forEach(line => {
        line.stations.forEach(station => {
            const { name, coordinates, labelOffset } = station;
            const existingText = map.querySelector(`text[station-name="${name}"]`);
            
            if (!existingText && stationsData[name]) {
                labelBatch.push({
                    name,
                    x: coordinates.x,
                    y: coordinates.y,
                    offset: labelOffset
                });
            }
        });
    });

    let currentIndex = 0;
    const batchSize = 10;
    
    function processBatch() {
        const endIndex = Math.min(currentIndex + batchSize, labelBatch.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
            const item = labelBatch[i];
            drawLabelOnly(item.x, item.y, item.name, item.offset);
        }
        
        currentIndex = endIndex;
        
        if (currentIndex < labelBatch.length) {
            requestAnimationFrame(processBatch);
        } else {
            labelLoadingState.labelsLoaded = true;
            setTimeout(() => {
                loadPhase3_CollisionDetection();
            }, 100);
        }
    }
    
    processBatch();
}

function drawLabelOnly(x, y, name, labelOffset) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + labelOffset.x);
    text.setAttribute("y", y + labelOffset.y);
    text.textContent = name;
    text.setAttribute("station-name", name);
    text.style.cursor = "pointer";
    
    const priority = labelPriorityMap.get(name) || 1;
    text.dataset.labelPriority = priority;
    
    if (priority >= 2) {
        text.style.fontWeight = "bold";
    }
    
    text.addEventListener("click", (event) => {
        const station = stationsData[name];
        if (station) {
            showStationInfo(station.element, name, event);
        }
    });
    
    map.appendChild(text);
}

function loadPhase3_CollisionDetection() {
    labelLoadingState.phase = 'phase3';
    
    requestAnimationFrame(() => {
        performCollisionDetection();
        
        updateViewBox();
        updateZoomLimits();
        
        const stationsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        map.querySelectorAll(".station").forEach(station => {
            const nextSibling = station.nextSibling;
            if (nextSibling && nextSibling.tagName === 'text') {
                stationsGroup.appendChild(nextSibling);
            }
            stationsGroup.appendChild(station);
        });
        map.appendChild(stationsGroup);
        
        labelLoadingState.collisionDetected = true;
        labelLoadingState.phase = 'complete';
        
        if (labelLoadingState.debugMode) {
            visualizeCollisionResults();
        }
        
        console.log(`✅ 标签系统初始化完成: ${map.querySelectorAll('text').length} 个标签已加载并检测碰撞`);
    });
}

function performCollisionDetection() {
    try {
        resolveCollisions();
        checkAndHandleOverlaps();
    } catch (error) {
        console.error("碰撞检测执行错误:", error);
    }
}

function selectiveHideLabels(hideCount = null) {
    const allLabels = Array.from(map.querySelectorAll('text'));
    
    if (allLabels.length === 0) return;
    
    const labelsWithCollisions = [];
    
    allLabels.forEach(text => {
        let collisionCount = 0;
        
        allLabels.forEach(otherText => {
            if (text !== otherText && isTextsOverlapping(text, otherText)) {
                collisionCount++;
            }
        });
        
        if (collisionCount > 0) {
            labelsWithCollisions.push({
                element: text,
                collisions: collisionCount,
                priority: parseInt(text.dataset.labelPriority) || 1,
                originalOpacity: text.style.opacity || "1"
            });
        }
    });
    
    if (labelsWithCollisions.length === 0) return;
    
    labelsWithCollisions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.collisions - b.collisions;
    });
    
    const targetHideCount = hideCount || Math.ceil(labelsWithCollisions.length * 0.3);
    const toHide = labelsWithCollisions.slice(0, targetHideCount);
    
    toHide.forEach(item => {
        item.element.style.opacity = "0";
        item.element.dataset.wasAutoHidden = "true";
        hiddenLabelsByPriority.set(item.element, item.originalOpacity);
    });
    
    console.log(`🔒 选择性隐藏了 ${toHide.length} 个标签 (共 ${labelsWithCollisions.length} 个冲突标签)`);
    
    return toHide.length;
}

function restoreHiddenLabels() {
    hiddenLabelsByPriority.forEach((originalOpacity, element) => {
        if (element && element.parentNode) {
            element.style.opacity = originalOpacity || "1";
            delete element.dataset.wasAutoHidden;
        }
    });
    hiddenLabelsByPriority.clear();
    
    console.log('🔓 已恢复所有被隐藏的标签');
}

function toggleDebugMode(enabled = null) {
    labelLoadingState.debugMode = enabled !== null ? enabled : !labelLoadingState.debugMode;
    
    if (labelLoadingState.debugMode) {
        createCollisionVisualizer();
        visualizeCollisionResults();
        console.log('🔍 碰撞检测调试模式已启用');
    } else {
        removeCollisionVisualizer();
        console.log('🔍 碰撞检测调试模式已禁用');
    }
    
    return labelLoadingState.debugMode;
}

function createCollisionVisualizer() {
    removeCollisionVisualizer();
    
    labelLoadingState.collisionVisualizer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labelLoadingState.collisionVisualizer.id = "collision-debug-layer";
    labelLoadingState.collisionVisualizer.style.pointerEvents = "none";
    
    map.insertBefore(labelLoadingState.collisionVisualizer, map.firstChild);
}

function removeCollisionVisualizer() {
    if (labelLoadingState.collisionVisualizer) {
        labelLoadingState.collisionVisualizer.remove();
        labelLoadingState.collisionVisualizer = null;
    }
}

function visualizeCollisionResults() {
    if (!labelLoadingState.debugMode || !labelLoadingState.collisionVisualizer) return;
    
    labelLoadingState.collisionVisualizer.innerHTML = '';
    
    const allTexts = Array.from(map.querySelectorAll('text'));
    const collisionPairs = [];
    const lineCollisions = [];
    
    for (let i = 0; i < allTexts.length; i++) {
        for (let j = i + 1; j < allTexts.length; j++) {
            if (isTextsOverlapping(allTexts[i], allTexts[j])) {
                collisionPairs.push([allTexts[i], allTexts[j]]);
            }
        }
    }
    
    allTexts.forEach(text => {
        try {
            const bbox = text.getBBox();
            if (!bbox) return;
            
            const paddedBBox = {
                x: bbox.x - 3,
                y: bbox.y - 3,
                width: bbox.width + 6,
                height: bbox.height + 6
            };
            
            const allLines = Array.from(map.querySelectorAll('line.line'));
            for (const line of allLines) {
                if (isTextOverlappingLine(paddedBBox, line)) {
                    lineCollisions.push({ text, line });
                    break;
                }
            }
        } catch (e) {}
    });
    
    collisionPairs.forEach(([text1, text2], index) => {
        try {
            const bbox1 = text1.getBBox();
            const bbox2 = text2.getBBox();
            
            if (!bbox1 || !bbox2) return;
            
            const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect1.setAttribute("x", bbox1.x - 2);
            rect1.setAttribute("y", bbox1.y - 2);
            rect1.setAttribute("width", bbox1.width + 4);
            rect1.setAttribute("height", bbox1.height + 4);
            rect1.setAttribute("fill", "none");
            rect1.setAttribute("stroke", "#ff0000");
            rect1.setAttribute("stroke-width", "1");
            rect1.setAttribute("stroke-dasharray", "3,3");
            rect1.style.opacity = "0.6";
            
            const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect2.setAttribute("x", bbox2.x - 2);
            rect2.setAttribute("y", bbox2.y - 2);
            rect2.setAttribute("width", bbox2.width + 4);
            rect2.setAttribute("height", bbox2.height + 4);
            rect2.setAttribute("fill", "none");
            rect2.setAttribute("stroke", "#ff0000");
            rect2.setAttribute("stroke-width", "1");
            rect2.setAttribute("stroke-dasharray", "3,3");
            rect2.style.opacity = "0.6";
            
            const midX = (bbox1.x + bbox1.width / 2 + bbox2.x + bbox2.width / 2) / 2;
            const midY = (bbox1.y + bbox1.height / 2 + bbox2.y + bbox2.height / 2) / 2;
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", bbox1.x + bbox1.width / 2);
            line.setAttribute("y1", bbox1.y + bbox1.height / 2);
            line.setAttribute("x2", bbox2.x + bbox2.width / 2);
            line.setAttribute("y2", bbox2.y + bbox2.height / 2);
            line.setAttribute("stroke", "#ff6600");
            line.setAttribute("stroke-width", "1");
            line.setAttribute("stroke-dasharray", "2,2");
            line.style.opacity = "0.8";
            
            const badge = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            badge.setAttribute("cx", midX);
            badge.setAttribute("cy", midY);
            badge.setAttribute("r", "8");
            badge.setAttribute("fill", "#ff0000");
            badge.style.opacity = "0.8";
            
            labelLoadingState.collisionVisualizer.appendChild(rect1);
            labelLoadingState.collisionVisualizer.appendChild(rect2);
            labelLoadingState.collisionVisualizer.appendChild(line);
            labelLoadingState.collisionVisualizer.appendChild(badge);
        } catch (e) {}
    });
    
    lineCollisions.forEach(({ text, line }) => {
        try {
            const bbox = text.getBBox();
            if (!bbox) return;
            
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            if ([x1, y1, x2, y2].some(isNaN)) return;
            
            const warningRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            warningRect.setAttribute("x", bbox.x - 2);
            warningRect.setAttribute("y", bbox.y - 2);
            warningRect.setAttribute("width", bbox.width + 4);
            warningRect.setAttribute("height", bbox.height + 4);
            warningRect.setAttribute("fill", "none");
            warningRect.setAttribute("stroke", "#ffa500");
            warningRect.setAttribute("stroke-width", "2");
            warningRect.setAttribute("stroke-dasharray", "5,5");
            warningRect.style.opacity = "0.7";
            
            labelLoadingState.collisionVisualizer.appendChild(warningRect);
        } catch (e) {}
    });
    
    const statsText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    statsText.setAttribute("x", "20");
    statsText.setAttribute("y", "30");
    statsText.textContent = `⚠️ 标签碰撞: ${collisionPairs.length} | 线条遮挡: ${lineCollisions.length}`;
    statsText.setAttribute("fill", "#ff0000");
    statsText.setAttribute("font-size", "14");
    statsText.setAttribute("font-weight", "bold");
    
    labelLoadingState.collisionVisualizer.appendChild(statsText);
    
    console.log(`🔍 可视化结果: ${collisionPairs.length} 处标签碰撞, ${lineCollisions.length} 处线条遮挡`);
}

function getLabelSystemStats() {
    let candidatesExhaustedCount = 0;
    let relocatedCount = 0;
    let noCollisionCount = 0;
    
    labelOptimizationResults.forEach((result) => {
        if (result.candidatesExhausted) candidatesExhaustedCount++;
        if (result.wasRelocated) relocatedCount++;
        if (result.originalCollisions === 0 && !result.candidatesExhausted) noCollisionCount++;
    });
    
    return {
        state: labelLoadingState.phase,
        totalLabels: map.querySelectorAll('text').length,
        totalStations: map.querySelectorAll('.station').length,
        totalLines: map.querySelectorAll('line.line').length,
        hiddenLabelsCount: hiddenLabelsByPriority.size,
        overlapHiddenCount: overlapHiddenTexts.size,
        optimizationStats: {
            totalOptimized: labelOptimizationResults.size,
            candidatesExhausted: candidatesExhaustedCount,
            successfullyRelocated: relocatedCount,
            noCollision: noCollisionCount
        },
        cachedStates: labelStateCache.size,
        currentZoomLevel: zoomLevel,
        debugMode: labelLoadingState.debugMode,
        priorityDistribution: getPriorityDistribution()
    };
}

function getPriorityDistribution() {
    const distribution = { high: 0, normal: 0 };
    
    map.querySelectorAll('text').forEach(text => {
        const priority = parseInt(text.dataset.labelPriority) || 1;
        if (priority >= 2) {
            distribution.high++;
        } else {
            distribution.normal++;
        }
    });
    
    return distribution;
}

// ==================== 初始化流程 ====================
initializeLabelSystem();

// Pre-fill the search inputs if startPoint or endPoint is already set
if (startPoint) {
    document.getElementById("start-search").value = startPoint;
}
if (endPoint) {
    document.getElementById("end-search").value = endPoint;
}

// Initial call to update markers if points are pre-set
updateMarkers();

function showToast() {
    const Toast = document.getElementById('toast');
    Toast.style.display = 'flex';
    Toast.style.top = '12px';
}

function hideToast() {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');

    // 清除当前定时器
    if (currentToastTimer) {
        clearInterval(currentToastTimer);
        currentToastTimer = null;
    }

    // 重置队列和文本
    toastQueue = [];
    currentToastIndex = 0;
    toastText.innerText = '';

    // 隐藏弹窗
    toast.style.top = '-100px';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 300);
}

// 自定义弹窗文字内容
let toastQueue = []; // 存储待显示的消息队列
let currentToastTimer = null; // 当前正在执行的定时器
let currentToastIndex = 0; // 当前显示的行索引

function setToastText(lines) {
    // 清除当前正在进行的显示
    if (currentToastTimer) {
        clearTimeout(currentToastTimer);
        currentToastTimer = null;
    }

    // 如果是字符串，转为单行数组
    if (typeof lines === 'string') {
        lines = lines.split('\n');
    }

    // 加入队列
    toastQueue = [...lines];
    currentToastIndex = 0;

    // 立即显示第一行
    const toastText = document.getElementById('toastText');
    toastText.innerText = toastQueue[currentToastIndex];

    // 启动定时器
    currentToastTimer = setInterval(() => {
        currentToastIndex++;
        if (currentToastIndex < toastQueue.length) {
            toastText.innerText = toastQueue[currentToastIndex];
        } else {
            clearInterval(currentToastTimer);
            currentToastTimer = null;
            hideToast(); // 所有行显示完毕后隐藏
        }
    }, 1500); // 每行显示1.5秒
}

// 初始化图例内容
function initializeLegend() {
    const lineLegend = document.getElementById('line-legend');
    
    // 清空现有图例
    lineLegend.innerHTML = '';
    
    // 生成线路图例
    Object.values(lines).forEach(line => {
        if (isTransparentColor(line.color)) return; // 跳过透明色线路

        const lineItem = document.createElement('div');
        lineItem.className = 'line-item';
        
        const lineColor = document.createElement('div');
        lineColor.className = 'line-color';
        lineColor.style.backgroundColor = line.color;
        
        const lineName = document.createElement('span');
        lineName.textContent = line.name;
        
        lineItem.appendChild(lineColor);
        lineItem.appendChild(lineName);
        lineLegend.appendChild(lineItem);
    });
}

function showLegend() {
    const legendContainer = document.getElementById('legend-container');
    if (legendContainer.style.display === 'none') {
        legendContainer.style.display = 'block';
    } else {
        legendContainer.style.display = 'none';
    }
}

function isTransparentColor(color) {
    return /^#[0-9A-Fa-f]{6}00$/.test(color); // 匹配以#000000开头的颜色（如#00000000等）
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeLegend();
    initZoomLimitSystem();
    
    // 检查localStorage中是否有查询信息
    const tripId = localStorage.getItem('metroTransferQuery');
    if (tripId) {
        try {
            const savedOrders = localStorage.getItem('orders');
            if (savedOrders) {
                const orders = JSON.parse(savedOrders);
                const trip = orders.find(order => order.id === tripId);
                if (trip) {
                    // 等待一小段时间确保地图和数据都已加载
                    setTimeout(() => {
                        // 设置起点和终点
                        setStartPoint(trip.route.departure);
                        setTimeout(() => {
                            setEndPoint(trip.route.arrival);
                            
                            // 计算起点和终点的中心点
                            const startStation = stationsData[trip.route.departure];
                            const endStation = stationsData[trip.route.arrival];
                            /*if (startStation && endStation) {
                                // 计算中心点
                                const centerX = (startStation.x + endStation.x) / 2;
                                const centerY = (startStation.y + endStation.y) / 2;
                                
                                // 计算起点和终点之间的距离
                                const distance = Math.sqrt(
                                    Math.pow(endStation.x - startStation.x, 2) + 
                                    Math.pow(endStation.y - startStation.y, 2)
                                );
                                
                                // 根据距离调整缩放级别
                                zoomLevel = Math.min(2, Math.max(0.5, 400 / distance));
                                
                                // 设置偏移量，使中心点位于视图中心
                                offsetX = window.innerWidth / 2 - centerX * zoomLevel;
                                offsetY = window.innerHeight / 2 - centerY * zoomLevel;
                                
                                // 更新视图
                                updateTransform();
                            }*/
                        }, 100);
                    }, 100);
                    return; // 如果找到并处理了行程，就不再处理其他参数
                }
            }
        } catch (error) {
            console.error('读取行程数据失败:', error);
        }
    }
    
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const stationName = urlParams.get('station');
    const action = urlParams.get('action');
    
    if (stationName) {
        // 等待一小段时间确保地图和数据都已加载
        setTimeout(() => {
            const station = stationsData[stationName];
            if (station) {
                // 设置缩放级别
                zoomLevel = 1.5;
                
                // 计算偏移量，使站点位于视图中心
                offsetX = window.innerWidth / 2 - station.x * zoomLevel;
                offsetY = window.innerHeight / 2 - station.y * zoomLevel;
                
                // 更新视图
                updateTransform();
                
                // 根据 action 参数执行相应操作
                if (action === 'start') {
                    setStartPoint(stationName);
                } else if (action === 'end') {
                    setStartPoint(stationName); // 如果没有起点，先设置起点
                    setTimeout(() => {
                        setEndPoint(stationName); // 然后设置终点
                    }, 100);
                } else {
                    // 显示站点信息
                    showStationInfo(null, stationName);
                    
                    // 高亮显示站点
                    station.element.style.fill = '#2c9678';
                    setTimeout(() => {
                        station.element.style.fill = '';
                    }, 2000);
                }
            } else {
                setToastText("未找到该站点");
                showToast();
                setTimeout(() => hideToast(), 2000);
            }
        }, 100);
    }
});

// 根据站名查找站点
function findStationByName(name) {
    for (const line of Object.values(lines)) {
        for (const station of line.stations) {
            if (station.name === name) {
                return station;
            }
        }
    }
    return null;
}

function hideLegend() {
    document.getElementById('legend-container').style.display = 'none';
    document.getElementById('background').style.display = 'none';
}

function saveAsImage() {
    const routeResult = document.getElementById('route-result');
    const lineSummary = document.getElementById('line-summary');
    const shareButtons = routeResult.querySelector('.share-buttons');
    const imageFooter = document.getElementById('image-footer');
    const closeButton = routeResult.querySelector('.close-button');
    
    // 添加导出专用CSS类
    lineSummary.classList.add('exporting');
    
    // 临时移除高度限制
    lineSummary.style.maxHeight = 'none';
    routeResult.style.maxHeight = 'none';
    
    // 获取当前选中的路线类型
    const routeSelector = document.querySelector('.route-selector');
    const selectedButton = routeSelector.querySelector('button.selected');
    const routeType = selectedButton ? selectedButton.textContent : '推荐路线';
    
    // 生成文件名
    const fileName = `${startPoint}→${endPoint} ${routeType}.png`;
    
    // 临时隐藏不需要的元素，显示底部区域
    closeButton.style.display = 'none';
    shareButtons.style.display = 'none';
    imageFooter.style.display = 'block';
    
    html2canvas(routeResult, {
        backgroundColor: 'transparent',
        scale: 2,
        useCORS: true,
        logging: false,
    }).then(canvas => {
        // 恢复原始状态
        lineSummary.classList.remove('exporting');
        lineSummary.style.maxHeight = '';
        routeResult.style.maxHeight = '';
        
        closeButton.style.display = 'block';
        shareButtons.style.display = 'flex';
        imageFooter.style.display = 'none';
        
        // 下载图片
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        setToastText("图片已保存");
        showToast();
        setTimeout(() => hideToast(), 2000);
    }).catch(error => {
        console.error('保存图片失败:', error);
        // 恢复样式
        lineSummary.classList.remove('exporting');
        setToastText("保存失败，请重试");
        showToast();
        setTimeout(() => hideToast(), 2000);
    });
}

// 显示添加行程对话框
function showAddTripDialog() {
    const dialog = document.getElementById('add-trip-dialog');
    const timeInput = document.getElementById('trip-time');
    
    // 设置默认时间为当前时间后30分钟
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // 默认设置为30分钟后
    
    // 使用toLocaleString来获取本地时间格式，然后转换为datetime-local所需的格式
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    timeInput.value = defaultTime;
    dialog.style.display = 'flex';
}

// 隐藏添加行程对话框
function hideAddTripDialog() {
    const dialog = document.getElementById('add-trip-dialog');
    dialog.style.display = 'none';
}

// 添加行程提醒
function addTripReminder() {
    const timeInput = document.getElementById('trip-time');
    const timeType = document.querySelector('input[name="timeType"]:checked').value;
    const selectedTime = new Date(timeInput.value);
    
    // 获取路线信息
    const lineSummary = document.getElementById('line-summary');
    const fareZoneSummary = document.getElementById('fare-zone-summary');
    const paragraphs = lineSummary.querySelectorAll('p');
    
    // 提取起点和终点
    let departure = '';
    let arrival = '';
    let lines = [];
    let actualRunningTime = 0;
    let totalWaitingTime = 0;
    
    paragraphs.forEach(p => {
        if (p.className === 'start') {
            departure = p.textContent.replace('站 出发', '');
        } else if (p.className === 'end') {
            arrival = p.textContent.replace('到达 ', '').replace('站', '');
        } else if (p.className === 'line-stations') {
            const lineText = p.textContent.split(' ')[0]; // 获取线路名称
            lines.push(lineText);
        }
    });
    
    // 从fareZoneSummary中提取总用时信息和票价信息
    const timeInfo = fareZoneSummary.textContent;
    const totalTimeMatch = timeInfo.match(/总用时 (\d+) 分钟/);
    const totalJourneyTime = totalTimeMatch ? parseInt(totalTimeMatch[1]) : 0;
    const fare = fareZoneSummary.textContent.match(/票价 (\d+) 元/)[1];
    
    if (!departure || !arrival) {
        alert('无效的路线信息');
        return;
    }
    
    // 根据时间类型处理时间
    let tripTime = selectedTime;
    let arrivalTime = selectedTime;
    if (timeType === 'arrival') {
        // 如果是到达时间，计算最晚出发时间
        tripTime = new Date(selectedTime.getTime() - totalJourneyTime * 60000); // 转换为毫秒
    }
    
    // 生成唯一ID
    const tripId = 'metro_' + Date.now();
    
    // 获取当前选中的路线类型
    const routeSelector = document.querySelector('.route-selector');
    const selectedButton = routeSelector.querySelector('button.selected');
    const routeType = selectedButton ? selectedButton.textContent : '推荐路线';
    
    // 创建行程对象
    const trip = {
        id: tripId,
        type: 'metro',
        date: tripTime.toISOString().split('T')[0],
        status: 'upcoming',
        route: {
            departure,
            arrival,
            time: tripTime.toTimeString().slice(0, 5),
            arrivalTime: arrivalTime.toTimeString().slice(0, 5), // 添加预计到达时间
            id: '',
            line: lines.join('→'),
            company: `地铁换乘查询·${routeType}`,
            price: fare
        },
        lines: window.location.hash.slice(1) || lines.join(',')
    };
    
    // 获取现有行程
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        orders = savedOrders ? JSON.parse(savedOrders) : [];
    } catch (error) {
        console.error('读取行程数据失败:', error);
    }
    
    // 添加新行程
    orders.push(trip);
    
    // 保存到localStorage
    try {
        localStorage.setItem('orders', JSON.stringify(orders));
        hideAddTripDialog();
        setToastText(timeType === 'arrival' ? `已添加行程(出发时间${trip.route.time})` : `已添加行程(预计到达${trip.route.arrivalTime})`);
        showToast();
        setTimeout(() => hideToast(), 3000);
    } catch (error) {
        console.error('保存行程失败:', error);
        alert('保存行程失败，请重试');
    }
}

// 将函数暴露给全局作用域
window.showAddTripDialog = showAddTripDialog;
window.hideAddTripDialog = hideAddTripDialog;
window.addTripReminder = addTripReminder;
window.showFareDetail = showFareDetail;
window.showTimeDetail = showTimeDetail;

// 添加显示票价详情的函数
// 修改 showFareDetail 函数以适配新逻辑
function showFareDetail(fareData) {
    console.log('showFareDetail', fareData);

    if (!fareData || !Array.isArray(fareData.segments) || fareData.segments.length === 0) {
        setToastText('无计费区段信息');
        showToast();
        setTimeout(() => hideToast(), 3000);
        return;
    }

    const details = fareData.segments.map((segment, index) => {
        const km = (segment.distance / 1000).toFixed(1);
        //return `第${index + 1}段：${km}公里，票价${segment.fare}元`;
        return `计费里程${km}公里`;
    });

    const total = `总计：${fareData.total}元`;

    setToastText([total, ...details]);
    showToast();
    setTimeout(() => hideToast(), 5000);
}

// 添加显示时间详情的函数
function showTimeDetail(runningTime, waitingTime) {
    let details = [`运行时间${runningTime}分钟`];
    if (waitingTime > 0) {
        details.push(`换乘等候${waitingTime}分钟`);
    }
    setToastText(details.join(' + '));
    showToast();
    setTimeout(() => hideToast(), 3000);
}
