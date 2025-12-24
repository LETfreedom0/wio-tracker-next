'use client';

import Script from 'next/script';

/**
 * Google AdSense 组件
 * 
 * 使用方法:
 * 在 src/app/layout.js 中引入此组件:
 * <GoogleAdsense pId="ca-pub-XXXXXXXXXXXXXXXX" />
 * 
 * 其中 pId 是你的 AdSense 发布商 ID。
 */
export default function GoogleAdsense({ pId }) {
  if (!pId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
