'use client'; // 将整个文件标记为客户端组件
import { useState, useEffect } from 'react';
// import { useRouter } from "next/router";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignIn() {
    //创建formData状态，保存输入的用户名和密码
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState(''); //错误信息保存
    const router = useRouter(); //用于页面跳转
    const searchParams = useSearchParams(); //获取URL参数
    const { login } = useAuth(); // 使用 AuthContext 的 login 方法
    // 获取查询参数中的用户名
    useEffect(() => {
        const usernameFromQuery = searchParams.get('username') || '';
        if (usernameFromQuery) {
            setFormData((prevData) => ({
                ...prevData,
                username: usernameFromQuery,
            }));
        }
    }, [searchParams]);

    //动态更新输入的值并保存至formData中
    const handleChange = (e: { target: { id: any; value: any } }) => {
        setFormData({
            ...formData, //保留其他字段的当前值
            [e.target.id]: e.target.value,
        });
    };
    //表单提交处理函数，使用async函数处理异步请求
    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault(); //阻止默认提交行为，防止自动刷新

        try {
            //使用fetch向后端发送POST请求，发送用户的email和password
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
                {
                    method: 'POST', //设置请求方法为POST
                    headers: {
                        'Content-Type': 'application/json', //设置请求头，指定请求体的数据格式为JSON
                        'Accept-Language': 'zh-hans',
                    },
                    //传送username和password
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json(); //解析响应为json格式

            if (response.ok) {
                // 响应码为200，代表成功登陆
                login(result.token, formData.username); // 成功登录后调用 login 方法
                setError(''); //清空错误信息
                // console.log(token);
                router.push('/dashboard'); // 使用router.push跳转到dashboard界面
            } else {
                setError(result.error || 'Invalid credentials'); //登陆失败显示错误信息
            }
        } catch (error) {
            setError('An unexpected error occurred'); //如果请求失败（如网络问题）则设置通用错误信息
        }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {' '}
            {/*包裹整个表单的容器，居中显示*/}
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center">
                    Sign In to TranslateOS
                </h2>
                {error && <p className="text-red-500 text-center">{error}</p>}{' '}
                {/*如果有错误信息采用红色文本居中显示在表单顶部*/}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {' '}
                    {/*onSubmit绑定到指定的handleSubmit函数上*/}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="username"
                            placeholder="Enter your username" // 提示用户输入电子邮件
                            value={formData.username} // 绑定表单输入值到 formData 的 email 字段
                            onChange={handleChange} // 绑定 onChange 事件，动态更新 formData
                            required // 设置为必填字段
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password" // 提示用户输入密码
                            value={formData.password} // 绑定表单输入值到 formData 的 password 字段
                            onChange={handleChange} // 绑定 onChange 事件，动态更新 formData
                            required // 设置为必填字段
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Sign In
                    </Button>{' '}
                    {/* 提交按钮 */}
                </form>
                <p className="text-center">
                    Don't have an account?{' '}
                    <Link
                        href="/signup"
                        className="text-blue-600 hover:underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
