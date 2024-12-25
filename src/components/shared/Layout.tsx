'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';

// 定义不显示侧边栏和头部导航的路径
const publicPaths = ['/welcome', '/signin', '/signup',];

// 布局组件，包含侧边栏和头部导航
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname(); // 获取当前路径

    // 判断当前路径是否为公共路径
    const isPublicPath = publicPaths.includes(pathname);

    return (
        <div className="flex min-h-screen bg-gray-100 overflow-hidden">
            {' '}
            {/* 使用 min-h-screen 并添加 overflow-hidden */}
            {/* 侧边栏 */}
            {!isPublicPath && <Sidebar />}
            {/* 主页面内容 */}
            <main
                className={`flex-1 overflow-y-auto bg-background ${!isPublicPath ? 'flex flex-col' : 'flex items-center justify-center'}`}
            >
                {!isPublicPath && <Header />}
                {!isPublicPath ? (
                    <div className="p-8">{children}</div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
};

export default Layout;
