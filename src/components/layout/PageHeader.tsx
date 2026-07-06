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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-2xl text-gray-900 p-6 sm:p-8 rounded-3xl sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 relative z-40">
      <div className="absolute inset-0 overflow-hidden rounded-3xl sm:rounded-[32px] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-[80px]"></div>
      </div>
      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/80 rounded-[20px] sm:rounded-[24px] flex items-center justify-center border border-white shadow-sm shrink-0">
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm font-medium line-clamp-2">{description}</p>
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
