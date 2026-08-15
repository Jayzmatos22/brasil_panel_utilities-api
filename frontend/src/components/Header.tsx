import { BrandLogo } from "./brand/BrandLogo";

export default function HeaderApp() {
  return (
    <header
      className="fixed backdrop-blur-md top-0 left-0 right-0 z-20 h-16
                       principal-header border-b-2 border-white/5 
                       flex items-center px-6"
    >
      <BrandLogo variant="sidebar" />
    </header>
  );
}
