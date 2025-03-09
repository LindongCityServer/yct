// bus_stop.js
import { busRoutes } from '../data/bus_data.js';

// 填充线路选项
function populateLineOptions() {
    const lineSelect = document.getElementById('line');
    for (const [lineId, route] of Object.entries(busRoutes)) {
        const option = document.createElement('option');
        option.value = lineId;
        option.textContent = route.name;
        lineSelect.appendChild(option);
    }
    if (lineSelect.options.length > 1) {
        lineSelect.selectedIndex = 1; // 默认选中第二个选项（索引从0开始）
        updateDirectionOptions(); // 触发后续更新
    }
    updateDirectionOptions();
    updateStationOptions();
    generateBusStop();
}

// 更新方向选项
function updateDirectionOptions() {
    const directionSelect = document.getElementById('direction');
    directionSelect.innerHTML = '<option value="">请选择方向</option>';
    const selectedLineId = document.getElementById('line').value;
    const selectedRoute = busRoutes[selectedLineId];
    if (selectedRoute && selectedRoute.stations) {
        // 获取起点和终点
        const stations = selectedRoute.stations;
        const fromStation = stations[0].name;
        const toStation = stations[stations.length - 1].name;

        // 添加正向方向选项
        const directionDescription = getRouteDirection(selectedLineId, fromStation, toStation);
        const optionDown = document.createElement('option');
        optionDown.value = 'down';
        optionDown.textContent = `${directionDescription}`;
        directionSelect.appendChild(optionDown);

        // 添加反向方向选项
        const reverseDescription = getRouteDirection(selectedLineId, toStation, fromStation);
        const optionUp = document.createElement('option');
        optionUp.value = 'up';
        optionUp.textContent = `${reverseDescription}`;
        directionSelect.appendChild(optionUp);
    }
    if (directionSelect.options.length > 1) {
        directionSelect.selectedIndex = 1;
        updateStationOptions();
    }
    updateStationOptions();
    generateBusStop();
}

// 更新站点选项
function updateStationOptions() {
    const stationSelect = document.getElementById('station');
    stationSelect.innerHTML = '<option value="">请选择站点</option>';
    const selectedLineId = document.getElementById('line').value;
    const selectedDirection = document.getElementById('direction').value; // 'down'或'up'
    const selectedRoute = busRoutes[selectedLineId];
    if (selectedRoute && selectedRoute.stations) {
        let stations = selectedRoute.stations;
        // 根据方向过滤站点
        if (selectedDirection === 'down') {
            // 下行方向包含 oneWay为down或无oneWay的站点
            stations = stations.filter(station => !station.oneWay || station.oneWay === 'down');
        } else if (selectedDirection === 'up') {
            // 上行方向包含 oneWay为up或无oneWay的站点，并反转顺序
            stations = stations.filter(station => !station.oneWay || station.oneWay === 'up');
            stations = stations.slice().reverse();
        }
        // 处理环线特殊情况
        if (selectedRoute.circularDirection) {
            // 移除最后一个重复的站点
            stations = stations.slice(0, -1);
            // 根据环线方向调整顺序
            if (selectedRoute.circularDirection === 'clockwise') {
                // 内环保持原顺序
                if (selectedDirection === 'up') stations = stations.slice().reverse();
            } else {
                // 外环需要反转
                if (selectedDirection === 'down') stations = stations.slice().reverse();
            }
        }
        // 生成选项
        stations.forEach(station => {
            const option = document.createElement('option');
            option.value = station.name; // 使用站点名称作为值
            option.textContent = station.name;
            stationSelect.appendChild(option);
        });
    }
    if (stationSelect.options.length > 1) {
        stationSelect.selectedIndex = 1;
    }
    generateBusStop();
}

// 获取线路方向描述
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
            return '（环一路）'; // 上行方向
        } else if (downFromIndex !== -1 && downToIndex !== -1 && downFromIndex > downToIndex) {
            return '（环二路）'; // 下行方向
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
    
    console.warn('Direction could not be determined for routeId:', routeId, 'fromStation:', fromStation, 'toStation:', toStation);
    return '';
}

