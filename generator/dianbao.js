// dianbao.js
// 在 dianbao.js 第2行添加调试
import { cccToHanzi } from "./dianma.js";
import { hanziToCcc } from "./dianma.js";

// ✅ 在文件顶部定义为模块级变量
let mainInputCells, recipientCells;

document.addEventListener('DOMContentLoaded', () => {
    console.log('反转电码表:', hanziToCcc);
    
    createPreviewRows();
    createRecipientRows();

    
    // ✅ 赋值给模块级变量
    mainInputCells = document.querySelectorAll('.input-section .input-cell');
    recipientCells = document.querySelectorAll('#recipientInputSection .input-cell');
    
    // ✅ 初始化输入绑定
    initializeContentInput(mainInputCells);
    updateRecipientDisplay(recipientCells);

    document.getElementById('province').addEventListener('input', updateRegionDisplay);
    document.getElementById('city').addEventListener('input', updateRegionDisplay);
    document.getElementById('county').addEventListener('input', updateRegionDisplay);
    document.getElementById('town').addEventListener('input', updateRegionDisplay);

    // 在 DOMContentLoaded 事件中添加
    document.getElementById('copyContent').addEventListener('click', () => {
        // 分别获取收件人和正文部分的 input-cell
        const recipientCells = document.querySelectorAll('#recipientInputSection .input-cell');
        const mainCells = document.querySelectorAll('.input-section .input-cell');

        // 用于存储两个部分的电码内容
        const recipientResult = [];
        const mainResult = [];

        // 处理收件人部分
        recipientCells.forEach(cell => {
            const content = cell.textContent.trim();
            if (!content) return;

            if (/^\(.*\)$/.test(content)) {
                recipientResult.push(content);
            } else {
                const codeRow = cell.parentNode.nextElementSibling;
                const codeCellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                const codeCell = codeRow?.children[codeCellIndex];
                const code = codeCell?.textContent || '0000';
                recipientResult.push(code);
            }
        });

        // 处理正文部分
        mainCells.forEach(cell => {
            const content = cell.textContent.trim();
            if (!content) return;

            if (/^\(.*\)$/.test(content)) {
                mainResult.push(content);
            } else {
                const codeRow = cell.parentNode.nextElementSibling;
                const codeCellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                const codeCell = codeRow?.children[codeCellIndex];
                const code = codeCell?.textContent || '0000';
                mainResult.push(code);
            }
        });

        // 组合结果
        const result = [];

        if (recipientResult.length > 0) {
            result.push(recipientResult.join(' '));
        }

        if (recipientResult.length > 0 && mainResult.length > 0) {
            result.push('\n'); // 换行符
        }

        if (mainResult.length > 0) {
            result.push(mainResult.join(' '));
        }

        // 执行复制操作
        navigator.clipboard.writeText(result.join(''))
            .then(() => showToast('电码已复制到剪贴板'))
            .catch(err => console.error('复制失败:', err));
    });

    // 在 DOMContentLoaded 事件中添加
    document.getElementById('downloadButton').addEventListener('click', () => {
        const container = document.querySelector('.preview-container');
        const input = document.getElementById('telegraphContent').value;
        
        document.fonts.ready.then(() => {
            html2canvas(container).then(canvas => {
                const link = document.createElement('a');
                link.download = `${input}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });
    });
});

// 封装电报内容输入逻辑
function initializeContentInput(mainInputCells) {
    document.getElementById('telegraphContent').addEventListener('input', (e) => {
        const text = e.target.value;
        const blocks = splitTextToBlocks(text);

        mainInputCells.forEach((cell, i) => {
            const block = blocks[i] || '';
            cell.textContent = block;

            // ✅ 获取对应的 code-cell（使用 i 直接索引）
            // 替换 initializeContentInput 函数中的 codeCell 获取逻辑
            const rowIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
            const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
            const codeRow = cell.parentNode.nextElementSibling;
            if (codeRow && codeRow.classList.contains('code-row')) {
                const codeCell = codeRow.children[cellIndex]; // 使用行内索引
                if (codeCell) updateCodeCell(codeCell, block);
            }

            // ✅ 添加 ascii-char 类
            cell.classList.remove('ascii-char');
            if (/^\(.*\)$/.test(block)) {
                const content = block.slice(1, -1);
                if (/^[\x20-\x7E]+$/.test(content)) {
                    cell.classList.add('ascii-char');
                }
            } else if (/^[\x20-\x7E]+$/.test(block)) {
                cell.classList.add('ascii-char');
            }
        });
    });
}

// 新增生成收报人区域的方法
function createRecipientRows() {
    const container = document.querySelector('.recipient-section-content');
    const fragment = document.createDocumentFragment();
    
    for(let i = 0; i < 2; i++) { // 仅生成2组
        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';
        
        // 每行10个单元格
        for(let j = 0; j < 10; j++) {
            const cell = document.createElement('span');
            cell.className = 'input-cell';
            
            // 第一行第一个单元格留空
            if(i === 0 && j === 0) {
                cell.textContent = ''; 
            }
            
            inputRow.appendChild(cell);
        }
        
        const codeRow = document.createElement('div');
        codeRow.className = 'code-row';
        codeRow.innerHTML = Array(10).fill('<span class="code-cell"></span>').join('');
        
        fragment.appendChild(inputRow);
        fragment.appendChild(codeRow);
    }
    
    container.appendChild(fragment);
}

// 动态生成5组行结构
function createPreviewRows() {
    const container = document.querySelector('.input-section');
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 5; i++) {
        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';
        inputRow.innerHTML = Array(10).fill('<span class="input-cell"></span>').join('');

        const codeRow = document.createElement('div');
        codeRow.className = 'code-row';
        codeRow.innerHTML = Array(10).fill('<span class="code-cell"></span>').join('');

        fragment.appendChild(inputRow);
        fragment.appendChild(codeRow);
    }

    container.appendChild(fragment);
}

// 修改输入监听逻辑
/*document.getElementById('telegraphContent').addEventListener('input', (e) => {
    const text = e.target.value;
    const blocks = splitTextToBlocks(text);
    
    mainInputCells.forEach((cell, i) => {
        const block = blocks[i] || '';
        cell.textContent = block;
        
        // ✅ 移除旧类
        cell.classList.remove('ascii-char');
        
        // ✅ 判断并添加新类
        if (/^\(.*\)$/.test(block)) {
            const content = block.slice(1, -1);
            if (/^[\x20-\x7E]+$/.test(content)) {
                cell.classList.add('ascii-char');
            }
        } else if (/^[\x20-\x7E]+$/.test(block)) {
            cell.classList.add('ascii-char');
        }
    });
});*/

// 文本分割函数
// 修改 splitTextToBlocks 函数
function splitTextToBlocks(text) {
    const result = [];
    let position = 0;
    
    while(position < text.length) {
        // 优先匹配ASCII序列（最多5个）
        if (/^[\x20-\x7E]/.test(text[position])) {
            let asciiEnd = position;
            while(asciiEnd < text.length && /^[\x20-\x7E]/.test(text[asciiEnd]) && asciiEnd - position < 5) {
                asciiEnd++;
            }
            result.push(`(${text.slice(position, asciiEnd)})`);
            position = asciiEnd;
        } else {
            // 处理中文字符
            result.push(text[position]);
            position++;
        }
    }
    return result;
}

// 电码更新函数
// 修改 updateCodeCell 函数
function updateCodeCell(cell, value) {
    if (!value) {
        cell.textContent = '';
        return;
    }

    if (!value.startsWith('(') && /^[\x20-\x7E]+$/.test(value)) {
        cell.textContent = '';
        return;
    }

    if (value.startsWith('(') && value.endsWith(')')) {
        const content = value.slice(1, -1);
        if (/^[\x20-\x7E]+$/.test(content)) {
            cell.textContent = '';
            return;
        }

        if (isInCccTable(content)) {
            cell.textContent = hanziToCcc[content] || '0000';
        } else {
            cell.textContent = '0000';
        }
        return;
    }

    if (isInCccTable(value)) {
        cell.textContent = hanziToCcc[value] || '0000';
    } else {
        cell.textContent = '0000';
    }
}

// ✅ 中文字符检测函数
// 替换原有的 isChinese 函数
function isInCccTable(char) {
    const exists = char in hanziToCcc;
    if(exists) {
            console.log(`📦 表内字符: ${char} => ${hanziToCcc[char]}`);
    } else {
            console.log(`❌ 未注册字符: ${char}`);
    }
    return exists;
}

function updateCharCount() {
    const count = document.querySelectorAll('.input-cell:not(:empty)').length;
    document.getElementById('charCount').textContent = count;
}

function findAsciiRanges(blocks) {
    const ranges = [];
    let current = null;
    
    blocks.forEach((block, index) => {
        // 匹配完整括号包裹的ASCII内容
        const match = /^$(.+?)$/.exec(block);
        if(match && /^[\x20-\x7E]+$/.test(match[1])) {
            if(!current) {
                current = {start: index, end: index};
            } else {
                current.end = index;
            }
        } else {
            if(current) {
                ranges.push(current);
                current = null;
            }
        }
    });
    
    if(current) ranges.push(current);
    return ranges;
}

/*document.getElementById('recipientInputSection').addEventListener('input', (e) => {
    const target = e.target;
    if (target.classList.contains('input-cell')) {
        const index = Array.from(target.parentNode.children).indexOf(target);
        const codeCell = target.parentNode.nextElementSibling?.children[index];
        
        if (codeCell) {
            updateCodeCell(codeCell, target.textContent);
        }
    }
});*/

// 新增收报人输入处理
// 替换 updateRecipientDisplay 函数中的 codeCell 获取逻辑
function updateRecipientDisplay(recipientCells) {
    const recipientInput = document.getElementById('telegraphRecipient');
    recipientInput.addEventListener('input', (e) => {
        const text = e.target.value;
        const blocks = splitTextToBlocks(text);

        recipientCells.forEach((cell, i) => {
            const block = blocks[i] || '';
            cell.textContent = block;

            // ✅ 新增：获取单元格在行内的索引
            const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
            
            // ✅ 使用行内索引定位code-cell
            const codeRow = cell.parentNode.nextElementSibling;
            if (codeRow && codeRow.classList.contains('code-row')) {
                const codeCell = codeRow.children[cellIndex];
                if (codeCell) updateCodeCell(codeCell, block);
            }

            // ✅ 添加 ascii-char 类
            cell.classList.remove('ascii-char');
            if (/^\(.*\)$/.test(block)) {
                const content = block.slice(1, -1);
                if (/^[\x20-\x7E]+$/.test(content)) {
                    cell.classList.add('ascii-char');
                }
            } else if (/^[\x20-\x7E]+$/.test(block)) {
                cell.classList.add('ascii-char');
            }
        });
    });
}

// 新增更新地名显示函数
function updateRegionDisplay() {
    const province = document.getElementById('province').value;
    const city = document.getElementById('city').value;
    const county = document.getElementById('county').value;
    const town = document.getElementById('town').value;
    
    // 更新预览区域的省市区显示
    document.querySelector('.recipient-province').textContent = province;
    document.querySelector('.recipient-city').textContent = city;
    document.querySelector('.recipient-county').textContent = county;
    document.querySelector('.recipient-town').textContent = town;
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