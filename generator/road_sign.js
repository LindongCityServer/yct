document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add');
    const downloadBtn = document.getElementById('download-button');
    const backToTopBtn = document.getElementById('back-to-top'); // 新增回到顶部按钮
    const dataList = document.querySelector('.data-list');
    const previewContainer = document.querySelector('.preview-container');
    const initialSignboardContainer = document.querySelector('.preview-container .signboard-container');

    // 初始的占位 signboard-container
    let hasInitialSignboard = initialSignboardContainer !== null;

    // 添加路牌
    addBtn.addEventListener('click', handleAddBtnClick);
    function handleAddBtnClick() {
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';

        dataItem.innerHTML = `
            <div class="input-container">
                <div class="road-name-input">
                    <label for="direction">路名：</label>
                    <input type="text" class="road-name" placeholder="请输入路名">
                    <input type="text" class="road-name-en" placeholder="请输入拼音">
                </div>                    
            </div>
            <div class="control-container">
                <div class="road-type-input">
                    <label for="road-type">类型：</label>
                    <select class="road-type">
                        <option value="road">路</option>
                        <option value="street">街</option>
                        <option value="scenery">景区</option>
                    </select>
                </div>
                <div class="direction-input">
                    <label for="direction">方向：</label>
                    <select class="direction">
                        <option value="we">西东</option>
                        <option value="ew">东西</option>
                        <option value="ns">北南</option>
                        <option value="sn">南北</option>
                    </select>
                </div>
                <button class="icon-button remove" style="color: red;">
                    <img src="../UI/res/delete_black.png" alt="删除">
                </button>
            </div>
        `;

        dataList.appendChild(dataItem);

        // 移除路牌
        const removeBtn = dataItem.querySelector('.remove');
        removeBtn.addEventListener('click', () => {
            dataList.removeChild(dataItem);
            // 同时移除对应的 signboard-container
            const signboardContainer = previewContainer.querySelector(`.signboard-container[data-id="${dataItem.dataset.id}"]`);
            if (signboardContainer) {
                previewContainer.removeChild(signboardContainer);
            }
            // 调整 preview-container 的宽度
            adjustPreviewContainerWidth();
        });

        // 为每个 data-item 分配一个唯一的 ID
        const uniqueId = Date.now().toString();
        dataItem.dataset.id = uniqueId;

        // 更新路牌显示
        dataItem.addEventListener('input', (event) => {
            updateSignboard(dataItem);
        });

        // 初始化时添加 signboard-container
        addSignboardContainer(dataItem);

        // 隐藏初始的占位 signboard-container
        if (hasInitialSignboard) {
            initialSignboardContainer.style.display = 'none';
            hasInitialSignboard = false;
        }

        // 自动填充上一个路牌的信息
        autoFillPreviousData(dataItem);

        // 调整 preview-container 的宽度
        adjustPreviewContainerWidth();
    }

    // 下载路牌图片
    downloadBtn.addEventListener('click', () => {
        html2canvas(document.querySelector('.preview-container'), {
            backgroundColor: null // 设置背景为透明
        }).then(canvas => {
            const width = canvas.width;
            const height = canvas.height;
            const date = new Date();
            const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            const formattedTime = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
            const fileName = `路牌_${formattedDate}_${formattedTime}_${Math.ceil(width / 256)}x${Math.ceil(height / 256)}.png`;

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = fileName;
            link.click();
        });
    });

    // 回到顶部按钮功能
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 更新路牌显示
    function updateSignboard(dataItem) {
        const roadNameInput = dataItem.querySelector('.road-name');
        const roadNameEnInput = dataItem.querySelector('.road-name-en');
        const roadTypeSelect = dataItem.querySelector('.road-type');
        const directionSelect = dataItem.querySelector('.direction');

        if (!roadNameInput || !roadNameEnInput || !roadTypeSelect || !directionSelect) {
            console.warn('Missing required input elements in data-item');
            return;
        }

        const roadName = roadNameInput.value;
        const roadNameEn = roadNameEnInput.value;
        const roadType = roadTypeSelect.value;
        const direction = directionSelect.value;

        const signboardContainer = previewContainer.querySelector(`.signboard-container[data-id="${dataItem.dataset.id}"]`);
        if (!signboardContainer) {
            console.warn('Signboard container not found');
            return;
        }

        const signboard = signboardContainer.querySelector('.signboard');
        signboard.className = `signboard ${roadType}-sign`;

        const topSection = signboard.querySelector('.top-section');
        const bottomSection = signboard.querySelector('.bottom-section');

        // 处理方向
        const arrowLeft = document.createElement('div');
        arrowLeft.className = 'arrow arrow-left';
        const arrowHeadLeft = document.createElement('div');
        arrowHeadLeft.className = 'arrow-head';
        const arrowTextLeft = document.createElement('p');
        arrowTextLeft.className = 'top-direction-left';

        const arrowRight = document.createElement('div');
        arrowRight.className = 'arrow';
        const arrowHeadRight = document.createElement('div');
        arrowHeadRight.className = 'arrow-head';
        const arrowTextRight = document.createElement('p');
        arrowTextRight.className = 'top-direction-right';

        let leftDirection = '';
        let rightDirection = '';
        let bottomLeft = '';
        let bottomRight = '';

        switch (direction) {
            case 'ns':
                leftDirection = '北';
                rightDirection = '南';
                bottomLeft = 'N';
                bottomRight = 'S';
                break;
            case 'sn':
                leftDirection = '南';
                rightDirection = '北';
                bottomLeft = 'S';
                bottomRight = 'N';
                break;
            case 'we':
                leftDirection = '西';
                rightDirection = '东';
                bottomLeft = 'W';
                bottomRight = 'E';
                break;
            case 'ew':
                leftDirection = '东';
                rightDirection = '西';
                bottomLeft = 'E';
                bottomRight = 'W';
                break;
        }

        arrowTextLeft.textContent = leftDirection;
        arrowTextRight.textContent = rightDirection;

        arrowHeadLeft.appendChild(arrowTextLeft);
        arrowLeft.appendChild(arrowHeadLeft);
        arrowHeadRight.appendChild(arrowTextRight);
        arrowRight.appendChild(arrowHeadRight);

        topSection.innerHTML = ''; // 清空现有内容
        topSection.appendChild(arrowLeft);
        topSection.innerHTML += `<span class="road-sign-name">${roadName}</span>`;
        topSection.appendChild(arrowRight);

        bottomSection.innerHTML = `
            <span class="bottom-direction-left">${bottomLeft}</span>
            <span class="road-sign-name-en">${roadNameEn}</span>
            <span class="bottom-direction-right">${bottomRight}</span>
        `;
    }

    // 添加 signboard-container
    function addSignboardContainer(dataItem) {
        const signboardContainer = document.createElement('div');
        signboardContainer.className = 'signboard-container';
        signboardContainer.dataset.id = dataItem.dataset.id;

        const signboard = document.createElement('div');
        signboard.className = 'signboard road-sign';

        const topSection = document.createElement('div');
        topSection.className = 'top-section';

        const bottomSection = document.createElement('div');
        bottomSection.className = 'bottom-section';

        signboard.appendChild(topSection);
        signboard.appendChild(bottomSection);

        signboardContainer.appendChild(signboard);
        previewContainer.appendChild(signboardContainer);

        // 初始化显示
        updateSignboard(dataItem);
    }

    // 调整 preview-container 的宽度
    function adjustPreviewContainerWidth() {
        const signboardContainers = previewContainer.querySelectorAll('.signboard-container');
        const containerCount = signboardContainers.length;
        const containerWidth = 256;
        const gap = 8; // 与CSS中gap一致
        const totalWidth = containerCount * containerWidth;

        // 获取父容器的可用宽度（假设父容器为 .content-container）
        const parentWidth = previewContainer.parentElement.offsetWidth;

        if (totalWidth <= parentWidth) {
            // 当容器总宽度 ≤ 父容器宽度时，设置为总宽度
            previewContainer.style.width = `${totalWidth}px`;
        } else {
            // 超过父容器宽度时，允许换行并重置宽度
            previewContainer.style.width = 'auto';
        }

        // 处理初始占位容器
        if (signboardContainers.length === 0 && hasInitialSignboard) {
            initialSignboardContainer.style.display = 'block';
        } else {
            initialSignboardContainer.style.display = 'none';
        }
    }

    // 在DOMContentLoaded事件中添加：
    if (initialSignboardContainer && hasInitialSignboard) {
        initialSignboardContainer.remove();
        hasInitialSignboard = false;
    }

    // 自动填充上一个路牌的信息
    function autoFillPreviousData(dataItem) {
        const dataItems = dataList.querySelectorAll('.data-item');
        if (dataItems.length > 1) {
            const previousDataItem = dataItems[dataItems.length - 2];
            const previousRoadName = previousDataItem.querySelector('.road-name').value;
            const previousRoadNameEn = previousDataItem.querySelector('.road-name-en').value;
            const previousRoadType = previousDataItem.querySelector('.road-type').value;
            const previousDirection = previousDataItem.querySelector('.direction').value;

            dataItem.querySelector('.road-name').value = previousRoadName;
            dataItem.querySelector('.road-name-en').value = previousRoadNameEn;
            dataItem.querySelector('.road-type').value = previousRoadType;
            dataItem.querySelector('.direction').value = previousDirection;
        }
    }

    // 初始调整 preview-container 的宽度
    adjustPreviewContainerWidth();

    handleAddBtnClick();

    // 监听窗口大小变化，调整 preview-container 的宽度
    window.addEventListener('resize', adjustPreviewContainerWidth);
});