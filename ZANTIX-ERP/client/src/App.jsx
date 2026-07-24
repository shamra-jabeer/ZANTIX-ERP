import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Invoices from "./pages/Invoices";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public route - Login page */}
      <Route path="/" element={<Login />} />

      {/* Protected routes - only accessible when logged in */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/products"
        element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>}
      />
      <Route
        path="/inventory"
        element={<ProtectedRoute><Inventory /></ProtectedRoute>}
      />
      <Route
        path="/invoices"
        element={<ProtectedRoute><Invoices /></ProtectedRoute>}
      />
      <Route
        path="/orders"
        element={<ProtectedRoute><Orders /></ProtectedRoute>}
      />
      <Route
        path="/suppliers"
        element={<ProtectedRoute adminOnly><Suppliers /></ProtectedRoute>}
      />
      <Route
        path="/reports"
        element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>}
      />
    </Routes>
  );
}

export default App;