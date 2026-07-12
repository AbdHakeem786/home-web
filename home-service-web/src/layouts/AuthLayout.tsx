import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <Outlet />
    </div>
  );
}
