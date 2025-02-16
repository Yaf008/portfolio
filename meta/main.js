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
    commits = d3.groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0]; // Get the first row of the commit
  
        let { author, date, time, timezone, datetime } = first;
  
        let ret = {
          id: commit,
          url: 'https://github.com/YOUR_REPO/commit/' + commit, // Replace with your warehouse
          author,
          date,
          time,
          timezone,
          datetime,
          // Calculation hours (e.g. 14:30 = 14.5)
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          // Count the number of rows modified by the commit
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
  


  function displayStats() {
   
    processCommits();
  
    
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    
  
   // 代码总行数
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Total number of submissions
    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);
  
    
    const fileCount = d3.group(data, d => d.file).size;
    dl.append('dt').text('Total Files');
    dl.append('dd').text(fileCount);
  
    
    const maxFileLength = d3.max(data, d => d.line);
    dl.append('dt').text('Longest File (Lines)');
    dl.append('dd').text(maxFileLength);
  

    const fileLengths = d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    );
    const avgFileLength = d3.mean(fileLengths, d => d[1]);
    dl.append('dt').text('Average File Length (Lines)');
    dl.append('dd').text(avgFileLength.toFixed(2));
  
   
    const avgLineLength = d3.mean(data, d => d.length);
    dl.append('dt').text('Average Line Length (Characters)');
    dl.append('dd').text(avgLineLength.toFixed(2));
  
 
    const maxLineLength = d3.max(data, d => d.length);
    dl.append('dt').text('Longest Line (Characters)');
    dl.append('dd').text(maxLineLength);
  

    const maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Maximum Depth');
    dl.append('dd').text(maxDepth);
  
 
    const workByPeriod = d3.rollups(
      data,
      v => v.length,
      d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
    dl.append('dt').text('Most Active Time of Day');
    dl.append('dd').text(maxPeriod);
  

    const workByDay = d3.rollups(
      data,
      v => v.length,
      d => new Date(d.datetime).toLocaleString('en', { weekday: 'long' })
    );
    const maxDay = d3.greatest(workByDay, d => d[1])?.[0];
    dl.append('dt').text('Most Active Day of the Week');
    dl.append('dd').text(maxDay);
  }
  


  let xScale, yScale; // Declare globally so it can be used in brushing

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
  
    // ✅ Use global xScale & yScale
    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);

    
    // ✅ Fix Area Scaling: Change from scaleLinear() to scaleSqrt()
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  
    const rScale = d3
      .scaleSqrt() // Use square root scale for proper area scaling
      .domain([minLines, maxLines])
      .range([2, 30]); // Adjust range based on visual testing
  
    // ✅ Sort commits by totalLines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  
    // Create dots
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
  
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d % 24}:00`);
    svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);
  }
  
  

  
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

   


  let brushSelection = null; // Global brush selection

  function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  }

  function brushSelector() {
  const svg = document.querySelector('svg');

  d3.select(svg)
    .call(d3.brush().on('start brush end', brushed));

  // Raise dots above brush overlay
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
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(d));
  }
  