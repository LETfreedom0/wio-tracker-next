# WIO Calculator 网站 SEO 优化操作指南

这份文档将指导你一步步完成网站的搜索引擎优化（SEO），让更多用户通过 Google 搜索到你的网站。

## 第一阶段：代码配置（已完成基础部分）

我已经帮你完成了核心的代码修改，但你需要根据你的实际域名进行微调。

### 1. 修改域名配置 (已自动完成)
我已经将代码中的域名更新为 **https://wiotracker.xyz**。

### 2. 部署更新
请将最新代码推送到仓库（Git Push）并等待 Vercel 重新部署。
**只有部署成功后，`https://wiotracker.xyz/sitemap.xml` 才会生效。**

---

## 第二阶段：Google Search Console (GSC) 设置

### 1. 注册账号
访问 [Google Search Console](https://search.google.com/search-console)。

### 2. 添加资源
点击左上角的“添加资源”，选择 **网址前缀 (URL Prefix)**：
*   输入完整网址：`https://wiotracker.xyz`
*   点击继续。

### 3. 验证网站所有权
如果你选择了“网址前缀”，Google 会要求你验证。选择 **"HTML 标记" (HTML tag)** 方法：

1.  复制 Google 提供的 `<meta name="google-site-verification" content="你的验证代码" />`。
2.  打开你的项目文件 `src/app/layout.js`。
3.  在 `metadata` 对象中添加 `verification` 字段：

```javascript
// src/app/layout.js
export const metadata = {
  // ... 其他配置保持不变
  verification: {
    google: '你的验证代码（从 content 引号里复制出来的部分）',
  },
};
```
4.  重新部署代码。
5.  回到 Google Search Console 点击“验证”。

---

## 第三阶段：提交站点地图 (Sitemap)

验证成功后，你需要把地图交给 Google 爬虫。

1.  在 GSC 左侧菜单点击 **Sitemaps (站点地图)**。
2.  在“添加新的站点地图”输入框中，填入：`sitemap.xml`。
3.  点击 **提交**。
4.  状态列应该会显示“成功”。如果显示“无法获取”，请检查你的网站根目录下是否能访问 `https://你的域名/sitemap.xml`。

---

## 第四阶段：持续优化建议

### 1. 关键词优化
你的网站主要功能是计算 WIO (Work In Office) 和考勤。确保你的网页内容中自然地包含了用户可能会搜索的词：
*   **核心词**: WIO Calculator, Hybrid Work Tracker, Office Attendance.
*   **中文词**: 混合办公计算器, 办公室打卡记录, WIO 达标计算.

### 2. 社交媒体分享 (Open Graph)
我在 `layout.js` 中已经配置了 `openGraph`。
*   当你在 Twitter, Facebook 或微信分享链接时，会显示漂亮的卡片。
*   **进阶**: 你可以在 `public` 文件夹下放一张 `og-image.jpg` (1200x630像素)，并在 `layout.js` 中引用它，这样分享时就会有预览图。

### 3. 性能监控
定期查看 Google Search Console 的 **核心网页指标 (Core Web Vitals)** 报告。
*   **LCP**: 页面加载速度。
*   **CLS**: 页面布局是否稳定（不要乱跳）。
*   Next.js 默认性能很好，只要不引入过大的图片或第三方阻塞脚本通常没问题。

---

如有任何步骤卡住，请随时把报错信息发给我！
