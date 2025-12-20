import React from 'react';

/**
 * 通用输入框组件
 * 
 * 优化了视觉效果，增加了悬停和聚焦状态的过渡动画
 * 
 * @param {string} label - 输入框上方的标签文本
 * @param {string} id - 输入框的唯一标识符
 * @param {string} className - 额外的样式类名
 * @param {string} error - 错误信息（如果有）
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - 其他传递给 input 元素的标准属性
 */
export default function Input({ label, id, className = '', error, ...props }) {
  return (
    <div className="space-y-2 w-full group">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-subtle transition-colors group-focus-within:text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`
            flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground
            ring-offset-background 
            placeholder:text-subtle/40
            
            /* 交互状态 */
            focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary
            hover:border-primary/50
            
            /* 禁用状态 */
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900
            
            /* 过渡动画 */
            transition-all duration-200 ease-in-out
            
            /* 错误状态 */
            ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
            
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger mt-1 animate-in slide-in-from-top-1 fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
