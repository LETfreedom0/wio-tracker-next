# 📧 Supabase 邮件接收问题排查指南

如果您在注册时无法收到验证邮件，通常是以下原因导致的。请按照以下步骤排查和解决。

## 1. 常见原因

### 🚫 国内邮箱拦截 (最常见)
Supabase 免费版使用共享的邮件服务器发送验证邮件。由于大量开发者使用该服务，其发件 IP 经常被国内主流邮箱服务商（如 **QQ邮箱、网易163、钉钉企业邮**）标记为垃圾邮件或直接拦截。

### 📉 发送限额
Supabase 免费版对邮件发送有速率限制（通常每小时/每天有限额）。如果在短时间内多次测试，可能会触发限制。

## 2. 解决方案

### ✅ 方案 A：配置自定义 SMTP (推荐)
这是解决问题的根本方法。建议使用专业的邮件推送服务。

1.  **注册邮件服务**：
    *   **Resend** (推荐): 每月免费 3000 封，配置简单，送达率高。
    *   **阿里云/腾讯云邮件推送**: 国内送达率最好，价格便宜。
    *   **SendGrid / Mailgun**: 传统的选择。
吗
2.  **在 Supabase 中配置**:
    *   进入 Supabase Dashboard -> Project Settings -> **Auth** -> **SMTP Settings**。
    *   开启 **Enable Custom SMTP**。
    *   填入从邮件服务商获取的 `Host`, `Port`, `User`, `Password`, `Sender Email`。

### 🛠️ 方案 B：关闭邮箱验证 (仅限开发测试)
如果您只是想快速测试功能，可以暂时关闭邮箱验证。

1.  进入 Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**。
2.  关闭 **Confirm email** 选项。
3.  **注意**: 关闭后，用户注册将直接登录，无需验证邮箱。这适合开发阶段，生产环境建议开启并配合 SMTP。

### 🔍 方案 C：检查垃圾箱和白名单
*   请务必检查邮箱的**垃圾邮件 (Spam)** 文件夹。
*   尝试将 `noreply@mail.app.supabase.io` 添加到邮箱白名单。

## 3. 代码检查
您的注册代码看起来是正确的：
```javascript
const { error } = await supabase.auth.signUp({
  email,
  password,
});
```
只要 `error` 为空，说明 Supabase 已经成功接受了请求并尝试发送邮件。如果收不到，问题通常在于邮件投递环节（上述第 1 点）。
