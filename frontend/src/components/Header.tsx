import { BrandLogo } from './brand/BrandLogo';

export default function HeaderApp() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 h-16
                       bg-slate-900/90 backdrop-blur-sm border-b border-slate-800
                       flex items-center px-6">
      <BrandLogo textSize="text-sm" iconSize={22} />
    </header>
  );
}