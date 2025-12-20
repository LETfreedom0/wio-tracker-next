# Supabase Database Setup

请在您的 Supabase 项目的 SQL Editor 中运行以下 SQL 语句来创建所需的表和策略。

## 1. 创建表

### 用户设置表 (user_settings) - 重新设计

```sql
-- 重新设计的用户设置表
-- 采用 snake_case 命名规范，符合 PostgreSQL 最佳实践
CREATE TABLE public.user_settings (
    -- user_id: 关联 auth.users 表，作为主键。
    -- 选择原因：每个用户只有一条设置记录 (1:1 关系)，直接使用 user_id 作为主键比单独的 id 更高效，且天然保证了唯一性。
    user_id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,

    -- wio_target: WIO 目标百分比
    wio_target INTEGER DEFAULT 80,

    -- language: 界面语言偏好
    language TEXT DEFAULT 'english',

    -- annual_leave_quota: 年假总额度（天）
    annual_leave_quota INTEGER DEFAULT 0,

    -- sick_leave_quota: 病假总额度（天）
    sick_leave_quota INTEGER DEFAULT 0,

    -- created_at: 记录创建时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- updated_at: 记录更新时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 添加注释以方便维护
COMMENT ON TABLE public.user_settings IS '存储用户的个性化设置信息';
COMMENT ON COLUMN public.user_settings.user_id IS '用户ID，关联认证表';
COMMENT ON COLUMN public.user_settings.wio_target IS '用户的WIO目标百分比';
COMMENT ON COLUMN public.user_settings.annual_leave_quota IS '年假额度';
COMMENT ON COLUMN public.user_settings.sick_leave_quota IS '病假额度';
```

### 用户考勤表 (Calendar Data)
-- 注意：status 字段已更新为 SMALLINT 以节省空间
CREATE TABLE public.calendar_data (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    status SMALLINT DEFAULT 0, -- 0:none, 1:office, 2:remote, 3:annual, 4:sick, 5:unpaid
    ot INTEGER DEFAULT 0, -- 0: false, 1: true
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, date)
);
```

### 如果表已经存在，请运行此命令修改列类型或添加新列：

```sql
-- 添加新的额度配置列
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS annual_leave_quota INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sick_leave_quota INTEGER DEFAULT 0;

-- 将 status 列转换为 SMALLINT
-- 注意：这会尝试将现有的 JSONB 数据转换为整数，如果转换失败可能会报错。
-- 建议在清空数据或确保数据兼容的情况下运行。
ALTER TABLE public.calendar_data 
ALTER COLUMN status TYPE SMALLINT 
USING (status::text::integer);

-- 设置默认值
ALTER TABLE public.calendar_data 
ALTER COLUMN status SET DEFAULT 0;
```

### 2. 启用行级安全 (RLS) - 修复版

为了解决 `new row violates row-level security policy` 错误，我们需要更新 RLS 策略。该错误通常是因为 `INSERT` 策略不仅仅需要检查 `auth.uid() = user_id`，还需要确保用户有权限插入自己的行。

请在 Supabase SQL Editor 中运行以下命令，**先删除旧策略，再创建新策略**：

```sql
-- 1. 删除旧策略 (如果存在)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can upsert their own settings" ON public.user_settings;

-- 2. 启用 RLS (如果尚未启用)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. 创建新策略

-- SELECT: 允许用户查看自己的设置
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT: 允许用户插入自己的设置
-- WITH CHECK 确保新插入行的 user_id 等于当前用户的 ID
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: 允许用户更新自己的设置
CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- 综合策略 (可选，如果上面的分开策略仍然有问题，可以尝试这个更宽松的策略)
-- 注意：通常上面的分开策略就足够了。如果 upsert 仍然失败，可能是因为 upsert 操作在 RLS 中被视为 INSERT + UPDATE，需要同时满足两者的条件。
```

### 3. 环境变量

请确保您的项目根目录下的 `.env.local` 文件包含以下变量（从 Supabase 项目设置中获取）：

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
