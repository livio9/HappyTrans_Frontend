"use client";

import { createContext, useState, useEffect, useContext } from "react";

// 创建 AuthContext
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 保存用户信息
  const [token, setToken] = useState(null); // 保存 token

  // 初始化，从 localStorage 中获取 token
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken); // 如果有 token，获取用户信息
    }
  }, []);

  // 从后端获取用户信息
  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
        headers: {
          "Content-Type": "application/json", // 添加 Content-Type
          Authorization: `Token ${authToken}`, // 确保使用 `Token` 格式
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData); // 设置用户信息
      } else if (response.status === 401) { 
        // 如果 token 无效或过期，自动登出
        logout();
        console.log("Unauthorized access. Logging out...");
      } else {
        console.log("Failed to fetch user information");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // 登录时设置 token 并获取用户信息
  const login = (authToken) => {
    setToken(authToken);
    localStorage.setItem("authToken", authToken); // 将 token 存储到 localStorage
    fetchUserInfo(authToken); // 使用 token 获取用户信息
  };

  // 登出时清除 token 和用户信息
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken"); // 从 localStorage 中移除 token
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，方便使用 AuthContext
export const useAuth = () => useContext(AuthContext);
