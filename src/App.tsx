import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { AdminProvider, useAdmin } from '@/lib/admin';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { SearchPage } from '@/pages/SearchPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { AuthPage } from '@/pages/AuthPage';

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminBrands } from '@/pages/admin/AdminBrands';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminCancellations } from '@/pages/admin/AdminCancellations';
import { AdminReplacements } from '@/pages/admin/AdminReplacements';

function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function AdminRedirect() {
  const { token } = useAdmin();
  return <Navigate to={token ? '/admin/dashboard' : '/admin/login'} replace />;
}

function AdminRoutes() {
  return (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Storefront */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            {/* Admin */}
            <Route element={<AdminRoutes />}>
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="cancellations" element={<AdminCancellations />} />
                <Route path="replacements" element={<AdminReplacements />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
