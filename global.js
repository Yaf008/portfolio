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

//lab4 java II

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
    yearElement.classList.add('project-year'); // 添加样式类

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

document.addEventListener("DOMContentLoaded", () => {
    const projectsContainer = document.querySelector('.projects');
    if (projectsContainer) {
        fetchJSON('https://yaf008.github.io/portfolio/lib/project.json').then(projects => {
            if (projects) {
                renderProjects(projects, projectsContainer, 'h3');
                document.querySelector('#project-count').textContent = projects.length;
            } else {
                console.error("Failed to load project data");
            }
        });
    }
});


//github data
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

//lab5


