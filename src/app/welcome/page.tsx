"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const [currentStep, setCurrentStep] = useState(0);

  // 每个步骤的图片和说明
  const steps = [
    {
      title: "Step 1: Log In",
      description: "Start by logging in to your account.",
      image: "/image/1.PNG", 
    },
    {
      title: "Step 2: Set Your Language in Settings",
      description: "Go to Settings and set up your preferred language.",
      image: "/image/2.PNG", 
    },
    {
      title: "Step 3: View Project Information from Dashboard",
      description: "Go to your Dashboard to view and manage your projects.",
      image: "/image/3.PNG", 
    },
    {
      title: "Step 4: Select a Project from Projects",
      description: "Go to Projects, choose a project, and enter it.",
      image: "/image/4.PNG", 
    },
    {
      title: "Step 5: Choose a Language to Translate",
      description: "Inside the project, select the language you wish to translate.",
      image: "/image/5.PNG", 
    },
    {
      title: "Step 6: Start Translating by Selecting a Term",
      description: "Select a term in the language interface to start translating.",
      image: "/image/6.PNG", 
    },
    {
      title: "Step 7: Enter the Translation Interface and Begin Translating",
      description: "Now you're in the translation interface, ready to start your work.",
      image: "/image/7.PNG", 
    },
  ];

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-400 overflow-hidden">
      {/* 欢迎部分，固定位置 */}
      <h1 className="text-5xl font-bold mb-8 text-white flex items-center">
        <span>—— ——</span>
        <span className="mx-8">Welcome to TranslateOS</span>
        <span>—— ——</span>
      </h1>
      
      {/* 浅色背景部分横跨整个屏幕，设置高度为70%，并加宽到70% */}
      <div className="bg-gray-100 text-gray-800 py-16 px-8 w-screen h-[70vh] relative">
        {/* 步骤引导部分，设置宽度为70% */}
        <div className="text-center w-full max-w-screen-xl mx-auto">
          <h2 className="text-3xl font-semibold mt-0">{steps[currentStep].title}</h2>
          
          {/* 图片滑动展示部分 */}
          <div className="relative mt-6 overflow-hidden w-full">
            <div className="flex items-center justify-center space-x-8 w-full">
              {/* 前一步的缩小虚化图片 */}
              {currentStep > 0 && (
                <img
                  src={steps[currentStep - 1].image}
                  alt={`Step ${currentStep}`}
                  className="w-[380px] h-auto transform scale-90 opacity-50 transition-all duration-500 border-4 border-gray-300 rounded-lg"
                />
              )}
              
              {/* 当前步骤图片，始终居中 */}
              <img
                src={steps[currentStep].image}
                alt={`Step ${currentStep + 1}`}
                className="w-[650px] h-auto transform scale-100 opacity-100 transition-all duration-500 border-4 border-gray-300 rounded-lg"
              />
              
              {/* 下一步的缩小虚化图片 */}
              {currentStep < steps.length - 1 && (
                <img
                  src={steps[currentStep + 1].image}
                  alt={`Step ${currentStep + 2}`}
                  className="w-[380px] h-auto transform scale-90 opacity-50 transition-all duration-500 border-4 border-gray-300 rounded-lg"
                />
              )}
            </div>
          </div>
          
          {/* 说明文本稍微上移，字体增大 */}
          <p className="mt-8 text-xl">{steps[currentStep].description}</p>
        </div>

        {/* 步骤控制按钮放在教程部分右下角 */}
        <div className="absolute bottom-6 right-6 flex space-x-8">
          {currentStep > 0 && (
            <Button
              asChild
              variant="outline"
              className="w-36 text-gray-800 text-lg py-3" // 调整按钮高度
              onClick={goToPreviousStep}
            >
              <span>← Previous</span>
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button
              asChild
              variant="outline"
              className="w-36 text-gray-800 text-lg py-3" // 调整按钮高度
              onClick={goToNextStep}
            >
              <span>Next →</span>
            </Button>
          )}
        </div>
      </div>

      {/* 登录和注册按钮平齐排列 */}
      <div className="flex space-x-8 mt-14">
        {/* 登录按钮 */}
        <Button asChild className="w-72 text-xl py-4">
          <Link href="/signin">Sign In</Link>
        </Button>
        {/* 注册按钮 */}
        <Button asChild variant="outline" className="w-72 text-xl py-4">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>

      {/* 无需登录直接进入按钮 */}
      <Button asChild variant="secondary" className="w-72 mt-8 text-xl py-4">
        <Link href="/dashboard">Continue Without Login</Link>
      </Button>
    </div>
  );
}
