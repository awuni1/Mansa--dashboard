import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className, padding = true, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100 transition-all duration-300',
        hover && 'hover:shadow-xl sm:hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] hover:border-gray-200 cursor-pointer',
        padding && 'p-3 sm:p-5 lg:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function CardHeader({ children, className, gradient = false }: CardHeaderProps) {
  return (
    <div className={clsx(
      'border-b border-gray-100 pb-3 sm:pb-4 mb-4 sm:mb-5',
      gradient && 'bg-gradient-to-r from-blue-50 to-cyan-50 -mx-3 sm:-mx-5 lg:-mx-6 px-3 sm:px-5 lg:px-6 py-3 sm:py-4 mb-4 sm:mb-5 rounded-t-xl sm:rounded-t-2xl',
      className
    )}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function CardTitle({ children, className, icon }: CardTitleProps) {
  return (
    <h3 className={clsx('text-xl font-bold text-gray-900 flex items-center', className)}>
      {icon && <span className="mr-3 text-blue-600">{icon}</span>}
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={clsx('text-sm text-gray-600 mt-1', className)}>{children}</p>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}