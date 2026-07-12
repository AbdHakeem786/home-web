import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/ui/BottomNav";
import { connectSocket } from "../api";
import { enablePushNotifications } from "../lib/push";

export default function CustomerLayout() {
  useEffect(() => {
    connectSocket();
    enablePushNotifications();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
