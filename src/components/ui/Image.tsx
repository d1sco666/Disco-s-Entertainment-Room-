import { forwardRef, useState, type ImgHTMLAttributes } from 'react';
import { classNames } from '../../utils/helpers';

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'cinema' | 'portrait';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ alt, fallback, aspectRatio = 'video', radius = 'md', objectFit = 'cover', className, src, onError, loading = 'lazy', ...props }, ref) => {
    const aspectRatios = {
      square: 'aspect-square',
      video: 'aspect-video',
      cinema: 'aspect-[21/9]',
      portrait: 'aspect-[3/4]',
    };

    const radii = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    const [failedSrc, setFailedSrc] = useState<string | undefined>();
    const imageError = Boolean(src && failedSrc === src);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (src) setFailedSrc(src);
      onError?.(e);
    };

    const finalSrc = (imageError || !src) && fallback ? fallback : src;

    return (
      <div className={classNames('overflow-hidden', aspectRatios[aspectRatio], radii[radius], className)}>
        <img
          ref={ref}
          src={finalSrc}
          alt={alt}
          decoding="async"
          className={classNames(
            'w-full h-full',
            objectFit === 'cover' ? 'object-cover' : '',
            objectFit === 'contain' ? 'object-contain' : '',
            objectFit === 'fill' ? 'object-fill' : '',
            objectFit === 'none' ? 'object-none' : '',
            objectFit === 'scale-down' ? 'object-scale-down' : '',
            imageError ? 'opacity-50' : ''
          )}
          onError={handleError}
          loading={loading}
          {...props}
        />
      </div>
    );
  }
);

Image.displayName = 'Image';