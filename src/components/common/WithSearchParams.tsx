'use client';

import { Suspense, ReactNode } from 'react';

interface WithSearchParamsProps {
    children: ReactNode;
    fallback?: ReactNode;
}

// 创建一个高阶组件来包装使用 useSearchParams 的组件
export function WithSearchParams({ children, fallback = <div>Loading...</div> }: WithSearchParamsProps) {
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
}