let data = [];
let commits = [];
let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;

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
}

// ✅ 监听 `DOMContentLoaded` 事件，确保 HTML 加载完毕再运行 JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

// ✅ 绑定滑块和时间显示
const commitSlider = d3.select('#commit-slider');
const selectedTime = d3.select('#selectedTime');

// ✅ 更新滑块对应的时间
function updateSelectedTime() {
    commitMaxTime = timeScale.invert(commitProgress);
    selectedTime.text(commitMaxTime.toLocaleString());
}

// ✅ 监听滑块事件，实时更新时间 & 过滤数据
commitSlider.on('input', function () {
    commitProgress = +this.value;
    updateSelectedTime();
    filterCommits();
});

// ✅ 过滤数据并更新可视化
function filterCommits() {
  let commitMaxTime = timeScale.invert(commitProgress);
  
  // 直接从 `commits` 重新筛选数据，而不是基于已经过滤的数据
  let filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  updateScatterPlot(filteredCommits);
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

    const xAxis = d3.axisBottom(xScale).ticks(6);
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d % 24}:00`);
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
}

// ✅ 更新散点图
function updateScatterPlot(filteredCommits) {
    const svg = d3.select('#chart svg');
    const dots = svg.select('.dots');

    if (filteredCommits.length === 0) {
        console.warn("No commits to display.");
        return;
    }

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
            exit => exit.transition()
                .duration(200)
                .style('opacity', 0)  // 先让它透明，而不是直接删除
                .remove()
        );
}

// ✅ 显示统计信息（**确保在 `main.js` 中声明**）
function displayStats() {
    console.log("displayStats() called");
    // 确保 commits 数据已处理
    processCommits();

    // 清除现有统计数据，防止重复渲染
    d3.select('#stats').html('');

    // 创建统计信息列表
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // ✅ 代码总行数
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // ✅ 提交次数
    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);

    // ✅ 代码库文件数量
    const fileCount = d3.group(data, d => d.file).size;
    dl.append('dt').text('Total Files');
    dl.append('dd').text(fileCount);

    // ✅ 最大文件长度（以行计）
    const maxFileLength = d3.max(data, d => d.line);
    dl.append('dt').text('Longest File (Lines)');
    dl.append('dd').text(maxFileLength);

    // ✅ 平均文件长度（以行计）
    const fileLengths = d3.rollups(
        data,
        v => d3.max(v, d => d.line),
        d => d.file
    );
    const avgFileLength = d3.mean(fileLengths, d => d[1]);
    dl.append('dt').text('Average File Length (Lines)');
    dl.append('dd').text(avgFileLength.toFixed(2));

    // ✅ 平均行长（以字符计）
    const avgLineLength = d3.mean(data, d => d.length);
    dl.append('dt').text('Average Line Length (Characters)');
    dl.append('dd').text(avgLineLength.toFixed(2));

    // ✅ 最长的行（以字符计）
    const maxLineLength = d3.max(data, d => d.length);
    dl.append('dt').text('Longest Line (Characters)');
    dl.append('dd').text(maxLineLength);

    // ✅ 最大深度
    const maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Maximum Depth');
    dl.append('dd').text(maxDepth);

    // ✅ 一天中大部分工作完成的时间
    const workByPeriod = d3.rollups(
        data,
        v => v.length,
        d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
    dl.append('dt').text('Most Active Time of Day');
    dl.append('dd').text(maxPeriod);

    // ✅ 一周中工作最多的一天
    const workByDay = d3.rollups(
        data,
        v => v.length,
        d => new Date(d.datetime).toLocaleString('en', { weekday: 'long' })
    );
    const maxDay = d3.greatest(workByDay, d => d[1])?.[0];
    dl.append('dt').text('Most Active Day of the Week');
    dl.append('dd').text(maxDay);
}