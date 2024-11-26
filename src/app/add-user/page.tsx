"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";  // 使用 Next.js 路由
import { useAuth } from "@/context/AuthContext";

const AddUserPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();  // 从上下文中获取当前用户信息

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  }); // 存储新用户信息

  const [error, setError] = useState(""); // 错误提示
  const [loading, setLoading] = useState(false); // 加载状态

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  const addUser = async () => {
    setLoading(true);
    setError(""); // 重置错误信息

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("username", newUser.username);
      params.append("email", newUser.email);
      params.append("password", newUser.password);

      // 发送 POST 请求，使用查询参数
      const response = await fetch(`http://127.0.0.1:8000/add-user?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`, // 使用本地存储的 authToken
        },
      });

      if (!response.ok) {
        const errorData = await response.json(); // 获取错误消息
        throw new Error(errorData.error || "Failed to add user.");
      }

      // 如果添加成功，跳转到用户列表页
      router.push("/user-list");
    } catch (err) {
      console.error("Error adding user:", err);
      setError("Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New User</h2>

      {/* 用户输入表单 */}
      <div className="mb-4">
        <Input
          name="username"
          type="text"
          placeholder="Username"
          value={newUser.username}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={handleInputChange}
          className="mb-2"
        />
      </div>

      {/* 错误信息 */}
      {error && <p className="text-red-500">{error}</p>}

      {/* 加载状态 */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Button onClick={addUser}>Add User</Button>
      )}
    </div>
  );
};

export default AddUserPage;
