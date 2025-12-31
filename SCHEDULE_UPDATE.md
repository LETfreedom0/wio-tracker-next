# Update Schedule Table for Time Support

请在 Supabase SQL Editor 中运行以下 SQL 语句以添加时间字段支持。

```sql
-- 1. 添加 time 字段
ALTER TABLE public.schedules ADD COLUMN time TIME;

-- 2. 添加注释
COMMENT ON COLUMN public.schedules.time IS '日程的具体时间';

-- 3. 可选：更新现有数据的时间为 NULL (默认就是 NULL，这里只是确认)
-- UPDATE public.schedules SET time = NULL WHERE time IS NULL;
```
