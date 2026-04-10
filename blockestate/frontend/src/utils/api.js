/**
 * api.js — Axios wrapper for all backend calls
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── KYC ────────────────────────────────────────────────────────────
export const submitKYC = (data) =>
  api.post('/api/kyc/submit', data).then(r => r.data);

export const getKYCStatus = (wallet) =>
  api.get('/api/kyc/status', { params: { wallet } }).then(r => r.data);

export const verifyOwnership = (wallet_address, land_record_id) =>
  api.post('/api/kyc/verify-ownership', { wallet_address, land_record_id }).then(r => r.data);

// ── Land Records ───────────────────────────────────────────────────
export const lookupLandRecord = (q) =>
  api.get('/api/land-records/lookup', { params: { q } }).then(r => r.data);

export const searchLandRecords = (q) =>
  api.get('/api/land-records/search', { params: { q } }).then(r => r.data);

export const getAllLandRecords = () =>
  api.get('/api/land-records/all').then(r => r.data);

// ── Listings ───────────────────────────────────────────────────────
export const getListings = () =>
  api.get('/api/listings').then(r => r.data);

export const getListing = (id) =>
  api.get(`/api/listings/${id}`).then(r => r.data);

export const getSellerListings = (wallet) =>
  api.get(`/api/listings/seller/${wallet}`).then(r => r.data);

export const createListing = (data) =>
  api.post('/api/listings', data).then(r => r.data);

export const cancelListing = (id, seller_wallet) =>
  api.post(`/api/listings/${id}/cancel`, { seller_wallet }).then(r => r.data);

// ── Buy Requests ───────────────────────────────────────────────────
export const sendBuyRequest = (data) =>
  api.post('/api/buy-requests', data).then(r => r.data);

export const getBuyerRequests = (wallet) =>
  api.get(`/api/buy-requests/buyer/${wallet}`).then(r => r.data);

export const getSellerRequests = (wallet) =>
  api.get(`/api/buy-requests/seller/${wallet}`).then(r => r.data);

export const getListingRequests = (listingId) =>
  api.get(`/api/buy-requests/listing/${listingId}`).then(r => r.data);

export const acceptRequest = (id, seller_wallet) =>
  api.post(`/api/buy-requests/${id}/accept`, { seller_wallet }).then(r => r.data);

export const rejectRequest = (id, seller_wallet) =>
  api.post(`/api/buy-requests/${id}/reject`, { seller_wallet }).then(r => r.data);

export const completeRequest = (id) =>
  api.post(`/api/buy-requests/${id}/complete`).then(r => r.data);

// ── Admin ──────────────────────────────────────────────────────────
export const getAdminInfo = () =>
  api.get('/api/admin/info').then(r => r.data);

export const getAdminListings = () =>
  api.get('/api/admin/listings').then(r => r.data);

export const approveListing = (id) =>
  api.post(`/api/admin/approve/${id}`).then(r => r.data);

export const rejectListing = (id) =>
  api.post(`/api/admin/reject/${id}`).then(r => r.data);

export const verifyOnChain = (term) =>
  api.get(`/api/admin/verify/${term}`).then(r => r.data);

export default api;
