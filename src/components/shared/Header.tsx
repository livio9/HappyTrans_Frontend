'use client';

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

    return (
        <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between px-8 py-4">
                <h2 className="text-2xl font-semibold text-gray-800">TranslateOS</h2>
                <div className="flex items-center relative">
                    <Avatar className="ml-4" onClick={handleAvatarClick}> {/* 添加头像点击事件 */}
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                        <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" className="ml-2" onClick={toggleDropdown}>
                        {user?.name || "John Doe"}
                        <ChevronDown className="ml-2 h-4 w-4 z-20" />
                    </Button>
                    {dropdownOpen && (
                        <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-20"
                            style={{ top: "100%", marginTop: "8px" }} // 确保菜单下移
                        >
                            <ul className="space-y-2 p-4">
                                <li className="hover:bg-gray-200 rounded-md p-2">
                                    <Button variant="ghost" className="w-full text-left">
                                        Profile Settings
                                    </Button>
                                </li>
                                <li className="hover:bg-gray-200 rounded-md p-2">
                                    <Button variant="ghost" className="w-full text-left">
                                        Account Settings
                                    </Button>
                                </li>
                                <li className="hover:bg-gray-200 rounded-md p-2">
                                    <Button variant="ghost" className="w-full text-left">
                                        Privacy
                                    </Button>
                                </li>
                                <li className="hover:bg-gray-200 rounded-md p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-left text-red-600"
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
