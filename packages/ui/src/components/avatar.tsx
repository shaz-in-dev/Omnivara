import { type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' };

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name = '', size = 'md', className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-brand-500 font-semibold text-white',
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
