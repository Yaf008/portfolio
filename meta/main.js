let data = [];
let commits = [];

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
  displayStats();
  createScatterplot();
  brushSelector();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

function processCommits() {
  commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let first = lines[0]; 

    let { author, date, time, timezone, datetime } = first;

    let ret = {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit, 
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };

    Object.defineProperty(ret, 'lines', {
      value: lines,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return ret;
  });
}

let xScale, yScale, rScale;  // Declare rScale globally

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

  // ✅ Define rScale for dot size
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines)) // ✅ Now rScale is defined
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7);

  const xAxis = d3.axisBottom(xScale).ticks(6);
  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
  
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d % 24}:00`);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);

  // ✅ Attach a brushable layer
  svg.append("g").attr("class", "brush").call(d3.brush().on("start brush end", brushed));
}

let brushSelection = null; 

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
}

function brushSelector() {
  const svg = d3.select("svg");
  svg.append("g").attr("class", "brush").call(d3.brush().on("start brush end", brushed));

  // ✅ Ensure dots stay above the brush layer
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function isCommitSelected(commit) {
  if (!brushSelection) return false;

  const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
  const max = { x: brushSelection[1][0], y: brushSelection[1][1] };

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

// ✅ Tooltip functions remain the same
function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit.id) {
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

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}
