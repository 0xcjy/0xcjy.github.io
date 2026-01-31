// 全局变量
let arrayData = []; // 存储当前数组
let originalArray = []; // 存储原始数组（用于重置）
let sortingInProgress = false; // 排序是否正在进行
let sortingInterval = null; // 自动排序的间隔
let currentStep = 0; // 当前排序步骤
let outerIndex = 0; // 外层循环索引
let innerIndex = 0; // 内层循环索引
let swapCount = 0; // 交换次数
let sortDirection = 'ascending'; // 排序方向
let sortSpeed = 5; // 排序速度（1-10）
let isAnimating = false; // 是否正在执行动画
let isComparing = false; // 是否正在比较元素

// DOM元素
let chartArea;
let arrayInput;
let generateRandomBtn;
let applyArrayBtn;
let startSortBtn;
let stepSortBtn;
let resetSortBtn;
let sortDirectionSelect;
let speedSlider;
let speedValue;
let currentOperationDiv;
let swapCountDiv;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM元素
    chartArea = d3.select('#chart-area');
    arrayInput = document.getElementById('array-input');
    generateRandomBtn = document.getElementById('generate-random');
    applyArrayBtn = document.getElementById('apply-array');
    startSortBtn = document.getElementById('start-sort');
    stepSortBtn = document.getElementById('step-sort');
    resetSortBtn = document.getElementById('reset-sort');
    sortDirectionSelect = document.getElementById('sort-direction');
    speedSlider = document.getElementById('speed-slider');
    speedValue = document.getElementById('speed-value');
    currentOperationDiv = document.getElementById('current-operation');
    swapCountDiv = document.getElementById('swap-count');
    
    // 生成默认随机数组
    generateRandomArray();
    // 初始化图表
    updateVisualization();
    // 设置事件监听器
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    generateRandomBtn.addEventListener('click', generateRandomArray);
    applyArrayBtn.addEventListener('click', applyCustomArray);
    startSortBtn.addEventListener('click', toggleSorting);
    stepSortBtn.addEventListener('click', stepSort);
    resetSortBtn.addEventListener('click', resetSort);
    sortDirectionSelect.addEventListener('change', () => {
        sortDirection = sortDirectionSelect.value;
    });
    speedSlider.addEventListener('input', () => {
        sortSpeed = parseInt(speedSlider.value);
        speedValue.textContent = sortSpeed;
        if (sortingInterval) {
            clearInterval(sortingInterval);
            startAutoSorting(); // 重新开始自动排序以应用新速度
        }
    });
}

// 生成随机数组
function generateRandomArray() {
    const length = Math.floor(Math.random() * 12) + 8; // 5-14个元素
    arrayData = [];
    for (let i = 0; i < length; i++) {
        arrayData.push(Math.floor(Math.random() * 90) + 10); // 10-99的随机数
    }
    originalArray = [...arrayData];
    arrayInput.value = arrayData.join(',');
    resetSortingState();
    updateVisualization();
    currentOperationDiv.textContent = '已生成随机数组';
}

// 应用自定义数组
function applyCustomArray() {
    const input = arrayInput.value.trim();
    if (!input) {
        alert('请输入数组！');
        return;
    }
    
    const values = input.split(',').map(val => {
        const num = parseInt(val.trim());
        return isNaN(num) ? null : num;
    });
    
    if (values.some(val => val === null)) {
        alert('请输入有效的数字，用逗号分隔！');
        return;
    }
    
    arrayData = values;
    originalArray = [...arrayData];
    resetSortingState();
    updateVisualization();
    currentOperationDiv.textContent = '已应用自定义数组';
}

// 重置排序状态
function resetSortingState() {
    if (sortingInterval) {
        clearInterval(sortingInterval);
        sortingInterval = null;
    }
    sortingInProgress = false;
    currentStep = 0;
    outerIndex = 0;
    innerIndex = 0;
    swapCount = 0;
    startSortBtn.textContent = '开始排序';
    swapCountDiv.textContent = `交换次数: 0`;
}

// 重置排序
function resetSort() {
    arrayData = [...originalArray];
    resetSortingState();
    isComparing = false; // 重置比较状态
    updateVisualization();
    currentOperationDiv.textContent = '已重置数组';
}

