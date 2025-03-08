let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;

// ✅ 监听 `DOMContentLoaded` 事件，确保 HTML 加载完毕后运行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
    } catch (error) {
        console.error("Error loading data:", error);
    }
});

// ✅ 异步加载数据
async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    processCommits();
    updateTimeScale();
    displayStats();
    createScatterplot();
    brushSelector();
}

// ✅ 确保 `timeScale` 在数据加载后才计算
function updateTimeScale() {
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);
}

// ✅ 处理提交数据
function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];

            return {
                id: commit,
                url: `https://github.com/YOUR_REPO/commit/${commit}`,
                author: first.author,
                date: first.date,
                time: first.time,
                timezone: first.timezone,
                datetime: first.datetime,
                hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
                totalLines: lines.length,
                lines,
            };
        });

    filterCommitsByTime(); // 确保 `filteredCommits` 被正确初始化
}

// ✅ 绑定滑块和时间显示
const commitSlider = d3.select('#commit-slider');
const selectedTime = d3.select('#selectedTime');

// ✅ 过滤提交数据
function filterCommitsByTime() {
    if (!commits || commits.length === 0) {
        console.warn("No commits available for filtering.");
        return;
    }
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

// ✅ 更新滑块对应的时间并触发过滤 & 重新绘图
function updateSelectedTime() {
    commitMaxTime = timeScale.invert(commitProgress);
    selectedTime.text(commitMaxTime.toLocaleString());
    filterCommitsByTime();
    updateScatterPlot(filteredCommits);
}

// ✅ 监听滑块事件
commitSlider.on('input', function () {
    commitProgress = +this.value;
    updateSelectedTime();
});

// ✅ 显示统计信息
function displayStats() {
    if (!data || data.length === 0) {
        console.warn("No data available for stats.");
        return;
    }

    d3.select('#stats').html('');

    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').text('Total LOC');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);

    const fileCount = d3.group(data, d => d.file).size;
    dl.append('dt').text('Total Files');
    dl.append('dd').text(fileCount);
}

// ✅ 创建散点图
let xScale, yScale;

function createScatterplot() {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 50, left: 50 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7);
}

const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
circle.setAttribute("cx", "50");
circle.setAttribute("cy", "50");
circle.setAttribute("r", "30");
circle.style.setProperty("--r", "30");
document.querySelector("svg").appendChild(circle);

// ✅ 更新散点图，仅绘制 `filteredCommits`
function updateScatterPlot(filteredCommits) {
    if (!filteredCommits || filteredCommits.length === 0) {
        console.warn("No commits to display.");
        return;
    }

    const svg = d3.select('#chart svg');
    const dots = svg.select('.dots');

    const circles = dots.selectAll('circle')
        .data(filteredCommits, d => d.id);

    circles
        .join(
            enter => enter.append('circle')
                .attr('cx', d => xScale(d.datetime))
                .attr('cy', d => yScale(d.hourFrac))
                .attr('r', 0)
                .attr('fill', 'steelblue')
                .style('fill-opacity', 0.7)
                .call(enter => enter.transition().duration(200).attr('r', d => d.totalLines)),
            update => update.transition().duration(200)
                .attr('cx', d => xScale(d.datetime))
                .attr('cy', d => yScale(d.hourFrac)),
            exit => exit.transition().duration(200).attr('r', 0).remove()
        );
}
