import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import ModuleSelectorPage from './pages/ModuleSelectorPage';
import UnifiedDashboard from './pages/UnifiedDashboard';
import DashboardPage from './pages/DashboardPage';
import HousesPage from './pages/HousesPage';
import HouseDetailPage from './pages/HouseDetailPage';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Paddy module pages
import PaddyDashboardPage from './pages/paddy/DashboardPage';
import PaddyFieldsPage from './pages/paddy/FieldsPage';
import PaddyFieldDetailPage from './pages/paddy/FieldDetailPage';
import PaddyWorkersPage from './pages/paddy/WorkersPage';
import PaddyExpensesPage from './pages/paddy/ExpensesPage';
import PaddyIncomePage from './pages/paddy/IncomePage';
import PaddyReportsPage from './pages/paddy/ReportsPage';

// Coconut module pages
import CoconutDashboardPage from './pages/coconut/DashboardPage';
import CoconutGrovesPage from './pages/coconut/GrovesPage';
import CoconutGroveDetailPage from './pages/coconut/GroveDetailPage';
import CoconutWorkersPage from './pages/coconut/WorkersPage';
import CoconutExpensesPage from './pages/coconut/ExpensesPage';
import CoconutIncomePage from './pages/coconut/IncomePage';
import CoconutReportsPage from './pages/coconut/ReportsPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      {/* Module Selector */}
      <Route path="/" element={
        <PrivateRoute>
          <ModuleSelectorPage />
        </PrivateRoute>
      } />

      {/* Unified Dashboard */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout module="unified" />
        </PrivateRoute>
      }>
        <Route index element={<UnifiedDashboard />} />
      </Route>

      {/* Rental Module */}
      <Route path="/rental" element={
        <PrivateRoute>
          <Layout module="rental" />
        </PrivateRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="houses/:id" element={<HouseDetailPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Paddy Module */}
      <Route path="/paddy" element={
        <PrivateRoute>
          <Layout module="paddy" />
        </PrivateRoute>
      }>
        <Route index element={<PaddyDashboardPage />} />
        <Route path="fields" element={<PaddyFieldsPage />} />
        <Route path="fields/:id" element={<PaddyFieldDetailPage />} />
        <Route path="workers" element={<PaddyWorkersPage />} />
        <Route path="expenses" element={<PaddyExpensesPage />} />
        <Route path="income" element={<PaddyIncomePage />} />
        <Route path="reports" element={<PaddyReportsPage />} />
      </Route>

      {/* Coconut Module */}
      <Route path="/coconut" element={
        <PrivateRoute>
          <Layout module="coconut" />
        </PrivateRoute>
      }>
        <Route index element={<CoconutDashboardPage />} />
        <Route path="groves" element={<CoconutGrovesPage />} />
        <Route path="groves/:id" element={<CoconutGroveDetailPage />} />
        <Route path="workers" element={<CoconutWorkersPage />} />
        <Route path="expenses" element={<CoconutExpensesPage />} />
        <Route path="income" element={<CoconutIncomePage />} />
        <Route path="reports" element={<CoconutReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