// 切换排序状态（开始/暂停）
function toggleSorting() {
    if (sortingInProgress) {
        // 暂停排序
        clearInterval(sortingInterval);
        sortingInterval = null;
        sortingInProgress = false;
        startSortBtn.textContent = '继续排序';
    } else {
        // 开始排序
        sortingInProgress = true;
        startSortBtn.textContent = '暂停排序';
        startAutoSorting();
    }
}

// 开始自动排序
function startAutoSorting() {
    if (sortingInterval) {
        clearInterval(sortingInterval);
    }
    
    // 计算速度（毫秒）：速度越高，间隔越短
    const intervalTime = 1300 - (sortSpeed * 120);
    
    sortingInterval = setInterval(() => {
        if (isAnimating) return; // 如果动画正在进行，则跳过此步骤
        
        const completed = performSortStep();
        if (completed) {
            clearInterval(sortingInterval);
            sortingInterval = null;
            sortingInProgress = false;
            startSortBtn.textContent = '开始排序';
            currentOperationDiv.textContent = '排序完成！';
        }
    }, intervalTime);
}

// 单步执行排序
function stepSort() {
    if (!sortingInProgress) {
        sortingInProgress = true;
        startSortBtn.textContent = '继续排序';
    }
    
    if (sortingInterval) {
        clearInterval(sortingInterval);
        sortingInterval = null;
    }
    
    const completed = performSortStep();
    if (completed) {
        sortingInProgress = false;
        startSortBtn.textContent = '开始排序';
        currentOperationDiv.textContent = '排序完成！';
    }
}

// 执行一步冒泡排序
function performSortStep() {
    const n = arrayData.length;
    
    // 检查排序是否已完成
    if (outerIndex >= n - 1) {
        // 标记所有元素为已排序
        updateVisualization([], [], Array.from({ length: n }, (_, i) => i));
        return true;
    }
    
    // 重置内层循环索引（如果需要）
    if (innerIndex >= n - outerIndex - 1) {
        outerIndex++;
        innerIndex = 0;
        
        // 再次检查是否完成
        if (outerIndex >= n - 1) {
            updateVisualization([], [], Array.from({ length: n }, (_, i) => i));
            return true;
        }
    }
    
    // 获取当前比较的元素
    const a = arrayData[innerIndex];
    const b = arrayData[innerIndex + 1];
    
    // 检查是否处于比较状态
    if (!isComparing) {
        // 更新可视化，显示当前比较的元素
        updateVisualization([innerIndex, innerIndex + 1], [], Array.from({ length: outerIndex }, (_, i) => n - 1 - i));
        
        // 显示比较操作
        currentOperationDiv.textContent = `比较第 ${innerIndex + 1} 和第 ${innerIndex + 2} 个元素`;
        
        // 设置为比较状态
        isComparing = true;
        
        return false; // 排序未完成，等待下一步
    }
    
    // 重置比较状态
    isComparing = false;
    
    // 根据排序方向比较元素
    let shouldSwap = false;
    if (sortDirection === 'ascending') {
        shouldSwap = a > b;
    } else {
        shouldSwap = a < b;
    }
    
    // 如果需要交换
    if (shouldSwap) {
        // 显示交换操作
        currentOperationDiv.textContent = `交换第 ${innerIndex + 1} 和第 ${innerIndex + 2} 个元素`;
        
        // 使用动画交换元素
        animateSwap(innerIndex, innerIndex + 1, () => {
            // 更新可视化，显示交换后的元素
            updateVisualization([], [], Array.from({ length: outerIndex }, (_, i) => n - 1 - i));
            
            // 移动到下一对元素
            innerIndex++;
        });
        
        return false; // 排序未完成，但需要等待动画
    } else {
        // 移动到下一对元素
        innerIndex++;
    }
    
    return false; // 排序未完成
}

