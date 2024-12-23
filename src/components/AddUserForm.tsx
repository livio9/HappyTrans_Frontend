'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import zxcvbn from 'zxcvbn'; // 用于检测密码强度

interface AddUserFormProps {
    onSuccess?: () => void; // 当用户创建成功后，外部可执行的回调（如刷新列表、关闭弹窗）
    onClose?: () => void; // 用户点击“取消”时可执行的回调（如关闭弹窗）
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onSuccess, onClose }) => {
    // 添加了 confirmPassword 字段
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 辅助函数：检查用户名格式
    const isValidUsername = (username: string) => {
        // 仅允许字母、数字、下划线、加号、点、减号，且长度不超过 150
        const usernameRegex = /^[A-Za-z0-9_.+-]{1,150}$/;
        return usernameRegex.test(username);
    };

    // 辅助函数：检查密码是否与用户名过于相似
    const isPasswordSimilarToUsername = (
        password: string,
        username: string
    ) => {
        return password.toLowerCase().includes(username.toLowerCase());
    };

    // 处理输入框变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUser({
            ...newUser,
            [e.target.name]: e.target.value,
        });
    };

    // 点击“Add User”时执行的函数
    const addUser = async () => {
        setLoading(true);
        setError('');

        const { username, email, password, confirmPassword } = newUser;

        // 1. 用户名校验
        if (!username.trim()) {
            setError('Username is required.');
            setLoading(false);
            return;
        }
        if (username.length > 150) {
            setError('Username must be 150 characters or fewer.');
            setLoading(false);
            return;
        }
        if (!isValidUsername(username)) {
            setError(
                'Username can only contain letters, numbers, _, +, ., and - characters.'
            );
            setLoading(false);
            return;
        }

        // 2. 密码校验
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            setLoading(false);
            return;
        }
        if (/^\d+$/.test(password)) {
            setError('Password cannot be all numbers.');
            setLoading(false);
            return;
        }

        // 1. 检查两次输入的密码是否一致
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        // 2. 检查密码是否与用户名过于相似
        if (isPasswordSimilarToUsername(password, username)) {
            setError(
                'Password is too similar to the username. Please choose a more complex password.'
            );
            setLoading(false);
            return;
        }

        // 3. 用 zxcvbn 进行密码强度检测（0-4），3 或以上视为足够安全
        const passwordStrength = zxcvbn(password);
        if (passwordStrength.score < 2) {
            setError(
                'Password strength is insufficient. Please choose a more complex password.'
            );
            setLoading(false);
            return;
        }

        try {
            // 通过 query 参数示例发送 POST 请求
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('email', email);
            params.append('password', password);

            const response = await fetch(
                `http://127.0.0.1:8000/add-user?${params.toString()}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${localStorage.getItem('authToken')}`, // 使用本地存储的 authToken
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add user.');
            }

            // 如果添加成功，执行回调（刷新用户列表、关闭弹窗等）
            onSuccess?.();
        } catch (err) {
            console.error('Error adding user:', err);
            setError(
                err instanceof Error ? err.message : 'Failed to add user.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg p-4">
            {/* 你也可以把标题移到 Dialog 里，取决于你想要的 UI 结构 */}
            <div className="space-y-4">
                {/* Username */}
                <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        name="username"
                        type="text"
                        placeholder="Username"
                        value={newUser.username}
                        onChange={handleInputChange}
                        className="w-full"
                    />
                </div>

                {/* Email (可选) */}
                <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        className="w-full"
                    />
                </div>

                {/* Password */}
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        value={newUser.password}
                        onChange={handleInputChange}
                        className="w-full"
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={newUser.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full"
                    />
                </div>
            </div>

            {/* 错误信息提示 */}
            {error && <p className="text-red-500 text-center mt-2">{error}</p>}

            {/* 加载与按钮 */}
            {loading ? (
                <div className="text-center mt-4">Loading...</div>
            ) : (
                <div className="text-center mt-4 flex justify-center space-x-2">
                    <Button onClick={addUser} className="bg-black text-white">
                        Add User
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AddUserForm;
