import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/ui/BottomNav";
import { connectSocket } from "../api";
import { enablePushNotifications } from "../lib/push";
import { useFavoritesStore } from "../store/favoritesStore";

export default function CustomerLayout() {
  useEffect(() => {
    connectSocket();
    enablePushNotifications();
    useFavoritesStore.getState().load();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-card">
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
