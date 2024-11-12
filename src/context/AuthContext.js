"use client";

import { createContext, useState, useEffect, useContext } from "react";

// 创建 AuthContext
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 保存用户信息，包括 role
  const [token, setToken] = useState(null); // 保存 token

  // 初始化，从 localStorage 中获取 token
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken); // 如果有 token，获取用户信息
    }
  }, []);

  // 从后端获取用户信息，包括 role 字段
  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`, // 使用 `Token` 格式
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData); // 设置用户信息，包括 role 字段
        checkUserRole(userData.role); // 检查用户角色
      } else if (response.status === 401) {
        logout();
        console.log("Unauthorized access. Logging out...");
      } else {
        console.log("Failed to fetch user information");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // 检查用户角色，处理不同权限逻辑
  const checkUserRole = (role) => {
    if (role === "admin") {
      console.log("Admin user logged in");
      // 可以在这里触发特定的管理员逻辑或状态更新
    } else if (role === "user") {
      console.log("Regular user logged in");
      // 普通用户的逻辑处理
    } else {
      console.log("Unknown role");
      // 处理未知角色（可选）
    }
  };

  // 登录时设置 token 并获取用户信息
  const login = (authToken) => {
    setToken(authToken);
    localStorage.setItem("authToken", authToken);
    fetchUserInfo(authToken);
  };

  // 登出时清除 token 和用户信息
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，方便使用 AuthContext
export const useAuth = () => useContext(AuthContext);
