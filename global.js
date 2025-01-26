console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Get an array of all nav links
const navLinks = $$("nav a");

// Find the link in the current page
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
// Add current class
currentLink?.classList.add('current');

// Define your pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects.html', title: 'Projects' },
  { url: 'resume.html', title: 'Resume' },
  { url: 'contact.html', title: 'Contact' },
  { url: 'https://github.com/yaf008', title: 'GitHub Profile' },
];

// Adjust base path for GitHub Pages (update '/portfolio/' to your repository name)
const BASE_PATH = '/portfolio/';

// Determine if we are on the home page
const ARE_WE_HOME = location.pathname === BASE_PATH || location.pathname === BASE_PATH + 'index.html';

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust URL for GitHub Pages
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = BASE_PATH + url;
  } else if (ARE_WE_HOME && !url.startsWith('http')) {
    url = './' + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Highlight current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  a.toggleAttribute('target', a.host !== location.host);

  nav.append(a);
}






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

