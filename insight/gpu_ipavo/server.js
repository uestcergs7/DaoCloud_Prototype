const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 静态资源服务配置
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(__dirname)); // 允许读取同目录下的图片和其它静态资源

// 路由分发
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/spec', (req, res) => {
    res.sendFile(path.join(__dirname, 'functional_spec.html'));
});

app.get('/research', (req, res) => {
    res.sendFile(path.join(__dirname, 'research.html'));
});

// 错误处理兜底
app.use((req, res, next) => {
    res.status(404).send('<h1>404 Not Found</h1><p>未找到请求的页面，请确认路由是否正确：</p><ul><li><a href="/dashboard">GPU 仪表盘 (Dashboard)</a></li><li><a href="/spec">功能规格说明书 (Spec)</a></li><li><a href="/research">行业调研与竞品分析 (Research)</a></li></ul>');
});

// 启动服务
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 GPU iPavo 仪表盘与交互式多端服务已成功启动!`);
    console.log(`--------------------------------------------------`);
    console.log(`👉 GPU 仪表盘 (Dashboard):    http://localhost:${PORT}/dashboard`);
    console.log(`👉 交互式规格说明书 (Spec):   http://localhost:${PORT}/spec`);
    console.log(`👉 行业竞品调研报告 (Research): http://localhost:${PORT}/research`);
    console.log(`==================================================\n`);
});
