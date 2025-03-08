// 完整代码（包含原有和修改部分）
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

    processCommits();
    updateTimeScale();
    displayStats();
    createScatterplot();
    brushSelector();
}

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

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

// 工具提示功能
function updateTooltipContent(d) {
    d3.select('#commit-tooltip')
        .select('#commit-link')
        .attr('href', d.url)
        .text(d.id.substring(0, 6));
    d3.select('#commit-date').text(d.date.toDateString());
    d3.select('#commit-time').text(d.datetime.toLocaleTimeString());
    d3.select('#commit-author').text(`Author: ${d.author}`);
    d3.select('#commit-lines').text(`Lines: ${d.totalLines}`);
}

function updateTooltipVisibility(visible) {
    d3.select('#commit-tooltip').attr('hidden', !visible);
}

function updateTooltipPosition(event) {
    d3.select('#commit-tooltip')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`);
}

// 时间筛选功能
function filterCommits() {
    if (!timeScale || commits.length === 0) return;
    
    commitMaxTime = timeScale.invert(commitProgress);
    const filtered = commits.filter(d => d.datetime <= commitMaxTime);
    updateScatterPlot(filtered);
    updateSelectedTime();
}

function updateTimeScale() {
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);
    commitMaxTime = timeScale.invert(commitProgress);
}

function updateSelectedTime() {
    selectedTime.text(d3.timeFormat("%Y-%m-%d %H:%M")(commitMaxTime));
}

// ✅ 创建 Y 轴网格线
function addHorizontalGridlines(svg, yScale, width, usableArea) {
  svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale)
          .tickSize(-width + usableArea.left + usableArea.right)  // 让刻度线变成长线
          .tickFormat("")  // 隐藏刻度标签
      )
      .selectAll("line")
      .attr("stroke", "#ddd")  // 颜色
      .attr("stroke-opacity", 0.7)  // 透明度
      .attr("shape-rendering", "crispEdges");  // 保持清晰
}

// ✅ 在 `createScatterplot()` 内调用它
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

  // ✅ 添加背景网格线
  addHorizontalGridlines(svg, yScale, width, usableArea);

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

// 散点图相关
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

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible');

    xScale = d3.scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 15]);

    const dots = svg.append('g').attr('class', 'dots');

    dots.selectAll('circle')
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
        .on('mousemove', updateTooltipPosition)
        .on('mouseleave', () => updateTooltipVisibility(false));

    // 添加坐标轴
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(d3.axisBottom(xScale).ticks(6));

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d % 24}:00`));
}

function updateScatterPlot(filteredCommits) {
    const circles = d3.select('.dots')
        .selectAll('circle')
        .data(filteredCommits, d => d.id);

    circles.join(
        enter => enter.append('circle')
            .attr('cx', d => xScale(d.datetime))
            .attr('cy', d => yScale(d.hourFrac))
            .attr('r', 0)
            .transition().duration(200)
            .attr('r', d => rScale(d.totalLines)),
        update => update,
        exit => exit.transition().duration(200)
            .attr('r', 0)
            .remove()
    );
}


// ✅ 显示统计信息（**确保在 `main.js` 中声明**）
function displayStats() {
    d3.select('#stats').html('');
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);
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

d3.select('#commit-slider')
    .on('input', function() {
        commitProgress = +this.value;
        filterCommits();
    });