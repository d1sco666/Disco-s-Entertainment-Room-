import { forwardRef, type HTMLAttributes } from 'react';
import { classNames } from '@/utils/helpers';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, className, style, ...props }, ref) => {
    const variants = {
      text: 'rounded h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    const baseStyle = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={classNames(
          'bg-dark-200 dark:bg-dark-700',
          variants[variant],
          className
        )}
        style={baseStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={classNames('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%' } />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={classNames('overflow-hidden rounded-lg border border-dark-700 bg-black', className)} aria-hidden="true">
      <Skeleton variant="rectangular" className="aspect-[3/4] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton variant="text" width="80%" />
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width="32%" />
          <Skeleton variant="circular" width={4} height={4} />
          <Skeleton variant="text" width="42%" />
        </div>
      </div>
    </div>
  );
}