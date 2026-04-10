import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import SellProperty from './pages/SellProperty'
import OwnershipCheck from './pages/OwnershipCheck'
import Activity from './pages/Activity'
import KYC from './pages/KYC' // Kept just in case the URL needs to be hit directly
import Escrow from './pages/Escrow'
import './App.css'

function AppLayout() {
  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/sell" element={<SellProperty />} />
          <Route path="/ownership-check" element={<OwnershipCheck />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/escrow/:id" element={<Escrow />} />

          {/* Legacy redirects */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/activity" replace />} />
          <Route path="/list-property" element={<Navigate to="/sell" replace />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <div className="not-found">
      <div className="nf-code">404</div>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary mt-12">Back to Home</a>
    </div>
  )
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </WalletProvider>
  )
}
