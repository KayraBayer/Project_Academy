import { cn } from '../../utils/classNames';

export default function BrandLogo({ className = '', imageClassName = '' }) {
  return (
    <span className={cn('relative block h-10 w-52', className)} role="img" aria-label="Erdinç Bayer Akademi">
      <img
        src="/assets/logo_white.png"
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full object-contain object-left opacity-100 transition-opacity duration-500 ease-out dark:opacity-0',
          imageClassName,
        )}
      />
      <img
        src="/assets/logo_dark.png"
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full object-contain object-left opacity-0 transition-opacity duration-500 ease-out dark:opacity-100',
          imageClassName,
        )}
      />
    </span>
  );
}
