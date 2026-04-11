export const PROPERTIES = [
  {
    id: 'prop_001', type: 'flat',
    title: 'Luxury 3BHK — Bandra West', description: 'Premium sea-facing apartment with modern amenities, private terrace, and 24/7 security. Spectacular sunset views.',
    location: { city: 'Mumbai', state: 'Maharashtra', locality: 'Bandra West', pincode: '400050' },
    price: 28500000, area: 1450, area_unit: 'sqft', bedrooms: 3, bathrooms: 2, floor: 12, total_floors: 22,
    rera_id: 'P51900028790', unit_no: 'B-1204',
    token_id: 4500123, asset_id: 'ALG-PROP-001', ipfs_cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    status: 'listed', owner_wallet: 'ALGO2XKP…SELL', owner_name: 'Priya Mehta', kyc_verified: true,
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Lift', 'Power Backup'], listed_at: '2026-03-20',
  },
  {
    id: 'prop_002', type: 'land',
    title: 'Agricultural Land — Nashik', description: 'Fertile agricultural land with perennial water access. Clear title, fully documented. Great for farming or investment.',
    location: { city: 'Nashik', state: 'Maharashtra', locality: 'Sinnar Taluka', pincode: '422103' },
    price: 5200000, area: 2.5, area_unit: 'acres',
    survey_no: 'SRV/NAS/2024/00451',
    token_id: 4500124, asset_id: 'ALG-PROP-002', ipfs_cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    status: 'listed', owner_wallet: 'ALGO3YKP…SELL', owner_name: 'Rajesh Patil', kyc_verified: true,
    amenities: ['Water Source', 'Road Access', 'Electricity'], listed_at: '2026-04-01',
  },
  {
    id: 'prop_003', type: 'flat',
    title: 'Studio Apartment — Koramangala', description: 'Modern studio in prime tech-hub location. Perfect for professionals. Ready to move.',
    location: { city: 'Bengaluru', state: 'Karnataka', locality: 'Koramangala 5th Block', pincode: '560095' },
    price: 7800000, area: 620, area_unit: 'sqft', bedrooms: 1, bathrooms: 1, floor: 5, total_floors: 12,
    rera_id: 'PRM/KA/RERA/1251/308', unit_no: 'A-503',
    token_id: 4500125, asset_id: 'ALG-PROP-003', ipfs_cid: '',
    status: 'escrow', owner_wallet: 'ALGO4YKP…SELL', owner_name: 'Deepa Krishnan', kyc_verified: true,
    amenities: ['Gym', 'Parking', 'Security', 'Lift'], listed_at: '2026-03-10',
  },
  {
    id: 'prop_004', type: 'flat',
    title: '4BHK Penthouse — Jubilee Hills', description: 'Ultra-luxury penthouse with 360° city views, private pool, and premium Italian marble finishing.',
    location: { city: 'Hyderabad', state: 'Telangana', locality: 'Jubilee Hills', pincode: '500033' },
    price: 65000000, area: 4200, area_unit: 'sqft', bedrooms: 4, bathrooms: 4, floor: 28, total_floors: 28,
    rera_id: 'P02210002548', unit_no: 'PH-01',
    token_id: null, asset_id: null, ipfs_cid: '',
    status: 'listed', owner_wallet: 'ALGO5YKP…SELL', owner_name: 'Vikram Reddy', kyc_verified: true,
    amenities: ['Private Pool', 'Gym', 'Helipad', 'Concierge', 'Smart Home'], listed_at: '2026-04-05',
  },
  {
    id: 'prop_005', type: 'land',
    title: 'Commercial Plot — Gurgaon Sector 48', description: 'Prime commercial plot in high-demand sector, DTCP approved for mixed-use development.',
    location: { city: 'Gurgaon', state: 'Haryana', locality: 'Sector 48', pincode: '122018' },
    price: 18000000, area: 5000, area_unit: 'sqft',
    survey_no: 'KNL/GGN/2023/007812',
    token_id: 4500126, asset_id: 'ALG-PROP-005', ipfs_cid: 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o',
    status: 'sold', owner_wallet: 'ALGO6YKP…SELL', owner_name: 'Anita Gupta', kyc_verified: true,
    amenities: ['Road Access', 'Power', 'Water', 'Drainage'], listed_at: '2026-02-14',
  },
  {
    id: 'prop_006', type: 'flat',
    title: '2BHK — Salt Lake City, Kolkata', description: 'Well-maintained 2BHK in prestigious Salt Lake, close to IT hubs and elite schools. Ready to move.',
    location: { city: 'Kolkata', state: 'West Bengal', locality: 'Salt Lake City Block AA', pincode: '700064' },
    price: 6500000, area: 980, area_unit: 'sqft', bedrooms: 2, bathrooms: 2, floor: 3, total_floors: 8,
    rera_id: 'HIRA/A/KOL/2022/000234', unit_no: 'C-301',
    token_id: 4500127, asset_id: 'ALG-PROP-006', ipfs_cid: 'QmQNnXgGWQp4uXbFrMBEFv43ZMjzVhHDyUEP3FyQe7oPa',
    status: 'listed', owner_wallet: 'ALGO7YKP…SELL', owner_name: 'Soumitra Das', kyc_verified: true,
    amenities: ['Lift', 'Parking', 'Security', 'Park'], listed_at: '2026-04-08',
  },
]

export const ESCROW_RECORDS = [
  {
    id: 'esc_001', property_id: 'prop_003', property_title: 'Studio — Koramangala',
    buyer_wallet: 'ALGO7XKP…USR1', seller_wallet: 'ALGO4YKP…SELL',
    amount: 7800000, status: 'token_locked',
    token_locked: true, payment_locked: false,
    escrow_address: 'ESCROW7XKP2MNQR4UV…',
    created_at: '2026-04-07', updated_at: '2026-04-09',
  }
]

export const PURCHASE_REQUESTS = [
  {
    id: 'req_001', property_id: 'prop_001', property_title: 'Luxury 3BHK — Bandra West',
    buyer_wallet: 'ALGO7XKP…USR1', buyer_name: 'Arjun Sharma',
    amount: 28500000, status: 'pending', created_at: '2026-04-09',
  }
]

// Helpers
export const formatPrice = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `${(n / 100000).toFixed(2)} L`
  return `${n.toLocaleString('en-IN')}`
}

export const getStatusBadge = (status) => {
  switch (status) {
    case 'listed': return 'success'
    case 'escrow': return 'warning'
    case 'sold':   return 'gray'
    default:       return 'gray'
  }
}

export const STATUS_LABEL = { listed: 'Listed', escrow: 'In Escrow', sold: 'Sold' }
