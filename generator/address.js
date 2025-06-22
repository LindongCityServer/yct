function updatePreview() { 
    const roadName = document.querySelector('#roadName').value || '示例路名';
    const roadNameEn = document.querySelector('#roadNameEn').value || 'SHILI LUMING';
    const number = document.querySelector('#number').value || 'X';
    const numberAdd = document.querySelector('#numberAdd').value;
    const postalCode = document.querySelector('#postalCode').value || '114514';

    document.querySelector('.road-name').textContent = roadName;
    document.querySelector('.road-name-en').textContent = roadNameEn;
    document.querySelector('.number').textContent = number;
    document.querySelector('.number-add').textContent = numberAdd;
    document.querySelector('.postal-code').textContent = `邮政编码:${postalCode}`;

    const numberWidth = document.querySelector('.number').offsetWidth;
    const addWidth = document.querySelector('.number-add').offsetWidth;
    const containerWidth = 96;
    const totalWidth = numberWidth + addWidth;
    const scaleRatio = containerWidth / totalWidth;

    document.querySelector('.number-layer').style.transform = 
    `scaleX(${scaleRatio < 0.9 ? scaleRatio : 0.9})`;

    const roadContainerWidth = 130;
    const roadNameLength = document.querySelector('.road-name').innerText.length;
    const roadNameEnLength = document.querySelector('.road-name-en').innerText.length;
    const roadNameFontSize = document.querySelector('.road-name').style.fontSize.replace('px', '');
    const roadNameEnFontSize = document.querySelector('.road-name-en').style.fontSize.replace('px', '');

    const roadNameWidth = document.querySelector('.road-name').offsetWidth;
    const roadNameScaleRatio = roadContainerWidth / roadNameWidth;
    document.querySelector('.road-name').style.transform = `scaleX(${roadNameScaleRatio < 0.95 ? roadNameScaleRatio : 0.95 })`;

    const roadNameEnWidth = document.querySelector('.road-name-en').offsetWidth;
    const roadNameEnScaleRatio = roadContainerWidth / roadNameEnWidth;
    document.querySelector('.road-name-en').style.transform = `scaleX(${roadNameEnScaleRatio < 1 ? roadNameEnScaleRatio : 1})`;

    // 当.number-add的内容没有汉字时添加12px的margin-top
    if (!document.querySelector('.number-add').innerHTML.match(/[\u4e00-\u9fa5]/)) {
        document.querySelector('.number-add').style.marginTop = '12px';
    } else {
        document.querySelector('.number-add').style.marginTop = '0';
    }
}

function downloadImage(road, number, numberAdd) { 
    // 将.preview-container的图片下载
    const previewContainer = document.querySelector('.preview-container');
    html2canvas(previewContainer, {
        backgroundColor: 'transparent',
        lineHeight: 1,
    }).then(canvas => {        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${road}${number}${numberAdd}号楼牌.png`;
        link.click();
    });
}

document.addEventListener('DOMContentLoaded', () => { 
    updatePreview();
});

const INPUT_SELECTORS = [
    '#roadName',
    '#roadNameEn',
    '#number',
    '#numberAdd',
    '#postalCode'
];

const updatePreviewDebounced = debounce(updatePreview, 150); // 防抖优化

INPUT_SELECTORS.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
        element.addEventListener('input', updatePreviewDebounced);
    }
});

// 防抖函数实现
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

const DOWNLOAD_BUTTON_ID = '#downloadAction';

const handleDownloadClick = () => {
    const roadName = document.querySelector('#roadName').value || '??';
    const roadNameEn = document.querySelector('#roadNameEn').value || '';
    const number = document.querySelector('#number').value || '?';
    const numberAdd = document.querySelector('#numberAdd').value;
    const postalCode = document.querySelector('#postalCode').value || '';

    if (typeof html2canvas !== 'function') {
        console.error('html2canvas 未就绪，请检查网络连接');
        showToast("html2canvas 未加载完成");
        return;
    }
    try {
        downloadImage(roadName, number, numberAdd);
    } catch (error) {
        console.error('下载图片时发生错误:', error);
    }
};

const downloadButton = document.querySelector(DOWNLOAD_BUTTON_ID);
if (downloadButton) {
    downloadButton.addEventListener('click', handleDownloadClick);
} else {
    console.warn(`元素 ${DOWNLOAD_BUTTON_ID} 未找到`);
}

updatePreview();

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