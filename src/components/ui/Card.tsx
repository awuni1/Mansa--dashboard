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
        'bg-white rounded-xl border border-gray-200 transition-all duration-200',
        hover && 'hover:border-blue-300 hover:shadow-sm cursor-pointer',
        padding && 'p-5',
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

export function CardHeader({ children, className, gradient: _gradient }: CardHeaderProps) {
  return (
    <div className={clsx(
      'flex items-center justify-between border-b border-gray-100 pb-3 mb-4',
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
    <h3 className={clsx('text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2', className)}>
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={clsx('text-[12px] text-gray-500 mt-0.5', className)}>{children}</p>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}
