import { Link } from 'react-router-dom'
import { Zap, ShieldCheck, Code, Send, Globe } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-mark">D</div>
              <span>D‑LAND</span>
            </Link>
            <p>India's first decentralized real estate marketplace. Own, verify, and trade properties on Algorand blockchain.</p>
            <div className="footer-chips">
              <span className="footer-chip"><Zap size={11} /> Algorand</span>
              <span className="footer-chip"><ShieldCheck size={11} /> RERA Compliant</span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/sell">Sell Property</Link></li>
              <li><Link to="/ownership-check">Check Ownership</Link></li>
              <li><Link to="/activity">My Activity</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Property Types</h5>
            <ul>
              <li><Link to="/marketplace?type=flat">Flats & Apartments</Link></li>
              <li><Link to="/marketplace?type=land">Land Parcels</Link></li>
              <li><Link to="/marketplace?status=listed">Active Listings</Link></li>
              <li><Link to="/marketplace?status=escrow">In Escrow</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">RERA Guidelines</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 D‑LAND Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" aria-label="Twitter"><Send size={15} /></a>
            <a href="#" aria-label="LinkedIn"><Globe size={15} /></a>
            <a href="#" aria-label="GitHub"><Code size={15} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
