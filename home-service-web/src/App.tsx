import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/appStore";

import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import WorkerLayout from "./layouts/WorkerLayout";
import AdminLayout from "./layouts/AdminLayout";

import Splash from "./pages/auth/Splash";
import Onboarding from "./pages/auth/Onboarding";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OtpVerification from "./pages/auth/OtpVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CheckEmail from "./pages/auth/CheckEmail";
import VerifyEmail from "./pages/auth/VerifyEmail";

import Home from "./pages/customer/Home";
import Categories from "./pages/customer/Categories";
import WorkerList from "./pages/customer/WorkerList";
import WorkerProfile from "./pages/customer/WorkerProfile";
import BookingNew from "./pages/customer/BookingNew";
import BookingPayment from "./pages/customer/BookingPayment";
import LiveTracking from "./pages/customer/LiveTracking";
import Chat from "./pages/customer/Chat";
import Notifications from "./pages/customer/Notifications";
import Profile from "./pages/customer/Profile";
import BookingHistory from "./pages/customer/BookingHistory";
import Favorites from "./pages/customer/Favorites";
import Addresses from "./pages/customer/Addresses";

import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerJobs from "./pages/worker/Jobs";
import WorkerWallet from "./pages/worker/Wallet";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminWorkers from "./pages/admin/Workers";
import AdminBookings from "./pages/admin/Bookings";
import AdminCategories from "./pages/admin/Categories";
import AdminCoupons from "./pages/admin/Coupons";
import AdminComplaints from "./pages/admin/Complaints";
import AdminWithdrawals from "./pages/admin/Withdrawals";

function RoleGate({ role, children }: { role: "customer" | "worker" | "admin"; children: React.ReactNode }) {
  const currentRole = useAppStore((s) => s.role);
  if (currentRole !== role) {
    const fallback = currentRole === "worker" ? "/worker/dashboard" : currentRole === "admin" ? "/admin/dashboard" : "/home";
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {isAuthenticated ? (
          <>
            <Route
              element={
                <RoleGate role="customer">
                  <CustomerLayout />
                </RoleGate>
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/workers/all" element={<WorkerList />} />
              <Route path="/workers/:categoryId" element={<WorkerList />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route
              element={
                <RoleGate role="customer">
                  <AuthLayout />
                </RoleGate>
              }
            >
              <Route path="/worker/:id" element={<WorkerProfile />} />
              <Route path="/booking/new/:workerId" element={<BookingNew />} />
              <Route path="/booking/:workerId/payment" element={<BookingPayment />} />
              <Route path="/booking/:workerId/track" element={<LiveTracking />} />
              <Route path="/chat/:bookingId" element={<Chat />} />
              <Route path="/bookings" element={<BookingHistory />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/addresses" element={<Addresses />} />
            </Route>

            <Route
              element={
                <RoleGate role="worker">
                  <WorkerLayout />
                </RoleGate>
              }
            >
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/jobs" element={<WorkerJobs />} />
              <Route path="/worker/wallet" element={<WorkerWallet />} />
              <Route path="/worker/chat/:bookingId" element={<Chat />} />
            </Route>

            <Route
              element={
                <RoleGate role="admin">
                  <AdminLayout />
                </RoleGate>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/workers" element={<AdminWorkers />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            </Route>
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
