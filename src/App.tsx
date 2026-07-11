import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AccessGate } from "@/components/layout/AccessGate";
import { UserRole } from "@/types";

// Pages
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import InventoryPage from "./pages/InventoryPage";
import QuotationsPage from "./pages/QuotationsPage";
import QuotationFormPage from "./pages/QuotationFormPage";
import QuotationPreviewPage from "./pages/QuotationPreviewPage";
import BillingPage from "./pages/BillingPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LabPage from "./pages/LabPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const shopRoles: UserRole[] = ['admin', 'sales', 'inventory', 'accountant'];
const labRoles: UserRole[] = ['admin', 'technician'];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><DashboardPage /></AccessGate>} />
              <Route path="/products" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><ProductsPage /></AccessGate>} />
              <Route path="/products/new" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><ProductFormPage /></AccessGate>} />
              <Route path="/products/:id/edit" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><ProductFormPage /></AccessGate>} />
              <Route path="/inventory" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><InventoryPage /></AccessGate>} />
              <Route path="/quotations" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><QuotationsPage /></AccessGate>} />
              <Route path="/quotations/new" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><QuotationFormPage /></AccessGate>} />
              <Route path="/quotations/:id" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><QuotationPreviewPage /></AccessGate>} />
              <Route path="/billing" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><BillingPage /></AccessGate>} />
              <Route path="/deliveries" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><DeliveriesPage /></AccessGate>} />
              <Route path="/reports" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><ReportsPage /></AccessGate>} />
              <Route path="/settings" element={<AccessGate allowedRoles={shopRoles} fallbackPath="/lab"><SettingsPage /></AccessGate>} />
              <Route path="/lab" element={<AccessGate allowedRoles={labRoles} fallbackPath="/dashboard"><LabPage /></AccessGate>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
