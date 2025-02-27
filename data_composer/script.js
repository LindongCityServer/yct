// 全局变量
let lines = [];
let stationDetails = [];
let nextLineNumber = 1;
const lineNumberMap = new Map(); // 用于存储每条线路的下一个车站编号

// 默认线路颜色
const defaultLineColors = [
    '#ed3321', // 1号线 - 红色
    '#fb8b05', // 2号线 - 橙色
    '#ec7696', // 3号线 - 粉红色
    '#983680', // 4号线 - 紫色
    '#82111f', // 5号线 - 深红色
    '#fcc307', // 6号线 - 黄色
    '#229453', // 7号线 - 绿色
    '#de3f7c', // 8号线 - 玫红色
    '#2ea9df', // 9号线 - 蓝色
    '#96c24e'  // 10号线 - 浅绿色
];

// 生成随机颜色函数
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 颜色值转换函数
function convertColorToHex(color) {
    // 如果已经是十六进制格式，直接返回
    if (color.startsWith('#')) {
        return color;
    }
    
    // 处理 rgb/rgba 格式
    if (color.startsWith('rgb')) {
        const rgbMatch = color.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
            const r = parseInt(rgbMatch[0]);
            const g = parseInt(rgbMatch[1]);
            const b = parseInt(rgbMatch[2]);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    }
    
    // 如果无法解析，返回默认黑色
    return '#000000';
}

// DOM元素
const metroLogoInput = document.getElementById('metro-logo');
const logoPreview = document.getElementById('logo-preview');
const addLineButton = document.getElementById('add-line');
const linesContainer = document.getElementById('lines-container');
const exportButton = document.getElementById('export-data');
const exportButtonMobile = document.getElementById('export-data-mobile');
const importFileInput = document.getElementById('import-file');
const importFileInputMobile = document.getElementById('import-file-mobile');
const showAdvancedToggle = document.getElementById('show-advanced');
const showStationSectionToggle = document.getElementById('show-station-section');

// 搜索功能
const searchButton = document.getElementById('search-button');
const searchOverlay = document.querySelector('.search-overlay');
const searchInput = document.getElementById('search-input');
const closeSearch = document.getElementById('close-search');

// 在搜索相关变量声明后添加
const prevResultBtn = document.getElementById('prev-result');
const nextResultBtn = document.getElementById('next-result');
const searchCountSpan = document.querySelector('.search-count');
let currentSearchResults = [];
let currentResultIndex = -1;

// 在搜索相关变量声明后添加
const searchButtonMobile = document.getElementById('search-button-mobile');

// 在 DOM 元素声明区域添加
const metroNameInput = document.getElementById('metro-name');
const metroNameEnInput = document.getElementById('metro-name-en');

// 预览功能相关变量
const previewToolbar = document.querySelector('.preview-toolbar');
const previewOverlay = document.querySelector('.preview-overlay');
const togglePreviewBtn = document.getElementById('toggle-preview');
const closePreviewBtn = document.getElementById('close-preview');
const previewFrame = document.getElementById('preview-frame');

// 修改拖放区域相关代码
document.body.addEventListener('dragover', function(e) {
    // 检查是否是文件拖放
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('Files')) {
        // 如果正在进行元素拖拽，则不显示文件拖放提示
        if (!document.querySelector('.line-item.dragging, .station-item.dragging')) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.add('dragging');
        }
    }
});

document.body.addEventListener('dragleave', function(e) {
    // 确保鼠标真的离开了文档
    const rect = document.body.getBoundingClientRect();
    if (e.clientX <= rect.left || 
        e.clientX >= rect.right || 
        e.clientY <= rect.top || 
        e.clientY >= rect.bottom) {
        document.body.classList.remove('dragging');
    }
});

document.body.addEventListener('drop', function(e) {
    // 检查是否是文件拖放
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('Files')) {
        // 如果正在进行元素拖拽，则不处理文件拖放
        if (!document.querySelector('.line-item.dragging, .station-item.dragging')) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.remove('dragging');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.js')) {
                    importData(file);
                } else {
                    showToast('请拖入JS文件');
                }
            }
        }
    }
});

// 修改高级选项开关事件
showAdvancedToggle.addEventListener('change', function() {
    document.body.classList.toggle('show-advanced', this.checked);
    if (!this.checked && previewOverlay.classList.contains('active')) {
        previewOverlay.classList.remove('active');
    }
});

