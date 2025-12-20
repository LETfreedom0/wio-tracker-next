# 部署到 Vercel 指南

本项目是一个标准的 Next.js 应用，可以非常轻松地部署到 [Vercel](https://vercel.com)。

## 前置准备

1. 确保你有一个 Vercel 账号。
2. 确保你的代码已经推送到了 GitHub、GitLab 或 Bitbucket 仓库。
3. 准备好你的 Supabase 项目 URL 和 Anon Key。

## 部署步骤

1. **登录 Vercel**
   访问 https://vercel.com 并登录。

2. **新建项目**
   - 在 Dashboard 点击 "Add New..." 按钮，选择 "Project"。
   - 在 "Import Git Repository" 列表中找到你的仓库 `stitch_wio` (或者你命名的其他名字)，点击 "Import"。

3. **配置项目**
   - **Project Name**: 可以保持默认，或者修改为你喜欢的名字。
   - **Framework Preset**: Vercel 会自动识别为 `Next.js`，无需修改。
   - **Root Directory**: 确保选择 `wio` 目录（因为你的 `package.json` 在 `wio` 子目录下，而不是仓库根目录）。**这一点非常重要**。如果 Vercel 没有自动识别到 `wio` 目录，请点击 "Edit" 并选择 `wio` 文件夹。

4. **配置环境变量 (Environment Variables)**
   展开 "Environment Variables" 部分，添加以下两个变量（你需要从你的 Supabase 项目设置中获取这些值）：

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key |

5. **点击 Deploy**
   点击 "Deploy" 按钮，Vercel 会自动拉取代码、安装依赖并构建项目。

## 部署后配置 (Supabase)

部署成功后，你会获得一个访问链接（例如 `https://your-project.vercel.app`）。你需要回到 Supabase 进行最后一步配置，以确保登录功能正常工作：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入你的项目 -> **Authentication** -> **URL Configuration**。
3. 将 **Site URL** 设置为你刚刚获得的 Vercel 域名（例如 `https://your-project.vercel.app`）。
4. 在 **Redirect URLs** 中，确保包含该域名（通常 Vercel 部署会自动处理，但建议添加 `https://your-project.vercel.app/**` 以防万一）。
5. 点击保存。

## 常见问题

- **构建失败？**
  - 检查 `Root Directory` 是否正确设置为 `wio`。
  - 查看 Vercel 的构建日志 (Build Logs) 获取详细错误信息。

- **登录没反应？**
  - 检查 Vercel 环境变量是否正确填写。
  - 检查 Supabase 的 Site URL 配置是否包含你的 Vercel 域名。
