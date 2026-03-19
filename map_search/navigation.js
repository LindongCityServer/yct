// 道路路径处理和导航逻辑

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
    let path = [];
    markers.forEach(marker => { 
        // 根据marker.x和marker.z创建路径
        path.push([marker.x, marker.z]);
    });
    displayPath(path);
}

function getRoadMarkersByText(text, type = 'road') {
    const markers = window.markers || [];
    console.log('获取与', text, '同名的道路标记', markers.filter(marker => marker.text === text && marker.image === 'road.png'), markers.filter(marker => marker.image === text));
    switch (type) {
        case 'highway':
            return markers.filter(marker => marker.image === text);
        default:
            return markers.filter(marker => marker.text === text && marker.image === 'road.png');
    }
}

function displayPath(path) {
    // 根据path在svg对象中画一条折线
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    console.log('绘制路径', path);

    const minX = Math.min(...path.map(p => p[0]));
    const minZ = Math.min(...path.map(p => p[1]));
    const maxX = Math.max(...path.map(p => p[0]));
    const maxZ = Math.max(...path.map(p => p[1]));
    
    line.setAttribute("points", path.map(point => (point[0]-minX) + ',' + (point[1]-minZ)).join(' '));
    line.style.stroke = "yellow";
    line.style.strokeWidth = 16/window.zoomLevel;
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    svg.style.display = "block";
    svg.style.position = "absolute";
    svg.setAttribute("width", `${maxX - minX + 1}px`);
    svg.setAttribute("height", `${maxZ - minZ + 1}px`);
    svg.setAttribute("viewPort", `${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`);
    const tileContainer = document.querySelector('.tile-container');
    const oldSvg = tileContainer.querySelectorAll('svg');
    oldSvg.forEach(svg => tileContainer.removeChild(svg));
    tileContainer.appendChild(svg);
    console.log('路径绘制完成', svg);
}

// 导出为window全局变量
window.handleRoadPathDisplay = handleRoadPathDisplay;