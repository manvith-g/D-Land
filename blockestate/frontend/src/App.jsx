import { useState, useEffect } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { connectPeraWallet } from "./utils/algorand";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import PropertyDetail from "./pages/PropertyDetail";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import VerifyPage from "./pages/VerifyPage";
import "./App.css";

const peraWallet = new PeraWalletConnect();

export default function App() {
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("home");
  const [selectedProp, setSelectedProp] = useState(null);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) setAccount(accounts[0]);
    });
    peraWallet.connector?.on("disconnect", () => setAccount(null));
  }, []);

  async function handleConnect() {
    const addr = await connectPeraWallet(peraWallet);
    setAccount(addr);
  }

  function handleDisconnect() {
    peraWallet.disconnect();
    setAccount(null);
  }

  function navigate(p, prop = null) {
    setPage(p);
    setSelectedProp(prop);
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("home")}>
          <span className="brand-icon">🏡</span>
          <span className="brand-name">BlockEstate</span>
          <span className="brand-tag">on Algorand</span>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("listings")} className="nav-link">Browse</button>
          <button onClick={() => navigate("register")} className="nav-link">List Property</button>
          <button onClick={() => navigate("about")} className="nav-link">About</button>
          <button onClick={() => navigate("admin")} className="nav-link">Admin</button>
          <button onClick={() => navigate("verify")} className="nav-link">Verify</button>
        </div>
        <div className="wallet-area">
          {account ? (
            <div className="wallet-connected">
              <span className="wallet-addr">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button onClick={handleDisconnect} className="btn-disconnect">Disconnect</button>
            </div>
          ) : (
            <button onClick={handleConnect} className="btn-connect">
              Connect Pera Wallet
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">
        {page === "home"     && <HomePage navigate={navigate} />}
        {page === "listings" && <ListingsPage navigate={navigate} account={account} peraWallet={peraWallet} />}
        {page === "detail"   && <PropertyDetail property={selectedProp} account={account} peraWallet={peraWallet} navigate={navigate} />}
        {page === "register" && <RegisterPage account={account} navigate={navigate} />}
        {page === "about"    && <AboutPage />}
        {page === "admin"    && <AdminPage />}
        {page === "verify" && <VerifyPage />}
      </main>
    </div>
  );
}