// 车站剖面图开关
showStationSectionToggle.addEventListener('click', function(e) {
    e.preventDefault(); // 阻止默认的切换行为
    showToast('车站剖面图编辑功能即将上线');
});

// 折叠/展开功能
function toggleExpand(element) {
    element.classList.toggle('expanded');
}

// 编辑功能
function toggleEdit(input, button, textElement) {
    const isEditing = input.classList.toggle('editing');
    input.readOnly = !isEditing;
    button.querySelector('img').src = isEditing ? '../UI/res/done_black.png' : '../UI/res/edit_black.png';
    
    // 切换文本显示状态
    textElement.classList.toggle('hidden', isEditing);
    
    if (isEditing) {
        input.focus();
        input.dataset.previousValue = input.value;
    } else {
        if (!input.value.trim()) {
            input.value = input.dataset.previousValue || '';
        }
        textElement.textContent = input.value;
    }
}

// 修改初始化拖拽事件监听器
function initDraggableItem(item) {
    const lineDragHandle = item.querySelector('.line-drag-handle');
    if (lineDragHandle) {
        lineDragHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            item.draggable = true;
            item.classList.add('dragging-line');
        });
        
        item.addEventListener('dragend', () => {
            item.draggable = false;
            item.classList.remove('dragging-line');
        });
    }
}

// 修改拖拽排序功能
function initDragAndDrop() {
    const containers = document.querySelectorAll('.line-list, .station-list');
    
    containers.forEach(container => {
        container.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
            
            const draggingStation = document.querySelector('.dragging-station');
            const draggingLine = document.querySelector('.dragging-line');
            const draggable = draggingStation || draggingLine;
            
            if (!draggable) return;
            
            const isStation = !!draggingStation;
            const containerIsList = container.classList.contains('line-list');
            const containerIsStationList = container.classList.contains('station-list');
            
            // 确保只在正确的容器中拖放
            if ((containerIsList && isStation) || (containerIsStationList && !isStation)) {
                return;
            }
            
            // 如果是车站，确保只能在同一线路内拖放
            if (isStation) {
                const sourceLineItem = draggable.closest('.line-item');
                const targetLineItem = container.closest('.line-item');
                if (sourceLineItem !== targetLineItem) {
                    return;
                }
            }
            
            const afterElement = getDragAfterElement(container, e.clientY);
            
            if (containerIsList) {
                const addLineButton = document.getElementById('add-line');
                if (afterElement === addLineButton) return;
            }
            
            if (afterElement) {
                container.insertBefore(draggable, afterElement);
            } else {
                if (containerIsList) {
                    const addLineButton = document.getElementById('add-line');
                    container.insertBefore(draggable, addLineButton);
                } else {
                    container.appendChild(draggable);
                }
            }
        });
    });
}

