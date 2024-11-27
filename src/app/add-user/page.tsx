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
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Add New User</h2>

      {/* 用户输入表单 */}
      <div className="space-y-4">
        <div>
          <Input
            name="username"
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <Input
            name="email"
            type="email"
            placeholder="Email (可省略)"
            value={newUser.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 错误信息 */}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {/* 加载状态 */}
      {loading ? (
        <div className="text-center mt-4">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="text-center mt-6">
          <Button
            onClick={addUser}
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            Add User
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddUserPage;
