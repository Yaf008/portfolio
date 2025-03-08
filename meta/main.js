// main.js
let data = [];
let commits = [];
let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let xScale, yScale;

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
    timeScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([0, 100]);
    initSlider();
    updateDisplay();
    brushSelector();
}

function processCommits() {
    commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
        const first = lines[0];
        return {
            id: commit,
            url: `https://github.com/YOUR_REPO/commit/${commit}`,
            author: first.author,
            datetime: first.datetime,
            hourFrac: first.datetime.getHours() + first.datetime.getMinutes()/60,
            totalLines: lines.length,
            lines: lines
        };
    });
}

function initSlider() {
    const slider = d3.select('#commit-slider');
    slider.on('input', function() {
        commitProgress = this.value;
        updateDisplay();
    });
}

function updateDisplay() {
    const commitMaxTime = timeScale.invert(commitProgress);
    d3.select('#selectedTime').text(commitMaxTime.toLocaleDateString('en', {
        dateStyle: "long",
        timeStyle: "short"
    }));
    
    const filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
    updateScatterplot(filteredCommits);
    displayStats(filteredCommits);
    updateLanguageBreakdown();
}

function displayStats(commitsToShow = commits) {
    const dl = d3.select('#stats').selectAll('dl').data([null]).join('dl').attr('class', 'stats');
    
    dl.selectAll('*').remove();
    
    // 统计项目（保持原有显示逻辑）
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);
    
    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commitsToShow.length);
    
    // 其他统计项目...
}

function updateScatterplot(filteredCommits) {
    d3.select('svg').remove();
    
    const width = 1000, height = 600;
    const margin = { top: 10, right: 10, bottom: 50, left: 50 };
    const svg = d3.select('#chart').append('svg')
        .attr('width', width)
        .attr('height', height);

    // 比例尺
    xScale = d3.scaleTime()
        .domain(d3.extent(filteredCommits, d => d.datetime))
        .range([margin.left, width - margin.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([height - margin.bottom, margin.top]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(filteredCommits, d => d.totalLines))
        .range([2, 30]);

    // 散点
    const dots = svg.append('g')
        .selectAll('circle')
        .data(filteredCommits)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', function(event, d) {
            d3.select(this).classed('hover', true);
            updateTooltipContent(d);
            d3.select('#commit-tooltip').style('display', 'block');
        })
        .on('mousemove', function(event) {
            d3.select('#commit-tooltip')
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY + 10}px`);
        })
        .on('mouseleave', function() {
            d3.select(this).classed('hover', false);
            d3.select('#commit-tooltip').style('display', 'none');
        });

    // 坐标轴
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d % 24}:00`));
}

function brushSelector() {
    const brush = d3.brush()
        .on('start brush end', brushed);
    
    d3.select('svg')
        .call(brush)
        .selectAll('.overlay')
        .style('pointer-events', 'all');
}

function brushed(event) {
    selectedCommits = event.selection ? commits.filter(d => {
        const [[x0, y0], [x1, y1]] = event.selection;
        const x = xScale(d.datetime);
        const y = yScale(d.hourFrac);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    }) : [];
    
    d3.selectAll('circle')
        .classed('selected', d => selectedCommits.includes(d));
    
    updateLanguageBreakdown();
}

function updateLanguageBreakdown() {
    const container = d3.select('#language-breakdown');
    container.selectAll('*').remove();
    
    if (selectedCommits.length === 0) return;
    
    const lines = selectedCommits.flatMap(d => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);
    
    breakdown.forEach((count, type) => {
        container.append('dt').text(type);
        container.append('dd').text(`${count} lines (${d3.format('.1%')(count/lines.length)})`);
    });
}

function updateTooltipContent(commit) {
    d3.select('#commit-link')
        .attr('href', commit.url)
        .text(commit.id.slice(0, 7));
    
    d3.select('#commit-date')
        .text(commit.datetime.toLocaleDateString('en', { dateStyle: 'full' }));
    
    d3.select('#commit-time')
        .text(commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' }));
    
    d3.select('#commit-author').text(commit.author);
    d3.select('#commit-lines').text(`${commit.totalLines} lines`);
}

// 初始化
document.addEventListener('DOMContentLoaded', loadData);