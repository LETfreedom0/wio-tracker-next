# Schedule Feature Database Setup

请在 Supabase SQL Editor 中运行以下 SQL 语句以启用日程功能。

```sql
-- 1. 创建日程表 (Schedules Table)
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 添加注释
COMMENT ON TABLE public.schedules IS '用户日程表';
COMMENT ON COLUMN public.schedules.user_id IS '关联的用户ID';
COMMENT ON COLUMN public.schedules.date IS '日程日期';

-- 2. 启用行级安全 (RLS)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 3. 创建安全策略 (Policies)

-- 允许用户查看自己的日程
CREATE POLICY "Users can view their own schedules" 
ON public.schedules FOR SELECT 
USING (auth.uid() = user_id);

-- 允许用户添加自己的日程
CREATE POLICY "Users can insert their own schedules" 
ON public.schedules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的日程
CREATE POLICY "Users can update their own schedules" 
ON public.schedules FOR UPDATE 
USING (auth.uid() = user_id);

-- 允许用户删除自己的日程
CREATE POLICY "Users can delete their own schedules" 
ON public.schedules FOR DELETE 
USING (auth.uid() = user_id);

-- 4. 创建索引以提高查询性能
CREATE INDEX idx_schedules_user_date ON public.schedules(user_id, date);
```