// 修改获取拖拽目标位置的函数
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(
        container.classList.contains('line-list') 
            ? '.line-item:not(.dragging)'
            : '.station-item:not(.dragging)'
    )].filter(child => {
        // 排除添加按钮
        return !child.classList.contains('add-line-button') && 
               !child.classList.contains('add-station-button');
    });
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 导入功能
function importData(file) {
    if (!file) {
        return;
    }

    const reader = new FileReader();
    
    // 在开始读取前显示加载提示
    showToast('正在导入数据...');
    
    reader.onload = function(e) {
        try {
            // 在执行导入前清除拖放状态
            document.body.classList.remove('dragging');
            
            // 解析导入的数据
            let data;
            try {
                // 首先尝试直接解析为 JSON
                data = JSON.parse(e.target.result);
            } catch {
                // 如果不是 JSON，则尝试作为 JS 执行
                try {
                    // 预处理 JS 内容，移除所有的变量声明关键字
                    let jsContent = e.target.result
                        .replace(/export\s+(const|let|var)\s+/g, '')
                        .replace(/export\s+default/g, '')
                        .replace(/(const|let|var)\s+/g, '')
                        .trim();
                    
                    // 确保内容以分号结尾
                    if (!jsContent.endsWith(';')) {
                        jsContent += ';';
                    }
                    
                    // 构建一个安全的执行环境
                    const scriptContent = `
                        var __tempContext = {};
                        with (__tempContext) {
                            ${jsContent}
                            return {
                                metro_logo: typeof metro_logo !== 'undefined' ? metro_logo : '',
                                metro_name: typeof metro_name !== 'undefined' ? metro_name : '',
                                metro_name_en: typeof metro_name_en !== 'undefined' ? metro_name_en : '',
                                lines: Array.isArray(lines) ? lines : []
                            };
                        }
                    `;
                    
                    // 执行脚本
                    const executeScript = new Function('__tempContext', scriptContent);
                    data = executeScript({});
                    
                    console.log('解析的数据:', data); // 添加调试输出
                } catch (jsError) {
                    console.error('JS 解析错误:', jsError);
                    throw new Error('文件格式不正确: ' + jsError.message);
                }
            }

            if (!data || !Array.isArray(data.lines)) {
                throw new Error('无效的数据格式：缺少必要的线路数据');
            }

            // 清空现有数据，但保留添加按钮
            const addLineButton = document.getElementById('add-line');
            linesContainer.innerHTML = '';
            linesContainer.appendChild(addLineButton);
            
            // 设置Logo
            if (data.metro_logo) {
                metroLogoInput.value = data.metro_logo;
                logoPreview.src = data.metro_logo;
                logoPreview.style.display = 'block';
            }

            // 设置线网名称
            if (data.metro_name) {
                metroNameInput.value = data.metro_name;
            }
            if (data.metro_name_en) {
                metroNameEnInput.value = data.metro_name_en;
            }

            // 重置线路计数器
            nextLineNumber = 1;
            lineNumberMap.clear();

            // 导入线路数据
            if (data.lines.length > 0) {
                data.lines.forEach(line => {
                    if (!line || typeof line !== 'object') {
                        console.warn('跳过无效的线路数据:', line);
                        return;
                    }

                    // 创建新线路
                    const lineTemplate = document.getElementById('line-template');
                    const clone = document.importNode(lineTemplate.content, true);
                    const lineItem = clone.querySelector('.line-item');

                    // 设置线路基本信息
                    const lineNameInput = lineItem.querySelector('.line-name');
                    const lineNameText = lineItem.querySelector('.line-name-text');
                    lineNameInput.value = line.name || `${nextLineNumber}号线`;
                    lineNameText.textContent = lineNameInput.value;

                    const lineNameENInput = lineItem.querySelector('.line-name-en');
                    lineNameENInput.value = line.nameEN || `Line ${nextLineNumber}`;
                    
                    // 为新线路初始化车站编号计数器
                    const lineNumber = parseInt(line.name) || nextLineNumber;
                    lineNumberMap.set(lineItem, lineNumber * 100 + 1);
                    nextLineNumber = Math.max(nextLineNumber, lineNumber + 1);
                    
                    // 转换并设置颜色值
                    const colorInput = lineItem.querySelector('.line-color');
                    const hexColor = convertColorToHex(line.color || '#000000');
                    colorInput.value = hexColor;

                    // 添加折叠功能
                    const toggleButton = lineItem.querySelector('.toggle-button');
                    toggleButton.addEventListener('click', () => toggleExpand(lineItem));

                    // 添加编辑功能
                    const editLineBtn = lineItem.querySelector('.edit-line');
                    editLineBtn.addEventListener('click', () => toggleEdit(lineNameInput, editLineBtn, lineNameText));

                    // 添加车站
                    const stationList = lineItem.querySelector('.station-list');
                    if (line.stations && Array.isArray(line.stations)) {
                        line.stations.forEach(station => {
                            if (!station || typeof station !== 'object') {
                                console.warn('跳过无效的车站数据:', station);
                                return;
                            }

                            const stationTemplate = document.getElementById('station-template');
                            const stationClone = document.importNode(stationTemplate.content, true);
                            const stationItem = stationClone.querySelector('.station-item');

                            // 设置车站信息
                            const stationNameInput = stationItem.querySelector('.station-name');
                            const stationNameText = stationItem.querySelector('.station-name-text');
                            stationNameInput.value = station.name || numberToChinese(lineNumberMap.get(lineItem) || 101);
                            stationNameText.textContent = stationNameInput.value;
                            
                            try {
                                stationItem.querySelector('.station-name-en').value = station.nameEN || '';
                                stationItem.querySelector('.coord-x').value = station.coordinates?.x || '';
                                stationItem.querySelector('.coord-y').value = station.coordinates?.y || '';
                                stationItem.querySelector('.fare-zone').value = station.fareZone || '';
                                stationItem.querySelector('.offset-x').value = station.labelOffset?.x || '';
                                stationItem.querySelector('.offset-y').value = station.labelOffset?.y || '';
                                stationItem.querySelector('.travel-time').value = station.travelTime || '';
                                stationItem.querySelector('.platform-side').value = station.platformSide || 'left';
                                stationItem.querySelector('.swap-platform-checkbox').checked = station.swapPlatform || false;
                            } catch (err) {
                                console.warn('设置车站属性时出错:', err);
                            }

                            // 添加折叠功能
                            const stationToggleButton = stationItem.querySelector('.toggle-button');
                            stationToggleButton.addEventListener('click', () => toggleExpand(stationItem));

                            // 添加编辑功能
                            const editStationBtn = stationItem.querySelector('.edit-station');
                            editStationBtn.addEventListener('click', () => toggleEdit(stationNameInput, editStationBtn, stationNameText));

                            // 添加删除车站的事件监听器
                            const removeStationBtn = stationItem.querySelector('.remove-station');
                            removeStationBtn.addEventListener('click', function() {
                                stationItem.remove();
                            });

                            stationList.appendChild(stationClone);

                            // 更新下一个车站编号
                            const stationNum = parseInt(station.name?.replace(/[^0-9]/g, ''));
                            if (!isNaN(stationNum)) {
                                const currentLineNumber = parseInt(line.name) || nextLineNumber - 1;
                                const baseNumber = currentLineNumber * 100;
                                if (stationNum >= baseNumber && stationNum < baseNumber + 100) {
                                    lineNumberMap.set(lineItem, Math.max(lineNumberMap.get(lineItem), stationNum + 1));
                                }
                            }
                        });
                    }

                    // 添加事件监听器
                    const removeLineBtn = lineItem.querySelector('.remove-line');
                    removeLineBtn.addEventListener('click', function() {
                        lineItem.remove();
                    });

                    const addStationBtn = lineItem.querySelector('.add-station-button');
                    addStationBtn.addEventListener('click', function() {
                        addStation(stationList);
                    });

                    // 将新线路插入到"添加线路"按钮之前
                    linesContainer.insertBefore(clone, addLineButton);

                    // 添加拖拽功能
                    initDraggableItem(lineItem);
                });

                showToast('数据导入成功！');
            }
        } catch (error) {
            console.error('导入错误:', error);
            showToast('导入失败：' + (error.message || '文件格式不正确'));
        } finally {
            // 确保在任何情况下都清除拖放状态
            document.body.classList.remove('dragging');
        }
    };

    reader.onerror = function(error) {
        console.error('文件读取错误:', error);
        showToast('读取文件失败');
        document.body.classList.remove('dragging');
    };

    reader.readAsText(file);
}

