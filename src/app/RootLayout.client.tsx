"use client"; // 确保这个组件仅在客户端运行

import { usePathname } from "next/navigation";
import Layout from "@/components/shared/Layout"; // 引入共享布局
import { DiscussionsProvider } from "@/context/DiscussionsContext";
import { DiscussionsProviderForPublic } from "@/context/DiscussionsContextForPublic";
import LayoutForPubilc from "@/components/shared-public/shared/Layout";
import React, { useEffect } from "react";

import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 判断当前是否是 public 页面
  const isPublicPage = pathname?.startsWith("/public");

  return (
    <ThemeProvider> {/* 使用 ThemeProvider 包裹整个应用 */}
      <div>
        {/* 条件渲染：如果是 public 页面，则不显示 Layout */}
        {!isPublicPage && <DiscussionsProvider><Layout>{children}</Layout></DiscussionsProvider>}
        {isPublicPage && <DiscussionsProviderForPublic><LayoutForPubilc>{children}</LayoutForPubilc></DiscussionsProviderForPublic>}
      </div>
    </ThemeProvider>
  );
}
