'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';

// 定义不显示侧边栏和头部导航的路径
const publicPaths = ['/welcome', '/signin', '/signup',];

// 布局组件，包含侧边栏和头部导航
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();

    // 更新路径检测逻辑
    const isPublicPath = React.useMemo(() => {
        if (!pathname) return true;
        
        // 使用正则表达式匹配完整的路径模式
        const publicPathPatterns = [
            /^\/public(\/|$)/, // 匹配 /public 开头的所有路径
            /^\/(welcome|signin|signup)(\/|$)/, // 匹配登录相关路径
            /^\/$/, // 匹配根路径
            /^$/ // 匹配空路径
        ];

        // 检查当前路径是否匹配任何公共路径模式
        return publicPathPatterns.some(pattern => pattern.test(pathname));
    }, [pathname]);

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
