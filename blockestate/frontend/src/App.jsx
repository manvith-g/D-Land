import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import KYCModal from './components/KYCModal';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AboutPage from './pages/AboutPage';
import './index.css';

function AppInner() {
  const { showKYCModal, setShowKYCModal, wallet } = useAuth();

  // Show KYC modal on first visit if no wallet
  return (
    <>
      <Navbar />

      {/* Global KYC gate */}
      {showKYCModal && (
        <KYCModal onClose={() => setShowKYCModal(false)} />
      )}

      <main>
        <Routes>
          <Route path="/"               element={<LandingPage />}        />
          <Route path="/marketplace"    element={<MarketplacePage />}     />
          <Route path="/property/:id"   element={<PropertyDetailPage />}  />
          <Route path="/seller"         element={<SellerDashboard />}     />
          <Route path="/buyer"          element={<BuyerDashboard />}      />
          <Route path="/about"          element={<AboutPage />}           />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}