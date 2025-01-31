console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//get an array of all nav links
const navLinks = $$("nav a");

//find the link in current page
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
//add current class
currentLink?.classList.add('current');

if (currentLink) {
  // or if (currentLink !== undefined)
  currentLink.classList.add('current');
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'CV/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/yaf008', title: 'GitHub Profile' },
];


const ARE_WE_HOME = document.documentElement.classList.contains('home');


let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  url = !ARE_WE_HOME && !url.startsWith('http')?'../'+ url : url;


  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  if(a.host!=location.host){
    a.target ='_blank'
  }
 
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

