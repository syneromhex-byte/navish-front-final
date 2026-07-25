import { Outlet } from 'react-router-dom';
import { Navbar } from '@components/navbar/Navbar';
import { Footer } from '@components/footer/Footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
