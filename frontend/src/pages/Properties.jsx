import { useState, useEffect } from 'react'
import {
  Search, SlidersHorizontal, MapPin, Building2, Landmark,
  ShieldCheck, LayoutGrid
} from 'lucide-react'
import { PROPERTIES } from '../data/mockData'
import PropertyCard from '../components/PropertyCard'
import './Marketplace.css'

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, flat, land
  const [statusFilter, setStatusFilter] = useState('all') // all, listed, escrow
  
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/listings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const transformed = data.data.map(listing => {
            const rera = listing.rera_records || {}
            // Determine type: if no_of_flats > 0 or land_type relates to building
            const isFlat = rera.no_of_flats > 0
            
            return {
              id: listing.id,
              type: isFlat ? 'flat' : 'land',
              title: `${isFlat ? 'Flat' : 'Land'} in ${rera.location_village || 'Unknown'}`,
              description: `RERA verified property in ${rera.location_taluk || ''}`,
              location: { 
                city: rera.location_district || 'Unknown', 
                state: 'State', 
                locality: rera.location_village || 'Unknown', 
                pincode: '' 
              },
              price: Number(listing.price) || 0, 
              area: rera.area_sqft || 0, 
              area_unit: 'sqft', 
              bedrooms: 2, 
              bathrooms: 2, 
              floor: 1, 
              total_floors: 5,
              rera_id: listing.rera_id, 
              unit_no: '',
              token_id: listing.asset_id, 
              asset_id: listing.asset_id, 
              ipfs_cid: '',
              status: listing.status || 'listed', 
              owner_wallet: listing.seller_wallet, 
              owner_name: rera.owner_name || 'Anonymous', 
              kyc_verified: true,
              amenities: []
            }
          })
          setProperties(transformed)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  
  // Filtering logic
  const filtered = properties.filter(p => {
    // text search
    const sq = searchQuery.toLowerCase()
    const matchSearch = !sq || 
      p.title.toLowerCase().includes(sq) ||
      p.location.city.toLowerCase().includes(sq) ||
      p.location.locality.toLowerCase().includes(sq) ||
      p.rera_id?.toLowerCase().includes(sq) ||
      p.survey_no?.toLowerCase().includes(sq)

    // type filter
    const matchType = typeFilter === 'all' || p.type === typeFilter

    // status filter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter

    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="marketplace-page">
      {/* Search Header */}
      <div className="mk-header">
        <div className="container">
          <div className="mk-header-inner text-center anim-fade">
            <h1>Property Marketplace</h1>
            <p>Browse verified, tokenized real estate on the Algorand blockchain.</p>
            
            <div className="mk-search-bar card mt-12">
              <div className="mk-sb-input">
                <Search size={18} className="mk-sb-icon" />
                <input 
                  type="text" 
                  placeholder="Search by location, RERA ID, or Survey No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-lg mk-sb-btn">Search</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* Filters Row */}
        <div className="mk-filters anim-fade-1">
          <div className="mk-filter-group">
            <span className="mk-filter-label"><SlidersHorizontal size={14} /> Property Type:</span>
            <div className="tabs">
              <button 
                className={`tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              <button 
                className={`tab-btn ${typeFilter === 'flat' ? 'active' : ''}`}
                onClick={() => setTypeFilter('flat')}
              >
                <Building2 size={13} style={{ display:'inline', marginRight:4, verticalAlign:-2 }} /> Flats
              </button>
              <button 
                className={`tab-btn ${typeFilter === 'land' ? 'active' : ''}`}
                onClick={() => setTypeFilter('land')}
              >
                <Landmark size={13} style={{ display:'inline', marginRight:4, verticalAlign:-2 }} /> Land
              </button>
            </div>
          </div>

          <div className="mk-filter-group">
            <span className="mk-filter-label">Status:</span>
            <div className="tabs">
              <button 
                className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={`tab-btn ${statusFilter === 'listed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('listed')}
              >
                Listed (Sale)
              </button>
              <button 
                className={`tab-btn ${statusFilter === 'escrow' ? 'active' : ''}`}
                onClick={() => setStatusFilter('escrow')}
              >
                In Escrow
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1 }} />
          
          <div className="mk-results-count">
            <strong>{filtered.length}</strong> properties found
          </div>
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="mk-empty text-center anim-fade-2">
            <LayoutGrid size={48} strokeWidth={1} />
            <h3>No properties found</h3>
            <p>Try adjusting your search filters or browse all properties.</p>
            <button 
              className="btn btn-outline" 
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
              style={{ marginTop: 16 }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid-3 anim-fade-2">
            {filtered.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