// 导出功能
function exportData() {
    const metroLogo = metroLogoInput.value;
    const metroName = metroNameInput.value;
    const metroNameEn = metroNameEnInput.value;
    const lines = [];

    // 收集线路数据
    document.querySelectorAll('.line-item').forEach(lineItem => {
        const lineName = lineItem.querySelector('.line-name').value;
        const lineNameEN = lineItem.querySelector('.line-name-en').value; // 添加对英文名的支持
        const lineColor = lineItem.querySelector('.line-color').value;
        const stations = [];

        lineItem.querySelectorAll('.station-item').forEach(stationItem => {
            const station = {
                name: stationItem.querySelector('.station-name').value,
                nameEN: stationItem.querySelector('.station-name-en').value || '',
                coordinates: {
                    x: parseInt(stationItem.querySelector('.coord-x').value) || 0,
                    y: parseInt(stationItem.querySelector('.coord-y').value) || 0
                },
                fareZone: stationItem.querySelector('.fare-zone').value || '市区',
                labelOffset: {
                    x: parseInt(stationItem.querySelector('.offset-x').value) || 8,
                    y: parseInt(stationItem.querySelector('.offset-y').value) || -8
                },
                travelTime: parseInt(stationItem.querySelector('.travel-time').value) || 2,
                platformSide: stationItem.querySelector('.platform-side').value,
                swapPlatform: stationItem.querySelector('.swap-platform-checkbox').checked
            };
            stations.push(station);
        });

        if (lineName && stations.length > 0) {
            lines.push({
                name: lineName,
                nameEN: lineNameEN, // 添加对英文名的支持
                color: lineColor,
                stations: stations
            });
        }
    });

    // 生成数据文件内容
    const metroDataContent = 
`const metro_logo = "${metroLogo}";
const metro_name = "${metroName}";
const metro_name_en = "${metroNameEn}";

const lines = [
${lines.map(line => `    {
        name: "${line.name}",
        nameEN: "${line.nameEN}",
        color: "${line.color}",
        stations: [
${line.stations.map(station => `            {
                name: "${station.name}",
                nameEN: "${station.nameEN}",
                coordinates: {
                    x: ${station.coordinates.x},
                    y: ${station.coordinates.y}
                },
                fareZone: "${station.fareZone}",
                labelOffset: {
                    x: ${station.labelOffset.x},
                    y: ${station.labelOffset.y}
                },
                travelTime: ${station.travelTime},
                platformSide: "${station.platformSide}",
                swapPlatform: ${station.swapPlatform}
            }`).join(',\n')}
        ]
    }`).join(',\n')}
];
`;

    // 创建并下载文件
    const blob = new Blob([metroDataContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 获取当前日期和时间
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, ''); // 格式：YYYYMMDD
    const time = now.toTimeString().split(' ')[0].slice(0, 5).replace(':', ''); // 格式：HHMM
    
    // 使用线网名称（如果为空则使用'metro'）和日期时间创建文件名
    const networkName = metroName.trim() || 'metro';
    a.download = `${networkName}_${date}_${time}.js`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据导出成功！');
}

// 事件监听器
importFileInput.addEventListener('change', () => importData(importFileInput.files[0]));
importFileInputMobile.addEventListener('change', () => importData(importFileInputMobile.files[0]));
exportButton.addEventListener('click', exportData);
exportButtonMobile.addEventListener('click', exportData);

// Logo预览功能
metroLogoInput.addEventListener('input', function() {
    const url = this.value;
    if (url) {
        logoPreview.src = url;
        logoPreview.style.display = 'block';
    } else {
        logoPreview.style.display = 'none';
    }
});

// 添加新线路
addLineButton.addEventListener('click', function() {
    const lineTemplate = document.getElementById('line-template');
    const clone = document.importNode(lineTemplate.content, true);
    const lineItem = clone.querySelector('.line-item');
    
    // 设置默认线路名称
    const lineNameInput = lineItem.querySelector('.line-name');
    const lineNameText = lineItem.querySelector('.line-name-text');
    const defaultLineName = `${nextLineNumber}号线`;
    lineNameInput.value = defaultLineName;
    lineNameText.textContent = defaultLineName;

    const lineNameENInput = lineItem.querySelector('.line-name-en');
    const defaultLineNameEN = `Line ${nextLineNumber}`;
    lineNameENInput.value = defaultLineNameEN;
    
    // 设置默认颜色
    const colorInput = lineItem.querySelector('.line-color');
    const lineNumber = nextLineNumber - 1; // 因为数组是从0开始的
    colorInput.value = lineNumber < defaultLineColors.length ? 
        defaultLineColors[lineNumber] : 
        generateRandomColor();
    
    // 为新线路初始化车站编号计数器
    const lineNumber2 = parseInt(lineNameInput.value.match(/\d+/)[0]) || nextLineNumber;
    lineNumberMap.set(lineItem, lineNumber2 * 100 + 1);
    nextLineNumber = Math.max(nextLineNumber, lineNumber2 + 1);
    
    // 添加折叠功能
    const toggleButton = lineItem.querySelector('.toggle-button');
    toggleButton.addEventListener('click', () => toggleExpand(lineItem));

    // 添加编辑功能
    const editLineBtn = lineItem.querySelector('.edit-line');
    editLineBtn.addEventListener('click', () => toggleEdit(lineNameInput, editLineBtn, lineNameText));

    // 添加事件监听器
    const removeLineBtn = lineItem.querySelector('.remove-line');
    removeLineBtn.addEventListener('click', function() {
        lineItem.remove();
    });

    const addStationBtn = lineItem.querySelector('.add-station-button');
    addStationBtn.addEventListener('click', function() {
        addStation(lineItem.querySelector('.station-list'));
    });

    // 将新线路插入到"添加线路"按钮之前
    linesContainer.insertBefore(clone, addLineButton);

    // 添加拖拽功能
    initDraggableItem(lineItem);
});

// 添加坐标计算函数
function calculateNextStationCoordinates(stationList) {
    const stations = stationList.querySelectorAll('.station-item');
    if (stations.length < 2) return null;

    const lastStation = stations[stations.length - 1];
    const secondLastStation = stations[stations.length - 2];

    const x1 = parseInt(secondLastStation.querySelector('.coord-x').value);
    const y1 = parseInt(secondLastStation.querySelector('.coord-y').value);
    const x2 = parseInt(lastStation.querySelector('.coord-x').value);
    const y2 = parseInt(lastStation.querySelector('.coord-y').value);

    // 检查是否有有效坐标
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

    // 计算方向向量
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算单位向量
    const ux = dx / distance;
    const uy = dy / distance;
    
    // 计算新站点坐标（延长相同距离）
    return {
        x: Math.round(x2 + ux * distance),
        y: Math.round(y2 + uy * distance)
    };
}

// 修改添加车站函数
function addStation(stationList) {
    const stationTemplate = document.getElementById('station-template');
    const clone = document.importNode(stationTemplate.content, true);
    const stationItem = clone.querySelector('.station-item');
    
    // 获取所属的线路元素
    const lineItem = stationList.closest('.line-item');
    const lineName = lineItem.querySelector('.line-name').value;
    const lineNameEN = lineItem.querySelector('.line-name-en').value;
    const lineNumber = parseInt(lineName) || 1;
    let nextStationNumber = lineNumberMap.get(lineItem) || (lineNumber * 100 + 1);
    
    // 生成车站默认名称（将数字转换为中文）
    const stationNameInput = stationItem.querySelector('.station-name');
    const stationNameText = stationItem.querySelector('.station-name-text');
    const defaultStationName = numberToChinese(nextStationNumber);
    stationNameInput.value = defaultStationName;
    stationNameText.textContent = defaultStationName;
    
    // 更新下一个车站编号
    lineNumberMap.set(lineItem, nextStationNumber + 1);
    
    // 添加折叠功能
    const toggleButton = stationItem.querySelector('.toggle-button');
    toggleButton.addEventListener('click', () => toggleExpand(stationItem));

    // 添加编辑功能
    const editStationBtn = stationItem.querySelector('.edit-station');
    editStationBtn.addEventListener('click', () => toggleEdit(stationNameInput, editStationBtn, stationNameText));

    // 添加删除车站的事件监听器
    const removeStationBtn = stationItem.querySelector('.remove-station');
    removeStationBtn.addEventListener('click', function() {
        stationItem.remove();
    });

    // 尝试计算新站点坐标
    const coordinates = calculateNextStationCoordinates(stationList);
    if (coordinates) {
        stationItem.querySelector('.coord-x').value = coordinates.x;
        stationItem.querySelector('.coord-y').value = coordinates.y;
    }

    // 先将克隆的内容添加到DOM中
    stationList.appendChild(clone);

    // 获取实际添加到DOM中的station-item元素
    const addedStationItem = stationList.lastElementChild;

    // 添加上移和下移按钮
    const moveUpBtn = document.createElement('button');
    moveUpBtn.className = 'move-station-btn move-up';
    moveUpBtn.innerHTML = '<img src="../UI/res/sort_black.png" style="transform: rotate(-90deg);" alt="上移">';
    moveUpBtn.title = '上移车站';
    moveUpBtn.addEventListener('click', () => moveStation(addedStationItem, 'up'));

    const moveDownBtn = document.createElement('button');
    moveDownBtn.className = 'move-station-btn move-down';
    moveDownBtn.innerHTML = '<img src="../UI/res/sort_black.png" style="transform: rotate(90deg);" alt="下移">';
    moveDownBtn.title = '下移车站';
    moveDownBtn.addEventListener('click', () => moveStation(addedStationItem, 'down'));

    // 将按钮添加到车站操作区域
    const stationActions = addedStationItem.querySelector('.station-actions');
    if (stationActions) {
        // 在第一个子元素之前插入按钮
        if (stationActions.firstChild) {
            stationActions.insertBefore(moveDownBtn, stationActions.firstChild);
            stationActions.insertBefore(moveUpBtn, stationActions.firstChild);
        } else {
            // 如果没有子元素，直接添加
            stationActions.appendChild(moveUpBtn);
            stationActions.appendChild(moveDownBtn);
        }
    }
}

// 添加移动车站的函数
function moveStation(stationItem, direction) {
    const stationList = stationItem.parentElement;
    const stations = Array.from(stationList.children).filter(child => 
        child.classList.contains('station-item')
    );
    const currentIndex = stations.indexOf(stationItem);
    
    if (direction === 'up' && currentIndex > 0) {
        stationList.insertBefore(stationItem, stations[currentIndex - 1]);
    } else if (direction === 'down' && currentIndex < stations.length - 1) {
        stationList.insertBefore(stationItem, stations[currentIndex + 1].nextSibling);
    }
}

// 打开搜索框
searchButton.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
});

