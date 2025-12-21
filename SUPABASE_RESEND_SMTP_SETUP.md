# 📧 Supabase 配置 Resend SMTP 详细教程

使用 Resend 作为 Supabase 的邮件发送服务是解决国内收信问题的最佳方案之一。Resend 每月提供 3000 封免费额度，且配置简单，送达率高。

## 第一步：获取 Resend API Key

1.  访问 [Resend 官网 (resend.com)](https://resend.com) 并注册账号。
2.  登录后，点击左侧菜单的 **API Keys**。
3.  点击 **Create API Key**。
4.  Name 随便填（例如 "Supabase"），Permission 选择 **Full access** 或 **Sending access**。
5.  点击 **Add**，然后**复制以 `re_` 开头的 API Key**。
    *   *注意：这个 Key 只显示一次，请保存好，它将作为 SMTP 的密码。*

## 第二步：配置发件域名

### 🌟 推荐方案：在 Cloudflare 中配置 (如果您使用 Cloudflare)

既然您已经使用 Cloudflare 作为 DNS，那么配置过程将非常快捷。

假设您的主域名是 `example.com`，我们要配置子域名 `mail.example.com`。

#### 1. 登录 Cloudflare
1.  进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2.  点击您的域名 `example.com`。
3.  在左侧菜单栏选择 **DNS** -> **Records**。

#### 2. 添加 3 条记录

点击蓝色的 **+ Add record** 按钮，按照 Resend 提供的信息逐条添加。

⚠️ **重要提示**: Cloudflare 的 **Proxy Status** (代理状态/小云朵) **必须关闭**。

| 记录类型 (Type) | 名称 (Name) | 内容 (Content / Mail Server) | 优先级 (Priority) | 代理状态 (Proxy Status) |
| :--- | :--- | :--- | :--- | :--- |
| **MX** | `mail` | `feedback-smtp.us-east-1.amazonses.com` | `10` | 自动 (不可选) |
| **TXT** | `mail` | `v=spf1 include:amazonses.com ~all` | (不填) | **DNS Only** (灰色云朵) ☁️ |
| **TXT** | `resend._domainkey.mail` | `p=MIGfMA0GCSqGSIb...` (复制完整值) | (不填) | **DNS Only** (灰色云朵) ☁️ |

**关于名称 (Name) 的填写技巧**:
*   如果 Resend 显示 `mail.example.com`，在 Cloudflare 的 Name 栏只需填 `mail`。
*   如果 Resend 显示 `resend._domainkey.mail.example.com`，在 Cloudflare 的 Name 栏只需填 `resend._domainkey.mail`。
*   *Cloudflare 会自动补全后面的主域名，您可以在输入框下方看到预览结果。*

#### 3. 验证
1.  回到 Resend 页面。
2.  点击 **Verify DNS Records**。
3.  因为 Cloudflare 生效极快，通常点击即通过。如果状态变成绿色的 **Verified**，说明配置成功！

---

### 备选方案：在 Spaceship 中配置 (仅供参考)
*(如果您将来想切回 Spaceship DNS，可参考此部分，否则请忽略)*

<details>
<summary>点击展开 Spaceship 配置教程</summary>

#### 1. 进入 Spaceship DNS 设置
1.  登录 Spaceship -> **Launchpad** -> **Domain List** -> **Manage** -> **Advanced DNS**。

#### 2. 添加记录
点击 **+ Add New Record**。

| Resend Name | Record Type | Spaceship Host | Value |
| :--- | :--- | :--- | :--- |
| `mail...` | MX | `mail` | `feedback-smtp...` (Priority: 10) |
| `mail...` | TXT | `mail` | `v=spf1...` |
| `resend._domainkey.mail...` | TXT | `resend._domainkey.mail` | `p=MIGf...` |

</details>

## 第三步：在 Supabase 中配置 SMTP

1.  登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2.  进入您的项目。
3.  点击左下角的 ⚙️ **Project Settings**。
4.  点击侧边栏的 **Auth**。
5.  向下滚动找到 **SMTP Settings** 部分。
6.  开启 **Enable Custom SMTP** 开关。

请按以下表格填写信息：

| 设置项 | 填写内容 | 说明 |
| :--- | :--- | :--- |
| **Sender Email** | `noreply@mail.yourdomain.com` | **必须**是您在 Resend 验证过的域名后缀。<br>如果是测试模式，填写 `onboarding@resend.dev` |
| **Sender Name** | `WIO Tracker` | 用户收到邮件时显示的发件人名称 |
| **Host** | `smtp.resend.com` | Resend 的 SMTP 服务器地址 |
| **Port** | `465` | SSL 加密端口 |
| **Username** | `resend` | 固定填 `resend` |
| **Password** | `re_123456...` | **第一步中复制的 Resend API Key** |
| **Minimum interval** | `60` | 默认即可 (防止滥用) |

7.  点击 **Save** 保存配置。

## 第四步：验证配置

1.  回到您的 WIO Tracker 应用。
2.  尝试注册一个新账号（使用一个真实的邮箱）。
3.  检查该邮箱是否收到验证邮件。
4.  同时，您可以登录 Resend Dashboard，点击左侧 **Emails**，查看是否有邮件发送记录。
    *   如果状态是 `Delivered`，说明发送成功。
    *   如果状态是 `Bounced` 或 `Complained`，说明有问题。

## 常见问题

*   **Q: Cloudflare 配置后一直 Pending？**
    *   A: 请检查那两个 TXT 记录的 **Proxy Status** 是否已关闭（变成灰色的 DNS Only）。如果是橙色的 Proxied，Resend 无法验证。
*   **Q: 配置了 SMTP 还是收不到？**
    *   A: 检查 Supabase 的 **Auth** -> **Rate Limits**，确保没有因为测试过于频繁被限流。检查 Resend 后台的 Logs 是否有报错信息。
