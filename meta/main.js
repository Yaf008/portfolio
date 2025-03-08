// 全局变量声明
let data = [];
let commits = [];
let filteredCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let xScale, yScale, rScale;
let brushSelection = null;

// 可视化参数
const width = 1000;
const height = 600;
const margin = { top: 20, right: 30, bottom: 50, left: 60 };

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
        setupSlider();
    } catch (error) {
        console.error("初始化失败:", error);
        alert("数据加载失败，请检查控制台日志");
    }
});

// 数据加载处理
async function loadData() {
    try {
        data = await d3.csv('loc.csv', rowParser);
        if (!data.length) throw new Error('数据集为空');
        
        processCommits();
        updateTimeScale();
        displayStats();
        createScatterplot();
        brushSelector();
    } catch (error) {
        throw new Error(`数据加载失败: ${error.message}`);
    }
}

// CSV行解析器
function rowParser(row) {
    return {
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        datetime: new Date(row.datetime),
        file: row.file.trim()
    };
}

// 处理提交数据
function processCommits() {
    commits = d3.groups(data, d => d.commit)
        .map(([commit, lines]) => ({
            id: commit,
            url: `https://github.com/YOUR_REPO/commit/${commit}`,
            author: lines[0].author,
            datetime: lines[0].datetime,
            hourFrac: lines[0].datetime.getHours() + 
                     lines[0].datetime.getMinutes() / 60,
            totalLines: lines.length,
            lines: Object.freeze(lines)
        }));
}

// 更新时间比例尺
function updateTimeScale() {
    timeScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([0, 100])
        .nice();
    commitMaxTime = timeScale.invert(commitProgress);
}

// 统计信息展示
function displayStats() {
    const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');

    const statsData = {
        'Total LOC': data.length,
        'Total Commits': commits.length,
        'Total Files': d3.rollups(data, v => v.length, d => d.file).size,
        'Longest Line': d3.max(data, d => d.length),
        'Maximum Depth': d3.max(data, d => d.depth),
        'Most Active Time': getMostActive('dayPeriod'),
        'Most Active Day': getMostActive('weekday')
    };

    Object.entries(statsData).forEach(([label, value]) => {
        dl.append('dt').text(label);
        dl.append('dd').text(value || 'N/A');
    });
}

// 获取最活跃时段/日期
function getMostActive(type) {
    const formatOpts = {
        dayPeriod: { dayPeriod: 'short' },
        weekday: { weekday: 'long' }
    };
    return d3.greatest(
        d3.rollups(data, 
            v => v.length,
            d => d.datetime.toLocaleString('en', formatOpts[type])
        ),
        d => d[1]
    )?.[0] || 'N/A';
}

// 散点图创建
function createScatterplot() {
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // 比例尺初始化
    xScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([height - margin.bottom, margin.top]);

    rScale = d3.scaleSqrt()
        .domain(d3.extent(commits, d => d.totalLines))
        .range([3, 25]);

    // 坐标轴
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(6));

    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d % 24}:00`));

    // 数据点
    svg.selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('opacity', 0.7)
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip);
}

// 散点图更新
function updateScatterPlot(filteredData) {
    d3.select('#chart svg').selectAll('circle')
        .data(filteredData, d => d.id)
        .join(
            enter => enter.append('circle')
                .call(enter => enter.transition().duration(200)
                    .attr('cx', d => xScale(d.datetime))
                    .attr('cy', d => yScale(d.hourFrac))
                    .attr('r', d => rScale(d.totalLines)),
            update => update,
            exit => exit.remove()
        );
}

// 滑块设置
function setupSlider() {
    const commitSlider = d3.select('#commit-slider');
    const selectedTime = d3.select('#selectedTime');

    commitSlider.on('input', function() {
        commitProgress = +this.value;
        commitMaxTime = timeScale.invert(commitProgress);
        selectedTime.text(commitMaxTime.toLocaleString());
        filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
        updateScatterPlot(filteredCommits);
    });
}

// 刷选功能
function brushSelector() {
    const brush = d3.brush()
        .extent([[margin.left, margin.top], 
                [width - margin.right, height - margin.bottom]])
        .on('brush', brushed)
        .on('end', brushended);

    d3.select('svg').call(brush);
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', d => 
        selection && 
        xScale(d.datetime) >= selection[0][0] &&
        xScale(d.datetime) <= selection[1][0] &&
        yScale(d.hourFrac) >= selection[0][1] &&
        yScale(d.hourFrac) <= selection[1][1]
    );
}

// 工具提示功能
function showTooltip(event, d) {
    d3.select('#tooltip')
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY + 15}px`)
        .html(`
            <strong>提交ID:</strong> ${d.id.slice(0,7)}<br>
            <strong>作者:</strong> ${d.author}<br>
            <strong>时间:</strong> ${d.datetime.toLocaleString()}<br>
            <strong>修改行数:</strong> ${d.totalLines}
        `)
        .style('opacity', 1);
}

function hideTooltip() {
    d3.select('#tooltip').style('opacity', 0);
}