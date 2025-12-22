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

### 1. 关键词优化 (已全面升级)
你的网站主要功能是计算 WIO (Work In Office) 和考勤。确保你的网页内容中自然地包含了用户可能会搜索的词。
**最新更新**: 我已经在代码中为您添加了覆盖 **中、英、日、韩、欧** 多种语言的 30+ 个高频关键词。

*   **英文**: WIO Calculator, Hybrid Work Tracker, RTO Tracker
*   **中文**: WIO 计算器, 混合办公, 办公室打卡, 考勤管理
*   **其他**: 出社管理 (日), 재택근무 (韩), Télétravail (法)

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

## 第五阶段：常见问题与解决方案 (Troubleshooting)

### 问题 1: 搜索 `site:wiotracker.xyz` 显示 "did not match any documents"
**原因**:
这是新站点的正常现象。Google 爬虫虽然验证了所有权，但还没有正式抓取并建立索引（Indexing）。从验证通过到能搜到，通常需要几天到几周的“考察期”。

**解决方案 (主动加速收录)**:
1.  进入 **Google Search Console**。
2.  在顶部搜索栏输入首页网址：`https://wiotracker.xyz`。
3.  系统会提示“URL 不在 Google 服务中”。
4.  点击灰色的 **【请求编入索引】 (Request Indexing)** 按钮。
5.  等待 24-48 小时后再次尝试搜索。

### 问题 2: 高级 SEO 配置 (已为您代码实现)
为了提高收录成功率，代码层面已添加以下优化：
1.  **JSON-LD 结构化数据**: 
    *   在 `layout.js` 中注入了 `<script type="application/ld+json">`。
    *   **作用**: 明确告诉 Google 这是一个 WebApplication（生产力工具），有助于生成富媒体搜索结果 (Rich Snippets)。
2.  **metadataBase 配置**:
    *   在 `layout.js` 中添加了 `metadataBase: new URL('https://wiotracker.xyz')`。
    *   **作用**: 解决 Next.js 中相对路径 URL 的解析警告，确保社交分享图片能正确索引。

### 问题 3: 搜索不到特定的子页面
**解决方案**:
确保 `sitemap.xml` 已提交成功。Google 会根据 Sitemap 顺藤摸瓜找到 `/login` 和 `/settings` 等页面。

### 问题 4: GSC 显示 "无法读取此站点地图" (Couldn't fetch)
这是 Google Search Console 最常见的一个误报/状态，通常由以下原因引起：

**原因分析 & 解决方案**:

1.  **代码尚未部署生效 (最常见)**
    *   **检查方法**: 
        打开浏览器无痕模式，直接访问 `https://wiotracker.xyz/sitemap.xml`。
    *   **判定**:
        *   如果看到 404 或“页面未找到”：说明代码还没部署成功，或者 Vercel 构建失败。请检查 Git Push 状态和 Vercel 后台。
        *   如果能看到 XML 代码：说明你的网站没问题，是 Google 的问题（见下条）。

2.  **Google 系统的假报错 (False Negative)**
    *   **现象**: 浏览器能打开 sitemap.xml，但 GSC 依然报错。
    *   **解释**: 当你刚提交 Sitemap 时，Google 爬虫可能处于“待处理”状态，但 UI 会错误地显示“无法读取”。
    *   **解决方案**: 
        *   **不要删除重交**（这会重置排队）。
        *   **等待 24 小时**：通常第二天它会自动变绿（成功）。
        *   或者尝试在 GSC 顶部的搜索框输入 `https://wiotracker.xyz/sitemap.xml` 进行“URL 检查”，如果检查结果是“URL 可被 Google 编入索引”，那就确认是 GSC 的显示延迟，无需理会。

---

## 第六阶段：进阶 SEO 优化 (已为您完成)

为了进一步提升排名和用户体验，我已自动为您添加了以下高级功能：

### 1. 规范链接 (Canonical Tags)
*   **作用**: 防止搜索引擎因为 URL 参数（如 `?ref=...`）而认为网站有重复内容。
*   **代码位置**: `src/app/layout.js` 中的 `alternates` 配置。

### 2. PWA 支持 (Manifest)
*   **作用**: 让您的网站可以像 App 一样安装到手机桌面，Google 会对 PWA 友好型网站给予加分。
*   **代码位置**: `src/app/manifest.js`。

### 3. 独立页面元数据
*   **作用**: 为 `/settings` 等内页设置了独立的标题和描述，避免所有页面都显示同一个标题。
*   **代码位置**: `src/app/settings/layout.js`。

---

## 第七阶段：用户体验与无障碍优化 (User Experience & Accessibility)

Google 的 Core Web Vitals 和排名算法越来越重视用户体验和无障碍访问。我已为您完成了以下优化：

### 1. 自定义 404 页面
*   **作用**: 当用户访问不存在的页面时，展示一个友好的 404 页面，引导他们回到首页，而不是显示默认的错误页。这能降低跳出率。
*   **代码位置**: `src/app/not-found.js` (新创建)

### 2. 无障碍标签 (ARIA Labels)
*   **作用**: 为图标按钮（如日历翻页、设置图标）添加了 `aria-label` 属性，让屏幕阅读器（盲人用户）和搜索引擎能读懂这些按钮的用途。
*   **涉及文件**: `src/app/components/Navigation.js`, `src/app/page.js`, `src/app/settings/page.js`, `src/app/login/page.js`。

### 3. 装饰性图标隐藏
*   **作用**: 对所有纯装饰性的 SVG 图标添加了 `aria-hidden="true"`，避免干扰辅助技术的阅读流。

---

## 第八阶段：使用 Lighthouse 进行性能评分

Lighthouse 是 Google 官方提供的网站体检工具，它的评分直接影响 Google 对你网站质量的判断。

### 如何运行 Lighthouse 跑分？

1.  **准备工作**
    *   确保你的网站已经部署上线（访问线上地址，不要测本地 localhost）。
    *   **重要**: 打开 Chrome 浏览器的 **无痕模式 (Incognito Mode)**。这能避免浏览器插件干扰评分结果。

2.  **打开工具**
    *   在网页上点击鼠标右键 -> **检查 (Inspect)**。
    *   在顶部标签栏找到 **Lighthouse**（如果找不到，点一下旁边的 `>>` 双箭头图标）。

3.  **开始分析**
    *   **Mode (模式)**: 选择 `Navigation (Default)`。
    *   **Device (设备)**: 建议分别测一下 `Mobile` (手机) 和 `Desktop` (电脑)。Google 优先看手机端表现。
    *   **Categories (类别)**: 把 Performance, Accessibility, Best Practices, SEO 全部勾上。
    *   点击蓝色的 **Analyze page load** 按钮。

4.  **解读报告**
    *   **SEO**: 应该接近 100 分（因为我们已经做了大量优化）。
    *   **Accessibility (无障碍)**: 应该也是绿色的（刚才我们修复了所有 aria-label）。
    *   **Performance (性能)**: 如果分数较低，关注报告下方的建议（如图片太大、脚本阻塞等）。

### 常见优化项
*   **PWA**: 如果 PWA 图标没有亮，检查 `manifest.json` 是否被正确加载。
*   **图片**: 确保使用了 Next.js 的 `<Image />` 组件而不是普通的 `<img>`。

---
如有任何步骤卡住，请随时把报错信息发给我！
