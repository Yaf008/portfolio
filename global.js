console.log("IT’S ALIVE!");

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'CV/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/Yaf008', title: 'GitHub' }
];

console.log("脚本仍在运行，pages 数组已定义");

let nav = document.createElement('nav');
document.body.prepend(nav);

const REPO_NAME = location.pathname.split('/')[1] || ''; // Get the warehouse name dynamically

let links = [];

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Corrected path problem
  if (!url.startsWith('http')) {
    url = `/${REPO_NAME}/${url}`.replace(/\/+/g, '/'); // Make sure the path format is correct
  }
  console.log("生成的 URL:", url);

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);
  links.push(a);

  // External links A new window opens
  if (a.host !== location.host) {
    a.target = '_blank';
  }
}

// Optimizes current class addition
let currentLink = links.find(link => {
  let linkPath = new URL(link.href, location.origin).pathname.replace(/\/$/, '');
  let currentPath = location.pathname.replace(/\/$/, '');
  return linkPath === currentPath;
});

// Securely add the 'current' class
currentLink?.classList.add('current');

console.log("脚本执行完毕");

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme" style="position: absolute; top: 1rem; right: 1rem; font-size: 80%; font-family: inherit;">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('.color-scheme select');
select.addEventListener('input', function (event) {
  const colorScheme = event.target.value;
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  localStorage.setItem('colorScheme', colorScheme); // 保存用户偏好
});

window.addEventListener('DOMContentLoaded', () => {
  const savedScheme = localStorage.getItem('colorScheme');
  if (savedScheme) {
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    document.querySelector('.color-scheme select').value = savedScheme;
  }
});

const form = document.querySelector('#contact-form');

form?.addEventListener('submit', (event) => {
    event.preventDefault(); 

    const data = new FormData(form);
    const mailto = form.action;
    const params = [];

    for (let [name, value] of data) {
        params.push(`${name}=${encodeURIComponent(value)}`);
    }

    const url = `${mailto}?${params.join('&')}`;

    location.href = url;
});

console.log("Global.js loading...");

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to obtain project data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Acquired data:", data);
        return data;
    } catch (error) {
        console.error('Error obtaining or parsing JSON data:', error);
        return null;
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
    console.error("The .projects container cannot be found");
    return;
  }

  containerElement.innerHTML = '';
  projects.forEach(project => {
    const article = document.createElement('article');

    // Create a title
    const titleElement = document.createElement(headingLevel);
    titleElement.textContent = project.title;

    // Create an image
    const imageElement = document.createElement('img');
    imageElement.src = project.image;
    imageElement.alt = project.title;

    // Create a description
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = project.description;

    // Create the year element
    const yearElement = document.createElement('p');
    yearElement.textContent = project.year;
    yearElement.classList.add('project-year');

    // Package description and year
    const detailsWrapper = document.createElement('div');
    detailsWrapper.classList.add('project-details');
    detailsWrapper.appendChild(descriptionElement);
    detailsWrapper.appendChild(yearElement);

    // Combine elements
    article.appendChild(titleElement);
    article.appendChild(imageElement);
    article.appendChild(detailsWrapper);

    containerElement.appendChild(article);
  });
}

let projects = []; 
let query = '';

document.addEventListener("DOMContentLoaded", () => {
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    fetchJSON('https://yaf008.github.io/portfolio/lib/project.json').then(data => {
      if (data) {
        projects = data; // 初始化项目数据
        renderProjects(projects, projectsContainer, 'h3');
        document.querySelector('#project-count').textContent = projects.length;

        // 初始化饼图
        if (projects.length > 0) {
          renderPieChart(projects);
        }
      } else {
        console.error("Failed to load project data");
      }
    });
  }

  // 搜索功能
  let searchInput = document.querySelector('.searchBar');
  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    let filteredProjects = projects.filter((project) => 
      project.title.toLowerCase().includes(query)
    );
    renderProjects(filteredProjects, projectsContainer, 'h3');
    document.querySelector('#project-count').textContent = filteredProjects.length;

    // 更新饼图
    if (filteredProjects.length > 0) {
      renderPieChart(filteredProjects);
    } else {
      console.error("❌ 没有匹配的项目！");
    }
  });
});

