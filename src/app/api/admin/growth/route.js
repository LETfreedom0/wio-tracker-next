import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

// 初始化标准客户端用于验证 Token（不需要 Service Role Key）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 获取用户增长数据
 * Fetch user growth data
 */
export async function GET(request) {
  // 检查是否配置了 Service Role Key
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' },
      { status: 500 }
    );
  }

  try {
    // 1. 获取 Authorization Header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 2. 验证用户 Token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // 3. 检查用户权限 (白名单机制)
    // 只有在 ADMIN_EMAILS 环境变量中列出的邮箱才能访问
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    
    if (!adminEmailsEnv) {
       console.warn('Access denied: ADMIN_EMAILS environment variable is not set.');
       return NextResponse.json(
        { error: 'Configuration Error: ADMIN_EMAILS is missing. Did you restart the server?' },
        { status: 403 }
      );
    }

    const adminEmails = adminEmailsEnv.split(',');
    
    // 清理空格并转小写进行比较
    const userEmail = user.email.trim().toLowerCase();
    const isAllowed = adminEmails.some(email => email.trim().toLowerCase() === userEmail);

    if (!isAllowed) {
       console.warn(`Access denied: User ${userEmail} is not in ADMIN_EMAILS list.`);
       return NextResponse.json(
        { error: `Forbidden: User ${userEmail} is not authorized.` },
        { status: 403 }
      );
    }

    // 4. 执行管理员查询
    // 注意：user_settings 表可能没有包含所有用户（如果用户是在添加 user_settings 表之前注册的，或者触发器未执行）
    // 为了获取最准确的用户增长数据，我们应该直接查询 auth.users 表。
    // 但是，Supabase JS 客户端无法直接查询 auth schema。
    // 因此，我们使用 listUsers() 方法来获取所有用户。
    
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 按日期聚合数据
    // Aggregate data by date
    const growthMap = {};
    
    // 如果没有数据，返回空数组
    if (!users || users.length === 0) {
        return NextResponse.json({ data: [] });
    }

    users.forEach(user => {
      // 提取日期部分 (YYYY-MM-DD)
      const date = new Date(user.created_at).toISOString().split('T')[0];
      if (!growthMap[date]) {
        growthMap[date] = 0;
      }
      growthMap[date]++;
    });

    // 转换为数组并按日期排序
    // Convert to array and sort by date
    const growthData = Object.keys(growthMap)
      .sort()
      .map(date => ({
        date,
        count: growthMap[date]
      }));

    return NextResponse.json({ data: growthData });
  } catch (error) {
    console.error('Error fetching growth data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch growth data' },
      { status: 500 }
    );
  }
}
