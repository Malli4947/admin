export const MOCK_PROPERTIES = [
  { _id:'p1', title:'Casa Luxura Penthouse', type:'Residential', subtype:'Penthouse', status:'For Sale', price:42000000, priceLabel:'₹4.2 Cr', 'location.locality':'Banjara Hills', featured:true, badge:'Premium', isActive:true, views:342, enquiries:18, createdAt:'2025-01-10', image:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=70' },
  { _id:'p2', title:'Viraj Grand Villa',     type:'Residential', subtype:'Villa',      status:'For Sale', price:65000000, priceLabel:'₹6.5 Cr', 'location.locality':'Jubilee Hills',  featured:true, badge:'Featured',  isActive:true, views:285, enquiries:14, createdAt:'2025-01-14', image:'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=70' },
  { _id:'p3', title:'Skyline 3BHK Apt',     type:'Residential', subtype:'Apartment',  status:'For Sale', price:15000000, priceLabel:'₹1.5 Cr', 'location.locality':'Kondapur',       featured:false, badge:'New Launch', isActive:true, views:198, enquiries:9,  createdAt:'2025-01-18', image:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=70' },
  { _id:'p4', title:'Malli Luxury Villa',   type:'Residential', subtype:'Villa',      status:'For Rent', price:80000,    priceLabel:'₹80K/mo',  'location.locality':'Madhapur',        featured:true,  badge:'Hot',       isActive:true, views:421, enquiries:22, createdAt:'2025-01-20', image:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=70' },
  { _id:'p5', title:'Horizon Office Tower', type:'Commercial',  subtype:'Office',     status:'For Sale', price:35000000, priceLabel:'₹3.5 Cr', 'location.locality':'Hitec City',     featured:true,  badge:'Commercial', isActive:true, views:163, enquiries:7,  createdAt:'2025-01-22', image:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=70' },
  { _id:'p6', title:'Green Valley Row',     type:'Residential', subtype:'Row House',  status:'For Sale', price:18000000, priceLabel:'₹1.8 Cr', 'location.locality':'Narsingi',       featured:false, badge:null,         isActive:false,views:87,  enquiries:3,  createdAt:'2025-01-25', image:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=70' },
];

export const MOCK_CATEGORIES = [
  { _id:'c1', name:'Residential', slug:'residential', description:'Apartments, Villas, Row Houses & Duplexes', icon:'🏠', color:'#3B82F6', propertyCount:6, isActive:true, sortOrder:1, createdAt:'2025-01-01' },
  { _id:'c2', name:'Commercial',  slug:'commercial',  description:'Office Spaces, Retail Shops & Showrooms',  icon:'🏢', color:'#F59E0B', propertyCount:2, isActive:true, sortOrder:2, createdAt:'2025-01-01' },
  { _id:'c3', name:'Agriculture', slug:'agriculture', description:'Farmhouses & Agricultural Plots',           icon:'🌾', color:'#22C55E', propertyCount:1, isActive:true, sortOrder:3, createdAt:'2025-01-01' },
  { _id:'c4', name:'Luxury',      slug:'luxury',      description:'Ultra-Premium & Signature Properties',      icon:'💎', color:'#8B5CF6', propertyCount:3, isActive:true, sortOrder:4, createdAt:'2025-01-01' },
  { _id:'c5', name:'Industrial',  slug:'industrial',  description:'Warehouses, Factories & Industrial Plots',  icon:'🏭', color:'#EF4444', propertyCount:0, isActive:false,sortOrder:5, createdAt:'2025-01-05' },
];

export const MOCK_ENQUIRIES = [
  { _id:'e1', name:'Arjun Mehta',  email:'arjun@example.com',  phone:'9876543210', type:'Site Visit',      status:'new',    message:'Interested in the penthouse. Can I schedule a visit this weekend?', property:{title:'Casa Luxura Penthouse'}, createdAt:'2025-03-28T10:30:00Z' },
  { _id:'e2', name:'Priya Sharma', email:'priya@example.com',  phone:'9876543211', type:'Buy Property',    status:'read',   message:'What is the final negotiable price for the villa? Looking to buy within 3 months.', property:{title:'Viraj Grand Villa'}, createdAt:'2025-03-27T14:15:00Z' },
  { _id:'e3', name:'Ravi Kumar',   email:'ravi@example.com',   phone:'9876543212', type:'General Enquiry', status:'replied',message:'Looking for 3BHK under 2 Cr in Gachibowli or Kondapur.', property:null, createdAt:'2025-03-26T09:00:00Z' },
  { _id:'e4', name:'Sneha Patel',  email:'sneha@example.com',  phone:'9876543213', type:'Rent / Lease',    status:'new',    message:'Need a furnished villa for 12 months. Budget 80K per month.', property:{title:'Malli Luxury Villa'}, createdAt:'2025-03-25T16:45:00Z' },
  { _id:'e5', name:'Deepak Nair',  email:'deepak@example.com', phone:'9876543214', type:'NRI Enquiry',     status:'closed', message:'NRI from Dubai. Want to invest in commercial property. Need guidance on FEMA.', property:{title:'Horizon Office Tower'}, createdAt:'2025-03-24T11:20:00Z' },
  { _id:'e6', name:'Kavya Reddy',  email:'kavya@example.com',  phone:'9876543215', type:'Sell Property',   status:'new',    message:'I have a 3BHK in Gachibowli I want to sell. Can you help?', property:null, createdAt:'2025-03-23T08:30:00Z' },
];

export const MOCK_USERS = [
  { _id:'u1', name:'Arjun Mehta',   email:'arjun@example.com',  phone:'9876543210', role:'user',       isActive:true,  createdAt:'2025-01-15', lastLogin:'2025-03-28' },
  { _id:'u2', name:'Priya Sharma',  email:'priya@example.com',  phone:'9876543211', role:'user',       isActive:true,  createdAt:'2025-01-20', lastLogin:'2025-03-27' },
  { _id:'u3', name:'Admin', email:'admin@primepro.in',  phone:'9876543212', role:'admin',      isActive:true,  createdAt:'2025-01-01', lastLogin:'2025-03-28' },
  { _id:'u4', name:'Super Admin',   email:'super@primepro.in',  phone:'9876543213', role:'superadmin', isActive:true,  createdAt:'2025-01-01', lastLogin:'2025-03-28' },
  { _id:'u5', name:'Ravi Kumar',    email:'ravi@example.com',   phone:'9876543214', role:'user',       isActive:false, createdAt:'2025-02-10', lastLogin:'2025-03-10' },
];

export const MOCK_CMS = {
  hero: {
    title: 'Find Your Dream Property in Hyderabad',
    subtitle: 'Discover 1,200+ verified listings across Hyderabad\'s prime locations. Zero brokerage. RERA compliant.',
    ctaText: 'Browse Properties',
    backgroundImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
  },
  about: {
    heading: 'Hyderabad\'s Most Trusted Real Estate Platform',
    body: 'PrimePro was founded in 2012 with a simple belief — buying or renting a home should be an exciting, not stressful, experience.',
    yearsExperience: 12,
    email: 'info@primepro.in',
    phone: '1800 500 600',
  },
  seo: {
    metaTitle: 'PrimePro — Premium Real Estate in Hyderabad',
    metaDescription: 'Find verified residential, commercial and agricultural properties in Hyderabad. No brokerage. RERA certified.',
    keywords: 'real estate hyderabad, buy flat hyderabad, villa for sale, commercial property',
  },
  banners: [
    { _id:'b1', title:'Summer Offer', subtitle:'Get free legal consultation with every purchase', isActive:true, image:'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80' },
    { _id:'b2', title:'New Launch',   subtitle:'Casa Luxura — Banjara Hills from ₹4.2 Cr',       isActive:false, image:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
  ],
};

export const MOCK_STATS = {
  totalProperties: 9,
  totalUsers: 5,
  totalEnquiries: 6,
  newEnquiriesToday: 2,
  activeListings: 8,
  featuredCount: 4,
  enquiriesByType: [
    { _id:'Site Visit', count:1 }, { _id:'Buy Property', count:2 },
    { _id:'General Enquiry', count:1 }, { _id:'Rent / Lease', count:1 },
    { _id:'NRI Enquiry', count:1 },
  ],
  propertiesByType: [
    { _id:'Residential', count:6 }, { _id:'Commercial', count:2 }, { _id:'Agriculture', count:1 },
  ],
  monthlyEnquiries: [
    { month:'Oct', count:8 }, { month:'Nov', count:14 }, { month:'Dec', count:11 },
    { month:'Jan', count:19 }, { month:'Feb', count:22 }, { month:'Mar', count:6 },
  ],
};