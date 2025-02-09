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

const REPO_NAME = location.pathname.split('/')[1] || ''; // 动态获取仓库名称

let links = [];

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // 修正路径问题
  if (!url.startsWith('http')) {
    url = `/${REPO_NAME}/${url}`.replace(/\/+/g, '/'); // 确保路径格式正确
  }
  console.log("生成的 URL:", url);

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);
  links.push(a);

  // 外部链接在新窗口中打开
  if (a.host !== location.host) {
    a.target = '_blank';
  }
}

// 优化当前类添加
let currentLink = links.find(link => {
  let linkPath = new URL(link.href, location.origin).pathname.replace(/\/$/, '');
  let currentPath = location.pathname.replace(/\/$/, '');
  return linkPath === currentPath;
});

// 安全地添加 'current' 类
currentLink?.classList.add('current');

console.log("脚本执行完毕");

// 颜色主题切换
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

// 项目过滤和饼图交互
let selectedIndex = -1; // 初始化为-1，表示没有选中任何楔形
let projects = []; // 存储项目数据

document.addEventListener("DOMContentLoaded", () => {
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    fetchJSON('https://yaf008.github.io/portfolio/lib/project.json').then(data => {
      if (data) {
        projects = data;
        renderProjects(projects, projectsContainer, 'h3');
        document.querySelector('#project-count').textContent = projects.length;
        renderPieChart(projects);
      } else {
        console.error("Failed to load project data");
      }
    });
  }
});

// 获取 JSON 数据
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

// 渲染项目列表
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
    console.error("The .projects container cannot be found");
    return;
  }

  containerElement.innerHTML = '';
  projects.forEach(project => {
    const article = document.createElement('article');

    // 创建标题
    const titleElement = document.createElement(headingLevel);
    titleElement.textContent = project.title;

    // 创建图片
    const imageElement = document.createElement('img');
    imageElement.src = project.image;
    imageElement.alt = project.title;

    // 创建描述
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = project.description;

    // 创建年份元素
    const yearElement = document.createElement('p');
    yearElement.textContent = project.year;
    yearElement.classList.add('project-year');

    // 包装描述和年份
    const detailsWrapper = document.createElement('div');
    detailsWrapper.classList.add('project-details');
    detailsWrapper.appendChild(descriptionElement);
    detailsWrapper.appendChild(yearElement);

    // 组合元素
    article.appendChild(titleElement);
    article.appendChild(imageElement);
    article.appendChild(detailsWrapper);

    containerElement.appendChild(article);
  });
}

// 渲染饼图
function renderPieChart(filteredProjects) {
  let rolledData = d3.rollups(
    filteredProjects,
    (v) => v.length,
    (d) => String(d.year)  // 确保 `year` 是字符串
  );

  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  drawPieChart(data);
}

// 绘制饼图
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

  svg.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .on('click', (event, d, i) => {
      selectedIndex = selectedIndex === i ? -1 : i; // 切换选中状态
      updateSelection();
    });

  let legend = d3.select('.legend');
  legend.selectAll('*').remove();
  data.forEach((d, idx) => {
    legend.append('li')
          .attr('class', 'legend-item')
          .html(`<span class="swatch" style="background-color: ${colors(idx)};"></span> ${d.label} <em>(${d.value})</em>`)
          .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx; // 切换选中状态
            updateSelection();
          });
  });

  function updateSelection() {
    svg.selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

    legend.selectAll('.legend-item')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

    filterProjects();
  }
}

// 根据选中的年份过滤项目
function filterProjects() {
  let filteredProjects = selectedIndex === -1 ? projects : projects.filter(project => String(project.year) === data[selectedIndex].label);
  renderProjects(filteredProjects, document.querySelector('.projects'), 'h3');
  document.querySelector('#project-count').textContent = filteredProjects.length;
}

// GitHub 数据获取
export async function fetchGitHubData(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) {
      throw new Error(`The GitHub API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("GitHub data:", data);  // 调试信息
    return data;
  } catch (error) {
    console.error('Error getting GitHub data:', error);
    return null;
  }
}
