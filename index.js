import { fetchJSON, renderProjects } from './global.js';

// 获取项目数据并筛选前 3 个
document.addEventListener("DOMContentLoaded", async () => {
    const projectsContainer = document.querySelector('.latest-projects');
    if (projectsContainer) {
        const projects = await fetchJSON('./lib/project.json');  // 确保路径正确
        if (projects) {
            const latestProjects = projects.slice(0, 3);  // 获取前 3 个项目
            renderProjects(latestProjects, projectsContainer, 'h2'); // 用 h2 作为标题
        } else {
            console.error("无法加载最新项目");
        }
    }
});


import { fetchGitHubData } from './global.js';

document.addEventListener("DOMContentLoaded", async () => {
    const githubContainer = document.querySelector('.github-stats');
    if (githubContainer) {
        const githubData = await fetchGitHubData('yaf008'); // ✅ 你的 GitHub 用户名
        if (githubData) {
            githubContainer.innerHTML = `
                <h2>GitHub Statistics</h2>
                <p><strong>Followers:</strong> ${githubData.followers}</p>
                <p><strong>Following:</strong> ${githubData.following}</p>
                <p><strong>Public Repos:</strong> ${githubData.public_repos}</p>
                <p><strong>GitHub Profile:</strong> <a href="${githubData.html_url}" target="_blank">${githubData.html_url}</a></p>
            `;
        } else {
            githubContainer.innerHTML = "<p>无法加载 GitHub 数据。</p>";
        }
    }
});