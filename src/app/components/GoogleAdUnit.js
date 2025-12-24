'use client';

import { useEffect, useRef } from 'react';

/**
 * Google AdSense 手动广告单元组件
 * 
 * 使用场景: 当你不想使用“自动广告”，而是想在页面的特定位置（如侧边栏、文章底部）插入广告时使用。
 * 
 * 使用方法:
 * <GoogleAdUnit 
 *   pId="ca-pub-XXXXXXXXXXXXXXXX" 
 *   slotId="1234567890" 
 *   format="auto" 
 *   responsive={true} 
 * />
 */
export default function GoogleAdUnit({ pId, slotId, format = 'auto', responsive = true, style = {} }) {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  if (!pId || !slotId) return null;

  return (
    <div className="w-full overflow-hidden my-4 text-center">
      {/* 广告容器标签 */}
      <span className="text-xs text-gray-400 block mb-1">ADVERTISEMENT</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={pId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
