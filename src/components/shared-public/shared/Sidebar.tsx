'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Globe, Settings, Users, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
    const pathname = usePathname(); // 获取当前路径
    const [isExpanded, setIsExpanded] = useState(true); // 控制侧边栏展开/收起

    // 定义侧边栏菜单项
    const menuItems = [
        // { href: "/dashboard", label: "Dashboard", icon: <Home className="mr-3 h-5 w-5" /> },
        {
            href: '/public/projects',
            label: 'Projects',
            icon: <Globe className="mr-3 h-5 w-5" />,
        },
        // { href: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
    ];

    // // 仅管理员可见的菜单项
    // const adminMenuItems = [
    //     { href: "/user-list", label: "User Management", icon: <Users className="mr-3 h-5 w-5" /> },
    // ];

    // 切换侧边栏展开/收起
    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <aside
            className={`bg-white shadow-md ${isExpanded ? 'w-64' : 'w-16'} transition-width duration-300`}
        >
            {/* 侧边栏头部 */}
            <div className="flex items-center justify-between p-4">
                {isExpanded && (
                    <h1 className="text-2xl font-bold text-gray-800">
                        Contents
                    </h1>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md hover:bg-gray-200"
                >
                    {isExpanded ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* 侧边栏导航 */}
            <nav className={`mt-3 ${isExpanded ? 'block' : 'hidden'} md:block`}>
                {/* 普通菜单项 */}
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-2 ${
                            pathname === item.href
                                ? 'text-gray-700 bg-gray-200'
                                : 'text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {item.icon}
                        {isExpanded && item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
