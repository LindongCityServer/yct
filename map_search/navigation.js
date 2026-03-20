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
        console.log('处理道路路径显示和导航逻辑', marker);
        markers = getRoadMarkersByText(marker.image, 'highway');
    }
    else markers = getRoadMarkersByText(marker.text);
    console.log('获取与', marker.text, '同名的道路标记', markers);
    const path = createPath(markers);
    displayPath(path, marker.image.includes('highway-')?marker.image:marker.text);
}

function getRoadMarkersByText(text, type = 'roadpoint') {
    const markers = window.markers || [];
    console.log('获取与', text, '同名的道路标记', markers.filter(marker => marker.text === text && marker.image === 'road.png'), markers.filter(marker => marker.image === text));
    let filteredMarkers = [];
    switch (type) {
        case 'highway':
            filteredMarkers = markers.filter(marker => marker.image === text);
        default:
            filteredMarkers = markers.filter(marker =>(
                (marker.text === text && marker.image === 'roadpoint.png') ||
                (marker.text === text && marker.image === 'road.png')
            ));
    }
    // 对filteredMarkers进行最近邻贪心排序
    const sortedMarkers = nearestNeighborSort(filteredMarkers);
    return sortedMarkers;
}

function nearestNeighborSort(points) {
    if (points.length === 0) return [];
    
    // 复制一份，避免修改原数组
    const unvisited = points.map(p => ({ ...p }));
    const sorted = [];
    
    // 选择起点：选择x和z最小的点作为起点（先按x排序，x相同时按z排序）
    unvisited.sort((a, b) => {
        if (a.x !== b.x) {
            return a.x - b.x;
        }
        return a.z - b.z;
    });
    sorted.push(unvisited.shift()); // 第一个点作为起点
    
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