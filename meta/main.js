let data = [];
let commits = [];
let selectedCommits = [];
let brushSelection = null; // 用于存储 brush 的选择范围

// 加载数据
async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  processCommits(); // 处理提交数据
  displayStats(); // 显示统计信息
  createScatterplot(); // 创建散点图
  brushSelector(); // 初始化 brush
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

// 处理提交数据
function processCommits() {
  commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let first = lines[0]; // 获取提交的第一行数据

    let { author, date, time, timezone, datetime } = first;

    let ret = {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit, // 替换为你的仓库地址
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60, // 计算小时（例如 14:30 = 14.5）
      totalLines: lines.length, // 计算提交修改的行数
    };

    // 定义不可枚举的 lines 属性
    Object.defineProperty(ret, 'lines', {
      value: lines,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return ret;
  });
}

// 显示统计信息
function displayStats() {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // 代码总行数
  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // 总提交数
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  // 总文件数
  const fileCount = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Total Files');
  dl.append('dd').text(fileCount);

  // 最长文件（行数）
  const maxFileLength = d3.max(data, (d) => d.line);
  dl.append('dt').text('Longest File (Lines)');
  dl.append('dd').text(maxFileLength);

  // 平均文件长度（行数）
  const fileLengths = d3.rollups(data, (v) => d3.max(v, (d) => d.line), (d) => d.file);
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Average File Length (Lines)');
  dl.append('dd').text(avgFileLength.toFixed(2));

  // 平均行长度（字符数）
  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append('dt').text('Average Line Length (Characters)');
  dl.append('dd').text(avgLineLength.toFixed(2));

  // 最长行（字符数）
  const maxLineLength = d3.max(data, (d) => d.length);
  dl.append('dt').text('Longest Line (Characters)');
  dl.append('dd').text(maxLineLength);

  // 最大深度
  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Maximum Depth');
  dl.append('dd').text(maxDepth);

  // 一天中最活跃的时间段
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most Active Time of Day');
  dl.append('dd').text(maxPeriod);

  // 一周中最活跃的天
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' })
  );
  const maxDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append('dt').text('Most Active Day of the Week');
  dl.append('dd').text(maxDay);
}

// 创建散点图
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

  // 定义 x 和 y 比例尺
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // 定义半径比例尺
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // 创建散点
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
      d3.select(this).classed('selected', isCommitSelected(d));
    })
    .on('mousemove', function (event) {
      updateTooltipPosition(event);
    })
    .on('mouseleave', function () {
      updateTooltipVisibility(false);
      d3.select(this).classed('selected', isCommitSelected(d));
    });

  // 添加坐标轴
  const xAxis = d3.axisBottom(xScale).ticks(6);
  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d % 24}:00`);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);
}

// 更新 tooltip 内容
function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit || !commit.id) {
    document.getElementById('commit-tooltip').style.display = 'none';
    return;
  }

  document.getElementById('commit-tooltip').style.display = 'block';

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' });
  time.textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

// 更新 tooltip 可见性
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// 更新 tooltip 位置
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// 初始化 brush
function brushSelector() {
  const svg = document.querySelector('svg');

  d3.select(svg)
    .call(
      d3.brush()
        .extent([
          [xScale.range()[0], yScale.range()[1]],
          [xScale.range()[1], yScale.range()[0]],
        ])
        .on('start brush end', brushed)
    );
}

// 处理 brush 事件
function brushed(event) {
  if (!event.selection) {
    selectedCommits = [];
  } else {
    const [[x0, y0], [x1, y1]] = event.selection;
    selectedCommits = commits.filter((commit) => {
      const x = xScale(commit.datetime);
      const y = yScale(commit.hourFrac);
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });
  }

  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

// 更新选中状态
function updateSelection() {
  d3.selectAll('circle')
    .classed('selected', (d) => selectedCommits.includes(d));
}

// 更新选中提交的数量
function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
}

// 更新语言分布
function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

// 判断提交是否被选中
function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}