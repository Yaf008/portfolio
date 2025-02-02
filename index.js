import { fetchJSON, renderProjects } from 'https://yaf008.github.io/portfolio/lib/project.json';

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