// 道路路径处理和导航逻辑
function getCurrentLocation() {
    const xInput = document.getElementById('coordinates-x');
    const zInput = document.getElementById('coordinates-z');
    return {x: xInput.value, z: zInput.value};
}

function handleRoadPathDisplay(marker) {
    console.log('处理道路路径显示和导航逻辑');
    let markers;
    // 获取与marker.text同名的所有标记
    if (marker.image.includes('highway-')) {
        console.log('处理高速公路路径，即将调用getRoadMarkersByText', marker);
        markers = getRoadMarkersByText(marker.image, 'highway');
    }
    else markers = getRoadMarkersByText(marker.text);
    //console.log('获取与', marker.text, '同名的道路标记', markers);
    const path = createPath(markers);
    displayPath(path, marker.image.includes('highway-')?marker.image:marker.text);
}

function getRoadMarkersByText(text, type = 'roadpoint') {
    const markers = window.markers || [];
    let filteredMarkers;
    switch (type) {
        case 'highway':
            console.log('处理高速公路路径，即将赋值filteredMarkers', markers.filter(marker => marker.image === text));
            filteredMarkers = markers.filter(marker => marker.image === text);
            break;
        default:
            filteredMarkers = markers.filter(marker =>(
                (marker.text === text && marker.image === 'roadpoint.png') ||
                (marker.text === text && marker.image === 'road.png')
            ));
    }
    console.log('获取与', text, '同名的道路标记', filteredMarkers);
    // 对filteredMarkers进行最近邻贪心排序
    const sortedMarkers = nearestNeighborSort(filteredMarkers);
    return sortedMarkers;
}

function nearestNeighborSort(points) {
    if (points.length === 0) return [];
    
    // 复制一份，避免修改原数组
    const unvisited = points.map(p => ({ ...p }));
    const sorted = [];
    
    // 计算x和z的差距
    const xValues = unvisited.map(p => p.x);
    const zValues = unvisited.map(p => p.z);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const zRange = Math.max(...zValues) - Math.min(...zValues);
    
    // 根据差距大小决定排序依据，并确保选择的点image为'roadpoint.png'
    let startPoint;
    if (xRange > zRange) {
        // x差距更大，按x排序选择最小x的点
        const roadpointMarkers = unvisited.filter(p => p.image === 'roadpoint.png');
        if (roadpointMarkers.length > 0) {
            roadpointMarkers.sort((a, b) => a.x - b.x);
            startPoint = roadpointMarkers[0];
        } else {
            // 如果没有roadpoint.png的标记，使用原来的逻辑
            unvisited.sort((a, b) => a.x - b.x);
            startPoint = unvisited[0];
        }
    } else {
        // z差距更大或相等，按z排序选择最小z的点
        const roadpointMarkers = unvisited.filter(p => p.image === 'roadpoint.png');
        if (roadpointMarkers.length > 0) {
            roadpointMarkers.sort((a, b) => a.z - b.z);
            startPoint = roadpointMarkers[0];
        } else {
            // 如果没有roadpoint.png的标记，使用原来的逻辑
            unvisited.sort((a, b) => a.z - b.z);
            startPoint = unvisited[0];
        }
    }
    
    // 从unvisited中移除选中的起点
    const startIndex = unvisited.findIndex(p => p.x === startPoint.x && p.z === startPoint.z && p.image === startPoint.image);
    if (startIndex !== -1) {
        sorted.push(unvisited.splice(startIndex, 1)[0]);
    } else {
        // 如果找不到完全匹配的点（理论上不应该发生），使用第一个点
        sorted.push(unvisited.shift());
    }
    
    while (unvisited.length > 0) {
        const current = sorted[sorted.length - 1];
        // 在剩余点中找距离 current 最近的点
        let nearestIdx = 0;
        let minDist = distance(current, unvisited[0]);
        for (let i = 1; i < unvisited.length; i++) {
            const dist = distance(current, unvisited[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        // 将最近点加入排序结果，并从 unvisited 中移除
        sorted.push(unvisited[nearestIdx]);
        unvisited.splice(nearestIdx, 1);
    }
    return sorted;
}

function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function createPath(markers) { 
    let path = [];
    markers.forEach(marker => { 
        // 根据marker.x和marker.z创建路径
        path.push([marker.x, marker.z]);
    });
    return path;
}

function displayPath(path, name) {
    // 根据path在svg对象中画一条折线
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    console.log('绘制路径', path);

    const minX = Math.min(...path.map(p => p[0]));
    const minZ = Math.min(...path.map(p => p[1]));
    const maxX = Math.max(...path.map(p => p[0]));
    const maxZ = Math.max(...path.map(p => p[1]));
    
    line.setAttribute("points", path.map(point => (point[0]-minX+300) + ',' + (point[1]-minZ+300)).join(' '));
    line.style.stroke = "aquamarine";
    line.style.strokeWidth = 16/window.zoomLevel;
    line.style.mixBlendMode = "overlay";
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    svg.style.display = "block";
    svg.style.position = "absolute";
    svg.setAttribute("width", `${maxX - minX + 600}px`);
    svg.setAttribute("height", `${maxZ - minZ + 600}px`);
    svg.setAttribute("viewPort", `${minX - 300} ${minZ - 300} ${maxX - minX + 600} ${maxZ - minZ + 600}`);
    svg.setAttribute("data-name", name);
    const tileContainer = document.querySelector('.tile-container');
    const oldSvg = tileContainer.querySelectorAll('svg');
    oldSvg.forEach(svg => tileContainer.removeChild(svg));
    tileContainer.appendChild(svg);
    console.log('路径绘制完成', svg);
}

// 导出为window全局变量
window.handleRoadPathDisplay = handleRoadPathDisplay;
window.getRoadMarkersByText = getRoadMarkersByText;
window.createPath = createPath;