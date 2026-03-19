import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Header, Footer, MobileNav } from './components/Layout';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import WishlistPage from './pages/WishlistPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-primary font-serif italic text-2xl animate-pulse">Khushi...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Routes>
              {/* Admin Routes - No Header/Footer */}
              <Route 
                path="/admin" 
                element={user ? <AdminDashboard /> : <AdminLogin />} 
              />
              
              {/* Public Routes */}
              <Route path="*" element={
                <div className="flex flex-col min-h-screen w-full pb-[72px] lg:pb-0">
                  <Header />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                  <MobileNav />
                </div>
              } />
            </Routes>
          </div>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}