// 关闭搜索框
closeSearch.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
    clearSearch();
});

// ESC键关闭搜索框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
        clearSearch();
    }
});

// 搜索功能实现
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    clearSearch();
    currentSearchResults = [];
    currentResultIndex = -1;
    
    if (!searchTerm) {
        updateSearchNavigation();
        return;
    }
    
    const lines = document.querySelectorAll('.line-item');
    
    lines.forEach(line => {
        const lineName = line.querySelector('.line-name').value.toLowerCase();
        const lineNameEN = line.querySelector('.line-name-en').value.toLowerCase();
        const stations = line.querySelectorAll('.station-item');
        let lineMatched = lineName.includes(searchTerm);
        
        if (lineMatched) {
            currentSearchResults.push({
                element: line.querySelector('.line-name-text'),
                parent: line
            });
        }
        
        stations.forEach(station => {
            const stationName = station.querySelector('.station-name').value.toLowerCase();
            if (stationName.includes(searchTerm)) {
                currentSearchResults.push({
                    element: station.querySelector('.station-name-text'),
                    parent: station,
                    lineParent: line
                });
            }
        });
    });
    
    updateSearchNavigation();
    if (currentSearchResults.length > 0) {
        navigateToResult(0);
    }
}

function updateSearchNavigation() {
    const total = currentSearchResults.length;
    const current = total > 0 ? currentResultIndex + 1 : 0;
    searchCountSpan.textContent = `${current}/${total}`;
    
    prevResultBtn.disabled = total === 0;
    nextResultBtn.disabled = total === 0;
}