// 交换动画
function animateSwap(index1, index2, onComplete) {
    isAnimating = true; // 设置动画状态为进行中
    
    // 获取当前SVG和比例尺
    const svg = chartArea.select('svg');
    const width = chartArea.node().getBoundingClientRect().width;
    const height = chartArea.node().getBoundingClientRect().height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    
    const xScale = d3.scaleBand()
        .domain(d3.range(arrayData.length))
        .range([padding.left, width - padding.right])
        .padding(0.1);
    
    // 限制柱子的最大宽度为80px
    const barWidth = Math.min(xScale.bandwidth(), 80);
    
    // 获取要交换的两个柱子
    const bar1 = svg.selectAll('rect').filter((d, i) => i === index1);
    const bar2 = svg.selectAll('rect').filter((d, i) => i === index2);
    
    // 获取要交换的两个数值标签
    const text1 = svg.selectAll('text:not(.index-label)').filter((d, i) => i === index1);
    const text2 = svg.selectAll('text:not(.index-label)').filter((d, i) => i === index2);
    
    // 计算交换的位置（考虑柱子居中）
    const x1 = xScale(index1) + (xScale.bandwidth() - barWidth) / 2;
    const x2 = xScale(index2) + (xScale.bandwidth() - barWidth) / 2;
    
    // 设置动画时间（与排序速度相关）
    const duration = 1000 - (sortSpeed * 80);
    
    // 添加交换类
    bar1.classed('swapping', true);
    bar2.classed('swapping', true);
    
    // 保存要交换的值
    const temp = arrayData[index1];
    
    // 执行动画
    bar1.transition()
        .duration(duration)
        .attr('x', x2);
        
    text1.transition()
        .duration(duration)
        .attr('x', x2 + xScale.bandwidth() / 2);
        
    bar2.transition()
        .duration(duration)
        .attr('x', x1)
        .on('end', function() {
            // 动画完成后执行回调
            arrayData[index1] = arrayData[index2];
            arrayData[index2] = temp;
            swapCount++;
            swapCountDiv.textContent = `交换次数: ${swapCount}`;
            
            isAnimating = false; // 设置动画状态为已完成
            
            if (onComplete) onComplete();
        });
        
    text2.transition()
        .duration(duration)
        .attr('x', x1 + xScale.bandwidth() / 2);
}

// 更新可视化
function updateVisualization(comparingIndices = [], swappingIndices = [], sortedIndices = []) {
    // 清空图表
    chartArea.selectAll('*').remove();
    
    // 设置图表尺寸
    const width = chartArea.node().getBoundingClientRect().width;
    const height = chartArea.node().getBoundingClientRect().height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    
    // 创建SVG
    const svg = chartArea.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // 如果没有数据，则不绘制
    if (arrayData.length === 0) return;
    
    // 计算比例尺
    const xScale = d3.scaleBand()
        .domain(d3.range(arrayData.length))
        .range([padding.left, width - padding.right])
        .padding(0.1);
        
    // 限制柱子的最大宽度为80px
    const barWidth = Math.min(xScale.bandwidth(), 80);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(arrayData) * 1.1])
        .range([height - padding.bottom, padding.top]);
    
    // 绘制柱状图
    svg.selectAll('rect')
        .data(arrayData)
        .enter()
        .append('rect')
        .attr('class', (d, i) => {
            if (swappingIndices.includes(i)) return 'bar swapping';
            if (comparingIndices.includes(i)) return 'bar comparing';
            if (sortedIndices.includes(i)) return 'bar sorted';
            return 'bar';
        })
        .attr('x', (d, i) => xScale(i) + (xScale.bandwidth() - barWidth) / 2) // 居中显示柱子
        .attr('y', d => yScale(d))
        .attr('width', barWidth) // 使用限制后的宽度
        .attr('height', d => height - padding.bottom - yScale(d))
        .attr('rx', 4) // 圆角矩形
        .attr('ry', 4);
    
    // 添加数值标签
    svg.selectAll('text')
        .data(arrayData)
        .enter()
        .append('text')
        .text(d => d)
        .attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // 添加索引标签
    svg.selectAll('.index-label')
        .data(arrayData)
        .enter()
        .append('text')
        .attr('class', 'index-label')
        .text((d, i) => i + 1)
        .attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
        .attr('y', height - padding.bottom + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px');
}