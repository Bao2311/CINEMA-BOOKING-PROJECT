import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  FaTicketAlt, FaPercent, FaCalendarAlt, FaClock, 
  FaShoppingBasket, FaUsers, FaInfoCircle, FaSearch,
  FaFilter, FaStar, FaRegStar
} from 'react-icons/fa';

const UserPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('https://localhost:7168/api/Promotion');
        const data = await response.json();
        const mappedPromotions = data.$values.map(promo => ({
          id: promo.promotion_ID,
          name: promo.title,
          code: promo.promotion_Code,
          description: promo.promotion_Detail,
          discountType: promo.discount_Type.toLowerCase(),
          discountValue: promo.discount_Value, // Remove normalization
          startDate: promo.start_Date,
          endDate: promo.end_Date,
          image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
          applicableItems: [promo.applicable_For === "All" ? "ticket" : promo.applicable_For],
          isVIP: promo.applicable_For === "member",
          isPopular: false,
          categories: [promo.applicable_For === "member" ? "membership" : promo.applicable_For === "ticket" ? "seasonal" : "special"]
        }));
        setPromotions(mappedPromotions);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };
    fetchPromotions();
  }, []);

  // Filter promotions based on selected filter and search term
  const filteredPromotions = promotions.filter(promo => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'vip' && promo.isVIP) ||
      (filter === 'ticket' && promo.applicableItems.includes('ticket')) ||
      (filter === 'food' && promo.applicableItems.includes('concession')) ||
      (filter === 'membership' && promo.applicableItems.includes('membership')) ||
      (filter === 'popular' && promo.isPopular);
    
    const matchesSearch = 
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Open promotion details modal
  const openPromotionDetails = (promotion) => {
    setSelectedPromotion(promotion);
    setShowModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  // Check if promotion is still valid
  const isPromotionValid = (promotion) => {
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    return endDate >= now;
  };

  // Copy promotion code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Code ${code} copied to clipboard!`);
  };

  // Function to format discount value based on its magnitude
  const formatDiscount = (discountValue) => {
    if (discountValue > 100) {
      return `${discountValue} VND OFF`;
    } else {
      return `${discountValue}% OFF`;
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white py-8 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            Special Offers & Promotions
          </motion.h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover our latest deals and discounts to enhance your cinema experience. 
            From ticket discounts to concession deals, we've got something special for everyone.
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FaFilter />
                <span>Filters</span>
              </button>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Promotions</option>
                <option value="popular">Popular</option>
                <option value="vip">VIP Only</option>
                <option value="ticket">Tickets</option>
                <option value="food">Food & Drinks</option>
                <option value="membership">Membership</option>
              </select>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Categories</label>
                      <div className="flex flex-wrap gap-2">
                        {['seasonal', 'family', 'food', 'special', 'membership'].map(category => (
                          <button
                            key={category}
                            className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Discount Type</label>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors">
                          Percentage
                        </button>
                        <button className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors">
                          Fixed Amount
                        </button>
                        <button className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors">
                          Special Offers
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Validity</label>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors">
                          Current
                        </button>
                        <button className="px-3 py-1 text-sm rounded-full bg-gray-700 hover:bg-purple-600 transition-colors">
                          Upcoming
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Featured Promotion */}
        <motion.div 
          className="mb-12"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center mix-blend-overlay"></div>
            
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                <div className="inline-block px-3 py-1 mb-4 bg-purple-500 bg-opacity-30 border border-purple-400 rounded-full text-sm font-semibold">
                  Featured Offer
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{promotions[0]?.name || "Loading..."}</h2>
                <p className="text-lg text-gray-300 mb-6">
                  {promotions[0]?.description || "Loading description..."}
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center text-purple-300">
                    <FaCalendarAlt className="mr-2" />
                    <span>Valid until: {promotions[0] ? formatDate(promotions[0].endDate) : "Loading..."}</span>
                  </div>
                  <div className="flex items-center text-purple-300">
                    <FaTicketAlt className="mr-2" />
                    <span>Applies to: {promotions[0]?.applicableItems.join(', ') || "Loading..."}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => copyToClipboard(promotions[0]?.code || "")}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                  >
                    {promotions[0]?.code || "Loading..."}
                  </button>
                  <button 
                    onClick={() => openPromotionDetails(promotions[0] || {})}
                    className="px-6 py-3 bg-gray-800 bg-opacity-50 hover:bg-gray-700 border border-gray-600 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
              
              <div className="md:w-1/3 flex justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-purple-600 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 bg-purple-500 rounded-full opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="block text-6xl font-bold">
                        {promotions[0]?.discountValue || "0"}
                        {promotions[0]?.discountValue > 100 ? " " : "%"}
                      </span>
                      <span className="block text-xl font-medium">OFF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Promotions Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaPercent className="mr-2" />
            Available Promotions
          </h2>
          
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 bg-opacity-50 rounded-xl">
              <FaInfoCircle size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No promotions found</h3>
              <p className="text-gray-400">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map((promotion, index) => (
                <motion.div
                  key={promotion.id}
                  className={`bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${!isPromotionValid(promotion) ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={promotion.image} 
                      alt={promotion.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    
                    {promotion.isVIP && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500 text-black font-medium rounded-full text-xs flex items-center">
                        <FaStar className="mr-1" size={12} />
                        VIP Only
                      </div>
                    )}
                    
                    {promotion.isPopular && !promotion.isVIP && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-white font-medium rounded-full text-xs flex items-center">
                        <FaRegStar className="mr-1" size={12} />
                        Popular
                      </div>
                    )}
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold truncate">{promotion.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 h-10">
                      {promotion.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {promotion.applicableItems.includes('ticket') && (
                        <span className="px-2 py-1 bg-indigo-900 bg-opacity-50 border border-indigo-700 rounded-md text-xs flex items-center">
                          <FaTicketAlt className="mr-1" size={10} />
                          Tickets
                        </span>
                      )}
                      {promotion.applicableItems.includes('concession') && (
                        <span className="px-2 py-1 bg-amber-900 bg-opacity-50 border border-amber-700 rounded-md text-xs flex items-center">
                          <FaShoppingBasket className="mr-1" size={10} />
                          Food & Drinks
                        </span>
                      )}
                      {promotion.applicableItems.includes('membership') && (
                        <span className="px-2 py-1 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-md text-xs flex items-center">
                          <FaUsers className="mr-1" size={10} />
                          Membership
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-400 text-xs">
                        <FaCalendarAlt className="mr-1" />
                        <span>Valid until: {formatDate(promotion.endDate)}</span>
                      </div>
                      
                      {promotion.discountType === 'percentage' && (
                        <div className="px-2 py-1 bg-purple-900 bg-opacity-50 border border-purple-700 rounded-md text-sm font-medium">
                          {formatDiscount(promotion.discountValue)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => copyToClipboard(promotion.code)}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        {promotion.code}
                      </button>
                      <button 
                        onClick={() => openPromotionDetails(promotion)}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Promotion Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 bg-indigo-700 rounded-full flex items-center justify-center mb-4">
                <FaTicketAlt size={24} />
              </div>
              <h3 className="font-medium mb-2">Ticket Offers</h3>
              <p className="text-sm text-gray-300">Special discounts on movie tickets</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-amber-800 to-amber-900 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center mb-4">
                <FaShoppingBasket size={24} />
              </div>
              <h3 className="font-medium mb-2">Food & Drinks</h3>
              <p className="text-sm text-gray-300">Deals on popcorn, snacks and beverages</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 bg-purple-700 rounded-full flex items-center justify-center mb-4">
                <FaUsers size={24} />
              </div>
              <h3 className="font-medium mb-2">Membership</h3>
              <p className="text-sm text-gray-300">Exclusive benefits for members</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-pink-800 to-pink-900 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 bg-pink-700 rounded-full flex items-center justify-center mb-4">
                <FaStar size={24} />
              </div>
              <h3 className="font-medium mb-2">VIP Exclusives</h3>
              <p className="text-sm text-gray-300">Special offers for VIP members only</p>
            </motion.div>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="rounded-2xl overflow-hidden">
          <div className="relative p-8 md:p-12 bg-gradient-to-r from-indigo-900 to-purple-900">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Stay Updated</h2>
                <p className="text-gray-300">
                  Subscribe to our newsletter to receive the latest promotions and exclusive offers directly to your inbox.
                </p>
              </div>
              
              <div className="md:w-1/2 max-w-md">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-grow px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-r-lg font-medium transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Promotion Details Modal */}
      <AnimatePresence>
        {showModal && selectedPromotion && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={selectedPromotion.image} 
                  alt={selectedPromotion.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-75 transition-colors"
                >
                  ×
                </button>
                
                <div className="absolute bottom-6 left-6">
                  <h2 className="text-3xl font-bold mb-1">{selectedPromotion.name}</h2>
                  {selectedPromotion.isVIP && (
                    <div className="inline-block px-3 py-1 bg-yellow-500 text-black font-medium rounded-full text-xs flex items-center w-fit">
                      <FaStar className="mr-1" size={12} />
                      VIP Only
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-400">{selectedPromotion.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Promotion Code</h3>
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-2 bg-gray-700 rounded-lg font-mono text-lg">
                        {selectedPromotion.code}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedPromotion.code)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Validity Period</h3>
                    <div className="flex items-center text-gray-300">
                      <FaCalendarAlt className="mr-2" />
                      <span>{formatDate(selectedPromotion.startDate)} - {formatDate(selectedPromotion.endDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Promotion Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-900 bg-opacity-50 rounded-full flex items-center justify-center mr-3">
                        <FaPercent />
                      </div>
                      <div>
                        <h4 className="font-medium">Discount</h4>
                        <p className="text-sm text-gray-400">
                          {selectedPromotion.discountType === 'percentage' 
                            ? formatDiscount(selectedPromotion.discountValue)
                            : selectedPromotion.discountType === 'fixed' 
                            ? `${selectedPromotion.discountValue} VND off` 
                            : 'Special offer'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-900 bg-opacity-50 rounded-full flex items-center justify-center mr-3">
                        <FaTicketAlt />
                      </div>
                      <div>
                        <h4 className="font-medium">Applicable To</h4>
                        <p className="text-sm text-gray-400">
                          {selectedPromotion.applicableItems.join(', ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-900 bg-opacity-50 rounded-full flex items-center justify-center mr-3">
                        <FaInfoCircle />
                      </div>
                      <div>
                        <h4 className="font-medium">Terms & Conditions</h4>
                        <p className="text-sm text-gray-400">
                          This promotion cannot be combined with other offers. 
                          Management reserves the right to modify or cancel the promotion at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  
                  <button 
                    onClick={() => {
                      copyToClipboard(selectedPromotion.code);
                      setShowModal(false);
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                  >
                    Use Promotion
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserPromotionsPage;