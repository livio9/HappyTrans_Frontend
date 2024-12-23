// src/components/shared/Medal.tsx
import { FC } from 'react';
import { Trophy } from 'lucide-react'; // 或使用其他适合的图标

interface MedalProps {
    level: string;
    color: string;
}

const Medal: FC<MedalProps> = ({ level, color }) => {
    return (
        <div
            className={`flex items-center ${color} rounded-full px-2 py-0.5`}
            aria-label={level}
        >
            {/* 奖章图标 */}
            <Trophy className="h-4 w-4 text-white mr-1" />
            {/* 奖章级别 */}
            <span className="text-white text-xs">{level}</span>
        </div>
    );
};

export default Medal;
