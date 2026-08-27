import { Outlet } from 'react-router-dom';

/**
 * Fullscreen, chrome-free shell for the 3D viewer routes.
 * The viewer owns 100% of the viewport — all UI is floating overlay panels.
 */
export function ViewerLayout() {
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-black">
      <Outlet />
    </div>
  );
}
