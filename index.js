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
    const profileStats = document.querySelector('#profile-stats'); // 选择容器
    if (profileStats) {
        const githubData = await fetchGitHubData('yaf008'); // ✅ 使用你的 GitHub 用户名
        if (githubData) {
            profileStats.innerHTML = `
                <dl class="profile-grid">
                    <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                    <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                    <dt>Followers:</dt><dd>${githubData.followers}</dd>
                    <dt>Following:</dt><dd>${githubData.following}</dd>
                </dl>
            `;
        } else {
            profileStats.innerHTML = "<p>无法加载 GitHub 数据。</p>";
        }
    }
});