function navigateToResult(index) {
    clearSearch();
    if (index < 0 || index >= currentSearchResults.length) return;
    
    currentResultIndex = index;
    const result = currentSearchResults[index];
    
    // 展开父元素
    if (result.lineParent) {
        result.lineParent.classList.add('expanded');
    }
    if (result.parent) {
        result.parent.classList.add('expanded');
    }
    
    // 高亮显示结果
    highlightElement(result.element);
    
    // 滚动到结果位置
    result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    updateSearchNavigation();
}

// 修改导航按钮事件监听器
prevResultBtn.addEventListener('click', () => {
    // 如果是第一个结果，则跳转到最后一个
    const newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : currentSearchResults.length - 1;
    navigateToResult(newIndex);
});

nextResultBtn.addEventListener('click', () => {
    // 如果是最后一个结果，则跳转到第一个
    const newIndex = currentResultIndex < currentSearchResults.length - 1 ? currentResultIndex + 1 : 0;
    navigateToResult(newIndex);
});

// 修改键盘快捷键支持
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            // Shift + Enter: 上一个结果
            const newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : currentSearchResults.length - 1;
            navigateToResult(newIndex);
        } else {
            // Enter: 下一个结果
            const newIndex = currentResultIndex < currentSearchResults.length - 1 ? currentResultIndex + 1 : 0;
            navigateToResult(newIndex);
        }
        e.preventDefault();
    }
});

