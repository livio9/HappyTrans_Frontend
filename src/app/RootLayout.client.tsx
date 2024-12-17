"use client"; // 确保这个组件仅在客户端运行

import { usePathname } from "next/navigation";
import Layout from "@/components/shared/Layout"; // 引入共享布局
import LayoutForPubilc from "@/components/shared-public/shared/Layout";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 判断当前是否是 public 页面
  const isPublicPage = pathname?.startsWith("/public");

  return (
    <div>
      {/* 条件渲染：如果是 public 页面，则不显示 Layout */}
      {!isPublicPage && <Layout>{children}</Layout>}
      {isPublicPage && <LayoutForPubilc>{children}</LayoutForPubilc>}
    </div>
  );
}
