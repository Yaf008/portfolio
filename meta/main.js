let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let xScale, yScale;
let brushSelection = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
    } catch (error) {
        console.error("Error loading data:", error);
    }
});

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
    setupSlider();
}

function processCommits() {
    commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
        const first = lines[0];
        return {
            id: commit,
            url: `https://github.com/YOUR_REPO/commit/${commit}`,
            author: first.author,
            date: first.date,
            datetime: first.datetime,
            hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
            totalLines: lines.length,
            lines: Object.freeze(lines)
        };
    });
}

function updateTimeScale() {
    timeScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([0, 100]);
    commitMaxTime = timeScale.invert(commitProgress);
}

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

function displayStats() {
    const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');

    const statsData = {
        'Total LOC': data.length,
        'Total Commits': commits.length,
        'Total Files': d3.group(data, d => d.file).size,
        'Longest Line': d3.max(data, d => d.length),
        'Maximum Depth': d3.max(data, d => d.depth),
        'Most Active Time': d3.greatest(
            d3.rollups(data, v => v.length, 
            d => d.datetime.toLocaleString('en', { dayPeriod: 'short' }))
            [0],
        'Most Active Day':  d3.greatest(
            d3.rollups(data, v => v.length,
            d => d.datetime.toLocaleString('en', { weekday: 'long' }))
            [0]
    };

    Object.entries(statsData).forEach(([label, value]) => {
        dl.append('dt').text(label);
        dl.append('dd').text(value);
    });
}

function createScatterplot() {
    const width = 1000;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };

    const svg = d3.select('#chart').append('svg')
        .attr('width', width)
        .attr('height', height);

    xScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([height - margin.bottom, margin.top]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(commits, d => d.totalLines))
        .range([2, 20]);

    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d % 24}:00`));

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

function updateScatterPlot(filteredData) {
    d3.select('#chart svg').selectAll('circle')
        .data(filteredData, d => d.id)
        .join(
            enter => enter.append('circle')
                .call(enter => enter.transition().duration(200)
                    .attr('cx', d => xScale(d.datetime))
                    .attr('cy', d => yScale(d.hourFrac))
                    .attr('r', 0)
                    .attr('r', d => rScale(d.totalLines))),
            update => update,
            exit => exit.remove()
        );
}

function brushSelector() {
    const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on('brush', brushed)
        .on('end', brushended);

    d3.select('svg').call(brush);
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', d => 
        selection && xScale(d.datetime) >= selection[0][0] &&
        xScale(d.datetime) <= selection[1][0] &&
        yScale(d.hourFrac) >= selection[0][1] &&
        yScale(d.hourFrac) <= selection[1][1]
    );
}

function showTooltip(event, d) {
    d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .html(`
            Commit: ${d.id}<br>
            Author: ${d.author}<br>
            Date: ${d.datetime.toLocaleDateString()}<br>
            Lines: ${d.totalLines}
        `)
        .style('opacity', 1);
}

function hideTooltip() {
    d3.select('#tooltip').style('opacity', 0);
}