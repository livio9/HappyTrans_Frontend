// src/app/header/Header.tsx

'use client';

import React, { useState, useEffect, useRef } from "react";
import UserAvatar from "@/components/shared/UserAvatar"; // 引入共享的 UserAvatar 组件
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation'; // 导入 useRouter

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter(); // 初始化 useRouter 钩子

    // 切换下拉菜单显示状态
    const toggleDropdown = () => {
        setDropdownOpen((prevState) => !prevState);
    };

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // 处理登出操作
    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/welcome"; // 重定向到登录页
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    };

    // 处理头像点击，跳转到个人资料页面
    const handleAvatarClick = () => {
        // 跳转到个人资料页面
        router.push('/user-profile');
    };

    const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        router.push('/user-profile');
    };
    const handleAccountClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        router.push('/settings');
    };
    return (
        <header className="bg-white shadow-sm dark:bg-background border-b">
            <div className="flex items-center justify-between px-8 py-4">
                <h2 className="text-2xl font-semibold text-gray-800">TranslateOS</h2>
                <div className="flex items-center relative">
                    {/* 使用共享的 UserAvatar 组件 */}
                    <UserAvatar 
                        username={user?.username || "U"} 
                        size="md"  // 使用小尺寸
                        onClick={handleAvatarClick} 
                    />
                    <Button 
                        variant="ghost" 
                        className="ml-0 flex items-center text-sm" // 减少间距，并设置文字大小
                        onClick={toggleDropdown}
                    >
                        {user?.username || "U"}
                        <ChevronDown className="ml-1 h-4 w-4 z-20" />
                    </Button>
                    {dropdownOpen && (
                        <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary text-secondary-foreground shadow-lg rounded-md z-20"
                            style={{ top: "100%", marginTop: "8px" }} // 确保菜单下移
                        >
                            <ul className="space-y-2 p-4">
                                <li className="hover:bg-gray-200 dark:hover:bg-muted rounded-md p-2">
                                    
                                    <Button variant="ghost" className="w-full text-left text-sm"  onClick={handleProfileClick}>
                                        Profile Settings
                                    </Button>
                                </li>
                                <li className="hover:bg-gray-200 dark:hover:bg-muted rounded-md p-2">
                                    <Button variant="ghost" className="w-full text-left text-sm" onClick={handleAccountClick}>
                                        Account Settings
                                    </Button>
                                </li>
                                <li className="hover:bg-gray-200 dark:hover:bg-muted rounded-md p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-left text-red-600 text-sm"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </Button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
