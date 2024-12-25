import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置选项
  trailingSlash: true,
  output: 'export', // 启用静态导出模式
  eslint: {
    // 完全禁用 ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;