// 新增字符宽度计算函数
function calculateCharWidth(str) {
    return Array.from(str).reduce((sum, char) => {
        return sum + (/[^\x00-\xff]/.test(char) ? 2 : 1);
    }, 0);
}

// 在bus_stop.js中添加时间计算函数
function calculateStationOperationTime(routeId, stationName) {
    const route = busRoutes[routeId];
    if (!route) return null;

    const upwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'down');
    const downwardStations = route.stations.filter(station => !station.oneWay || station.oneWay === 'up');

    const upwardIndex = upwardStations.findIndex(s => s.name === stationName);
    const downwardIndex = downwardStations.findIndex(s => s.name === stationName);

    const { first, last } = route.firstLastBus;
    const { first: firstUpwards, last: lastUpwards } = route.firstLastBusUpwards ? route.firstLastBusUpwards : route.firstLastBus;
    console.log('读取首末班车时间数据：\n下行：', first, '-', last, '\n上行：', firstUpwards, '-', lastUpwards, '\n');

    // 计算上行方向时间（假设每站2分钟）
    let upwardTime = null;
    if (upwardIndex !== -1) {
        const timeOffset = 0;
        // timeOffset = upwardIndex * 2;
        upwardTime = {
            first: addMinutes(first, timeOffset),
            last: addMinutes(last, timeOffset)
        };
    }

    // 计算下行方向时间（从终点站倒推）
    let downwardTime = null;
    if (downwardIndex !== -1) {
        const timeFromEnd = 0;
        // timeFromEnd = (downwardStations.length - 1 - downwardIndex) * 2;
        downwardTime = {
            first: addMinutes(firstUpwards, timeFromEnd),
            last: addMinutes(lastUpwards, timeFromEnd)
        };
    }

    return {
        upward: downwardTime,
        downward: upwardTime
    };
}

