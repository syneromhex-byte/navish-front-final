interface NavishLogoProps {
  className?: string;
  size?: number;
}

export function NavishLogo({ className = '', size = 44 }: NavishLogoProps) {
  return (
    <img
      src="/logo-badge.png"
      alt="NAVISH Logo"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: 'auto', maxHeight: `${size}px` }}
      className={`object-contain flex-shrink-0 ${className}`}
    />
  );
}
