'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 导入路由钩子
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import zxcvbn from 'zxcvbn'; // 导入 zxcvbn

export default function SignUp() {
    const router = useRouter();
    // 设置状态来保存表单数据、错误信息和成功状态
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 处理输入框变化
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    // 辅助函数：检查用户名格式
    const isValidUsername = (username: string) => {
        const usernameRegex = /^[A-Za-z0-9_.+-]{1,150}$/;
        return usernameRegex.test(username);
    };

    // 辅助函数：检查密码是否与用户名过于相似
    const isPasswordSimilarToUsername = (
        password: string,
        username: string
    ) => {
        // 简单的相似度检查，可以根据需要调整
        return password.toLowerCase().includes(username.toLowerCase());
    };

    // 提交表单的处理函数
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const { name, email, password, confirmPassword } = formData;

        // Username validation
        if (!name.trim()) {
            setError('Username is required.');
            return;
        }
        if (name.length > 150) {
            setError('Username must be 150 characters or fewer.');
            return;
        }
        if (!isValidUsername(name)) {
            setError(
                'Username can only contain letters, numbers, _, +, ., and - characters.'
            );
            return;
        }

        // Password validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (/^\d+$/.test(password)) {
            setError('Password cannot be all numbers.');
            return;
        }
        if (isPasswordSimilarToUsername(password, name)) {
            setError(
                'Password is too similar to the username. Please choose a more complex password.'
            );
            return;
        }

        // Use zxcvbn to check password strength
        const passwordStrength = zxcvbn(password);
        if (passwordStrength.score < 2) {
            // Score range is 0-4; 3 or above is recommended
            setError(
                'Password strength is insufficient. Please choose a more complex password.'
            );
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            // 向后端发送注册请求
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': 'zh-hans', // 可选: 指定响应语言
                    },
                    body: JSON.stringify({
                        username: name,
                        email: email,
                        password: password,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok) {
                setSuccess(true); // 注册成功
                setError(''); // 清空错误信息
                router.push(`/signin?username=${encodeURIComponent(name)}`);
                console.log('Token:', result.token); // 你可以保存 token 或跳转到其他页面
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (error) {
            setError('An unexpected error occurred');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center">
                    Sign Up for TranslateOS
                </h2>
                {error && <p className="text-red-500 text-center">{error}</p>}
                {success && (
                    <p className="text-green-500 text-center">
                        Registration successful!
                    </p>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            Confirm Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Sign Up
                    </Button>
                </form>
                <p className="text-center">
                    Already have an account?{' '}
                    <Link
                        href="/signin"
                        className="text-blue-600 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