// 时间加法辅助函数
function addMinutes(timeStr, minutesToAdd) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newMinutes = minutes + minutesToAdd;
    const totalMinutes = hours * 60 + newMinutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${String(newHours % 24).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function generateBusStop() {
    const selectedLineId = document.getElementById('line').value;
    const selectedDirection = document.getElementById('direction').value;
    const selectedStationId = document.getElementById('station').value;
    const textLayer = document.querySelector('.text-layer');
    textLayer.innerHTML = '';

    const selectedRoute = busRoutes[selectedLineId];
    if (selectedRoute && selectedRoute.stations) {
        // 在generateBusStop函数内修改：
        let stations = Array.from(document.getElementById('station').options); // 转换为数组
        const selectedStationId = document.getElementById('station').value; // 获取当前选中值
        const selectedStationIndex = stations.findIndex(s => s.value === selectedStationId); // 通过value匹配
        const nextStation = stations[selectedStationIndex + 1] || { textContent: '终    点' }; // 使用textContent获取显示名称

        // 处理起点方向文本
        const startStation = stations[1].textContent;
        const isStartMatch = startStation === selectedStationId;
        const line3Class = isStartMatch ? 'direction-text selected' : 'direction-text';
        const line3ColorCode = isStartMatch ? '§4' : '§1';

        // 处理终点方向文本
        const endStation = stations[stations.length - 1].textContent;
        const isEndMatch = endStation === selectedStationId;
        const line4Class = isEndMatch ? 'direction-text selected' : 'direction-text';
        const line4ColorCode = isEndMatch ? '§4' : '§1';

        // 后续使用时应取textContent：
        const nextStationName = nextStation.textContent || '终    点';

        // 计算字符宽度
        const routeId = selectedLineId;
        const routeIdWidth = calculateCharWidth(routeId);
        const nextStationWidth = calculateCharWidth(nextStationName);
        const currentLength = routeIdWidth + nextStationWidth;

        // 空格计算
        const totalWidth = 20;
        const totalSpaces = Math.max(0, totalWidth - currentLength); // 防止负数
        const spacesOdd = '&nbsp;'.repeat(Math.floor(totalSpaces / 2));
        const spacesEven = '&nbsp;'.repeat(Math.ceil(totalSpaces / 2));

        // 计算该站点的实际首末车时间
        const operationTime = calculateStationOperationTime(selectedLineId, selectedStationId);
        let firstTime, lastTime;
        if (selectedDirection === 'down') {
            firstTime = operationTime.downward?.first || selectedRoute.firstLastBusUpwards.first;
            lastTime = operationTime.downward?.last || selectedRoute.firstLastBusUpwards.last;
        } else {
            firstTime = operationTime.upward?.first || selectedRoute.firstLastBus.first;
            lastTime = operationTime.upward?.last || selectedRoute.firstLastBus.last;
        }

        // 调试输出
        //console.log('计算后的时间:', firstTime, lastTime);
        //console.log('原始时间:', selectedRoute.firstLastBus.first, selectedRoute.firstLastBus.last);

        // 更新显示内容
        const lines = [
            `<span class="route-id">${routeId}</span>${spacesEven}<span class="next-station">${nextStationName}</span>${spacesOdd}`,
            `<span class="schedule-time">首末车时间:${firstTime}-${lastTime}</span>`,
            `<span class="${line3Class}">${startStation}<span class="arrow"> →</span></span>`,
            `<span class="${line4Class}">${endStation}</span>`
        ];

        // 更新复制文本
        const line2 = `§f首末车时间:${firstTime}-${lastTime}`;
        const line1 = `§f§l${routeId}§r${spacesEven.replace(/&nbsp;/g, ' ')}§4${nextStationName}${spacesOdd.replace(/&nbsp;/g, ' ')}`;
        const line3 = `${line3ColorCode}${startStation}§4 →`;
        const line4 = `${line4ColorCode}${endStation}`;
        window.copyText = [line1, line2, line3, line4].join('\n');

        // 渲染文本层
        lines.forEach(line => {
            const p = document.createElement('p');
            p.style.textAlign = 'center';
            p.innerHTML = line;
            textLayer.appendChild(p);
        });
    }
}

// 新增copyContent函数
async function copyContent() {
    //showToast('正在复制内容...');
    if (!window.copyText) {
        showToast('无内容可复制');
        return;
    }

    try {
        await navigator.clipboard.writeText(window.copyText);
        showToast('内容已复制到剪贴板');
    } catch (err) {
        console.error('现代API失败:', err);
        // 尝试降级方案
        fallbackCopy(window.copyText);
        showToast('内容已复制（备用方案）');
    }
}

// 降级方案函数
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// 因不存在对应指令，改为复制并跳转到下一站功能
function copyCommand() {
    copyContent(); // 先执行复制
    console.log('复制并跳转到下一站');

    setTimeout(() => {
        const stationSelect = document.getElementById('station');
        if (stationSelect.options.length > 1) {
            const selectedIndex = stationSelect.selectedIndex;
            const nextIndex = (selectedIndex + 1) % stationSelect.options.length;
            stationSelect.selectedIndex = nextIndex;
            generateBusStop();
        }
    }, 0);
}

// 保存图片按钮功能
function downloadImage() {
    const previewContainer = document.querySelector('.preview-container');
    html2canvas(previewContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'bus_stop_sign.png';
        link.click();
    });
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    populateLineOptions();
    document.getElementById('line').addEventListener('change', updateDirectionOptions);
    document.getElementById('direction').addEventListener('change', updateStationOptions);
    document.getElementById('station').addEventListener('change', generateBusStop);
    document.getElementById('line').addEventListener('change', generateBusStop);
    document.getElementById('direction').addEventListener('change', generateBusStop);
    document.getElementById('copy-content').addEventListener('click', copyContent);
    document.getElementById('copy-action').addEventListener('click', copyCommand);
    document.getElementById('download-button').addEventListener('click', downloadImage);
    //navigator.clipboard.writeText('测试').then(() => showToast('浏览器支持剪贴板功能'), () => showToast('浏览器不支持剪贴板功能'));
});