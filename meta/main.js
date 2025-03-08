let data = [];
let commits = [];
let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    processCommits();  // 先处理提交数据
    updateTimeScale(); // 再更新时间比例尺
    displayStats();
    createScatterplot();
    brushSelector();
}

// 更新时间比例尺
function updateTimeScale() {
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);
}

// 监听 `DOMContentLoaded` 事件，加载数据
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

// 处理提交数据
function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0]; // 获取提交的第一行数据

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
}

// 绑定滑块和时间显示
const commitSlider = d3.select('#commit-slider');
const selectedTime = d3.select('#selectedTime');

// **初始化时间显示**
function updateSelectedTime() {
    commitMaxTime = timeScale.invert(commitProgress);
    selectedTime.text(commitMaxTime.toLocaleString());
}

// **滑块交互：更新时间并过滤数据**
commitSlider.on('input', function () {
    commitProgress = +this.value;
    updateSelectedTime();
    filterCommits(); // 过滤数据并更新可视化
});

// **过滤数据并更新可视化**
function filterCommits() {
    let commitMaxTime = timeScale.invert(commitProgress);
    let filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    updateScatterPlot(filteredCommits); // 重新渲染散点图
}

// **创建散点图**
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

    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', function (event, d) {
            updateTooltipContent(d);
            updateTooltipVisibility(true);
        })
        .on('mousemove', function (event) {
            updateTooltipPosition(event);
        })
        .on('mouseleave', function () {
            updateTooltipVisibility(false);
        });

    // 添加 X 轴
    const xAxis = d3.axisBottom(xScale).ticks(6);
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // 添加 Y 轴
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d % 24}:00`);
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
}

// **更新散点图**
function updateScatterPlot(filteredCommits) {
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
