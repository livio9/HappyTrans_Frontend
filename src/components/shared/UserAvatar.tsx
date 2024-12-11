// src/components/shared/UserAvatar.tsx

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  username: string;
  size?: "sm" | "md" | "lg" | "xl"; // 可选尺寸
  onClick?: () => void; // 可选点击事件
};

const avatarColors = [
    "#D8A7B1", // 柔和粉色
    "#B4A7C6", // 淡紫色
    "#A3B18A", // 柔绿
    "#C0B7AB", // 淡米色
    "#A0B9C1", // 柔和蓝色
    "#927E71", // 土色
    "#D1B190", // 柔和芥末色
    "#A9B18F", // 柔和橄榄色
    "#C6A49A", // 粉玫瑰色
    "#E2B7A0", // 柔和桃色
    "#7DA7A9", // 柔和青色
    "#C9A7B2", // 柔和紫红色
    "#D4B2C0", // 淡紫色
    "#D1CFCF", // 浅灰色
    "#BFA6A0", // 柔和棕色
    "#6C7A89", // 柔和海军色
  ];  

// 根据用户名生成颜色
const getAvatarColor = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username?.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

// 获取显示的首字母
const getInitials = (username: string): string => {
  if (!username) return "";
  const names = username.trim().split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  } else {
    return (
      names[0].charAt(0).toUpperCase() +
      names[names.length - 1].charAt(0).toUpperCase()
    );
  }
};

const UserAvatar: React.FC<UserAvatarProps> = ({ username, size = "lg", onClick }) => {
  const avatarColor = getAvatarColor(username);
  const initials = getInitials(username);

  // 根据 size prop 设置类名
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  // 根据 size prop 设置字体大小类
  const fontSizeClasses = {
    sm: "text-1xl",   // 28px
    md: "text-2xl",  // 32px
    lg: "text-4xl",  // 48px
    xl: "text-5xl",  // 64px
  };

  return (
    <Avatar
      className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer`}
      onClick={onClick}
    >
      {/* 如果有头像图片，可以传递图片 URL */}
      {/* <AvatarImage src={`/avatars/${username}.png`} alt={username} /> */}
      <AvatarFallback
        className="flex items-center justify-center bg-gray-500 text-white font-bold"
        style={{
          backgroundColor: avatarColor,
        }}
      >
        <span className={fontSizeClasses[size]}>{initials}</span>
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