// GitHub 数据
export async function fetchGitHubData(username) {
  try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (!response.ok) {
          throw new Error(`The GitHub API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("GitHub data:", data);
      return data;
  } catch (error) {
      console.error('Error getting GitHub data:', error);
      return null;
  }
}

// D3.js 饼图
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

function renderPieChart(filteredProjects) {
  let rolledData = d3.rollups(
    filteredProjects,
    (v) => v.length,
    (d) => String(d.year)  // 确保 `year` 是字符串
  );

  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  drawPieChart(data);
}

function drawPieChart(data) {
  let pie = d3.pie().value(d => d.value);
  let arcData = pie(data);
  let radius = 80;
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let svg = d3.select('.pie-chart')
              .attr("width", 300)  
              .attr("height", 300)
              .attr("viewBox", "-100 -100 200 200");

  svg.selectAll("*").remove(); 

  // 绘制饼图楔形
  svg.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .on('click', (event, d) => {
      selectedIndex = selectedIndex === d.index ? -1 : d.index; // 切换选中状态
      updateChartAndProjects(data, selectedIndex); // 更新图表和项目
    });

  // 绘制图例
  let legend = d3.select('.legend');
  legend.selectAll('*').remove();
  data.forEach((d, idx) => {
    legend.append('li')
          .attr('class', 'legend-item')
          .html(`<span class="swatch" style="background-color: ${colors(idx)};"></span> ${d.label} <em>(${d.value})</em>`)
          .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx; // 切换选中状态
            updateChartAndProjects(data, selectedIndex); // 更新图表和项目
          });
  });
}

function updateChartAndProjects(data, selectedIndex) {
  const svg = d3.select('.pie-chart');
  const legend = d3.select('.legend');

  // 更新饼图选中状态
  svg.selectAll('path')
     .attr('class', (d, i) => (i === selectedIndex ? 'selected' : ''));

  // 更新图例选中状态
  legend.selectAll('.legend-item')
        .attr('class', (d, i) => (i === selectedIndex ? 'legend-item selected' : 'legend-item'));

  // 根据选中的年份过滤项目
  const projectsContainer = document.querySelector('.projects');
  if (selectedIndex === -1) {
    renderProjects(projects, projectsContainer, 'h3'); // 显示所有项目
  } else {
    const selectedYear = data[selectedIndex].label; // 获取选中的年份
    const filteredProjects = projects.filter(project => String(project.year) === selectedYear); // 过滤项目
    renderProjects(filteredProjects, projectsContainer, 'h3'); // 显示过滤后的项目
  }
}

function updateChartAndProjects(data, selectedIndex) {
  const svg = d3.select('.pie-chart');
  const legend = d3.select('.legend');

  // 更新饼图选中状态
  svg.selectAll('path')
     .attr('class', (d, i) => (i === selectedIndex ? 'selected' : ''));

  // 更新图例选中状态
  legend.selectAll('.legend-item')
        .attr('class', (d, i) => (i === selectedIndex ? 'legend-item selected' : 'legend-item'));

  // 根据选中的年份过滤项目
  const projectsContainer = document.querySelector('.projects');
  if (selectedIndex === -1) {
    renderProjects(projects, projectsContainer, 'h3'); // 显示所有项目
  } else {
    const selectedYear = data[selectedIndex].label; // 获取选中的年份
    const filteredProjects = projects.filter(project => String(project.year) === selectedYear); // 过滤项目
    renderProjects(filteredProjects, projectsContainer, 'h3'); // 显示过滤后的项目
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    fetchJSON('https://yaf008.github.io/portfolio/lib/project.json').then(data => {
      if (data) {
        projects = data; // 初始化项目数据
        renderProjects(projects, projectsContainer, 'h3');
        document.querySelector('#project-count').textContent = projects.length;

        // 初始化饼图
        if (projects.length > 0) {
          renderPieChart(projects);
        }
      } else {
        console.error("Failed to load project data");
      }
    });
  }
});