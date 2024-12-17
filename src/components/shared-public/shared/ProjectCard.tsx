import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRight, PieChart } from "lucide-react";
import Link from "next/link";

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

interface ProjectCardProps {
  projectName: string;
  activities: ActivityLog[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({ projectName, activities }) => {
  return (
    <Card className="shadow-sm">
      {/* 修改CardHeader的样式 */}
      <CardHeader className="flex flex-row items-center space-x-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">{projectName}</span>
          <Link
            href={`/language-versions?project=${encodeURIComponent(projectName)}`}
            className="flex items-center justify-center bg-black hover:bg-gray-800 rounded-full p-2 transition-colors duration-200"
            aria-label={`Go to ${projectName} details`}
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activities.</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start">
                <PieChart className="mt-1 mr-2 h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{activity.details}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
