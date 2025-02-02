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

  // 外部链接新窗口打开
  if (a.host !== location.host) {
    a.target = '_blank';
  }
}

// 优化 current 类添加
let currentLink = links.find(link => {
  let linkPath = new URL(link.href, location.origin).pathname.replace(/\/$/, '');
  let currentPath = location.pathname.replace(/\/$/, '');
  return linkPath === currentPath;
});

// 安全地添加 `current` 类
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

//lab4 java II

console.log("Global.js 运行中...");

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`获取项目数据失败: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("获取的数据:", data); // 确保 JSON 正确加载
        return data;
    } catch (error) {
        console.error('获取或解析 JSON 数据时出错:', error);
        return null; // 发生错误时返回 null
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error("找不到 .projects 容器");
        return;
    }

    containerElement.innerHTML = ''; // 清空现有内容
    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    });
}

// 🔥 自动加载并渲染项目数据
document.addEventListener("DOMContentLoaded", () => {
    const projectsContainer = document.querySelector('.projects');
    if (projectsContainer) {
        fetchJSON('../lib/project.json').then(projects => {  // **使用 ../lib/project.json**
            if (projects) {
                renderProjects(projects, projectsContainer, 'h3');
                document.querySelector('#project-count').textContent = projects.length;
            } else {
                console.error("项目数据加载失败");
            }
        });
    }
});