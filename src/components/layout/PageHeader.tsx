import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  rightContent?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  rightContent,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-2xl text-gray-900 px-6 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 relative z-40">
      <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[28px] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-[80px]"></div>
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 rounded-[16px] sm:rounded-[20px] flex items-center justify-center border border-white shadow-sm shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-0.5 text-xs sm:text-sm font-medium line-clamp-2">{description}</p>
        </div>
      </div>

      {rightContent && (
        <div className="relative z-10">
          {rightContent}
        </div>
      )}
    </div>
  );
}