// 修改清除搜索函数
function clearSearch() {
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
    });
}

function highlightElement(element) {
    element.classList.add('search-highlight');
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 添加移动端搜索按钮事件监听
searchButtonMobile.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
});

// 添加数字转中文函数
function numberToChinese(num) {
    const digits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return num.toString().split('').map(n => digits[parseInt(n)]).join('');
}

// 预览功能
togglePreviewBtn.addEventListener('click', () => {
    previewOverlay.classList.toggle('active');
    document.querySelector('.container').classList.toggle('preview-active');
    if (previewOverlay.classList.contains('active')) {
        updatePreview();
    }
});

closePreviewBtn.addEventListener('click', () => {
    previewOverlay.classList.remove('active');
    document.querySelector('.container').classList.remove('preview-active');
});

// 更新预览
function updatePreview() {
    // 获取当前编辑器的数据
    const currentData = {
        metro_logo: metroLogoInput.value,
        metro_name: metroNameInput.value,
        metro_name_en: metroNameEnInput.value,
        lines: []
    };

    // 收集线路数据
    document.querySelectorAll('.line-item').forEach(lineItem => {
        const lineName = lineItem.querySelector('.line-name').value;
        const lineNameEN = lineItem.querySelector('.line-name-en').value;
        const lineColor = lineItem.querySelector('.line-color').value;
        const stations = [];

        lineItem.querySelectorAll('.station-item').forEach(stationItem => {
            const station = {
                name: stationItem.querySelector('.station-name').value,
                nameEN: stationItem.querySelector('.station-name-en').value,
                coordinates: {
                    x: parseInt(stationItem.querySelector('.coord-x').value) || 0,
                    y: parseInt(stationItem.querySelector('.coord-y').value) || 0
                },
                fareZone: stationItem.querySelector('.fare-zone').value,
                labelOffset: {
                    x: parseInt(stationItem.querySelector('.offset-x').value) || 8,
                    y: parseInt(stationItem.querySelector('.offset-y').value) || -8
                },
                travelTime: parseInt(stationItem.querySelector('.travel-time').value) || 2,
                platformSide: stationItem.querySelector('.platform-side').value,
                swapPlatform: stationItem.querySelector('.swap-platform-checkbox').checked
            };
            stations.push(station);
        });

        if (lineName && stations.length > 0) {
            currentData.lines.push({
                name: lineName,
                nameEN: lineNameEN,
                color: lineColor,
                stations: stations
            });
        }
    });

    // 创建一个包含数据的HTML文件内容
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>线网预览</title>
            <script>
                const metro_logo = ${JSON.stringify(currentData.metro_logo)};
                const lines = ${JSON.stringify(currentData.lines)};
            </script>
            <link rel="stylesheet" href="../style.css">
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <div id="metro-map"></div>
            <script src="script.js"></script>
        </body>
        </html>
    `;

    // 使用Blob创建一个临时URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // 更新两个预览iframe的src
    const previewFrames = [
        document.getElementById('preview-frame'),
        document.getElementById('inline-preview-frame')
    ];

    previewFrames.forEach(frame => {
        if (frame) {
            frame.src = url;
            frame.onload = () => {
                URL.revokeObjectURL(url);
            };
        }
    });
}

// 定期更新预览（同时更新两个预览窗口）
setInterval(() => {
    const shouldUpdate = previewOverlay.classList.contains('active') || 
                        window.innerWidth >= 961;
    if (shouldUpdate) {
        updatePreview();
    }
}, 5000);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    // 如果是宽屏模式，立即加载内嵌预览
    if (window.innerWidth >= 961) {
        updatePreview();
    }
});

// 添加词典序排序功能
document.getElementById('sort-lines-by-number').textContent = '按名称排序';
document.getElementById('sort-stations-by-number').textContent = '所有车站按名称排序';

// 线路排序
document.getElementById('sort-lines-by-number').addEventListener('click', function() {
    const lineItems = Array.from(document.querySelectorAll('.line-item'));
    const addLineButton = document.getElementById('add-line');
    
    lineItems.sort((a, b) => {
        const nameA = a.querySelector('.line-name').value;
        const nameB = b.querySelector('.line-name').value;
        return nameA.localeCompare(nameB, 'zh-CN');
    });
    
    // 清空容器
    linesContainer.innerHTML = '';
    
    // 重新添加排序后的元素
    lineItems.forEach(item => linesContainer.appendChild(item));
    linesContainer.appendChild(addLineButton);
    
    showToast('线路已按名称排序');
});

// 车站排序
document.getElementById('sort-stations-by-number').addEventListener('click', function() {
    const lineItems = document.querySelectorAll('.line-item');
    
    lineItems.forEach(lineItem => {
        const stationList = lineItem.querySelector('.station-list');
        const stations = Array.from(stationList.querySelectorAll('.station-item'));
        
        stations.sort((a, b) => {
            const nameA = a.querySelector('.station-name').value;
            const nameB = b.querySelector('.station-name').value;
            return nameA.localeCompare(nameB, 'zh-CN');
        });
        
        // 清空站点列表
        const addStationButton = stationList.querySelector('.add-station-button');
        stationList.innerHTML = '';
        
        // 重新添加排序后的站点
        stations.forEach(station => stationList.appendChild(station));
        if (addStationButton) {
            stationList.appendChild(addStationButton);
        }
    });
    
    showToast('所有车站已按名称排序');
});
