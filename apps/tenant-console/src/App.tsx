import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./shared/Layout";

// Decoupage par route (A3) -- chaque page n'est chargee que lorsqu'on y navigue,
// au lieu de tout regrouper dans le bundle initial.
const DashboardPage = lazy(() =>
  import("./modules/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const DriversPage = lazy(() =>
  import("./modules/drivers/DriversPage").then((m) => ({ default: m.DriversPage })),
);
const DriverDetailPage = lazy(() =>
  import("./modules/drivers/DriverDetailPage").then((m) => ({ default: m.DriverDetailPage })),
);
const DriverHistoryPage = lazy(() =>
  import("./modules/drivers/DriverHistoryPage").then((m) => ({ default: m.DriverHistoryPage })),
);
const VehiclesPage = lazy(() =>
  import("./modules/vehicles/VehiclesPage").then((m) => ({ default: m.VehiclesPage })),
);
const VehicleDetailPage = lazy(() =>
  import("./modules/vehicles/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage })),
);
const ReservationsPage = lazy(() =>
  import("./modules/reservations/ReservationsPage").then((m) => ({ default: m.ReservationsPage })),
);
const ReservationDetailPage = lazy(() =>
  import("./modules/reservations/ReservationDetailPage").then((m) => ({
    default: m.ReservationDetailPage,
  })),
);
const UsersPage = lazy(() =>
  import("./modules/users/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const TenantSettingsPage = lazy(() =>
  import("./modules/settings/TenantSettingsPage").then((m) => ({ default: m.TenantSettingsPage })),
);
const ProfilePage = lazy(() =>
  import("./modules/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const LoginPage = lazy(() =>
  import("./modules/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral">
      Chargement…
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/drivers/:id" element={<DriverDetailPage />} />
          <Route path="/drivers/:id/history" element={<DriverHistoryPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/:id" element={<ReservationDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<TenantSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
