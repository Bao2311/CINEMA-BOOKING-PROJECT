import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isWithinInterval, parseISO } from "date-fns";
import {
  FaTicketAlt,
  FaPercent,
  FaCalendarAlt,
  FaShoppingBasket,
  FaUsers,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaStar,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

const UserPromotionsPage = () => {
  const [allPromotions, setAllPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch("https://localhost:7168/api/Promotion"); // Thay URL API nếu cần
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data || !data.$values) {
          throw new Error("Invalid API response structure");
        }

        const now = new Date();
        const validPromotions = data.$values
          .map((promo) => {
            if (
              !promo ||
              !promo.promotion_ID ||
              !promo.start_Date ||
              !promo.end_Date
            ) {
              console.warn("Skipping invalid promo data:", promo);
              return null;
            }

            const startDate = parseISO(promo.start_Date);
            const endDate = parseISO(promo.end_Date);
            const isActiveStatus = promo.status
              ? promo.status.toLowerCase() === "active"
              : false;

            const isActiveAndValid =
              promo.is_Active === true &&
              isActiveStatus &&
              promo.is_Expired === false &&
              isWithinInterval(now, { start: startDate, end: endDate }) &&
              (promo.usage_Limit === 0 ||
                promo.current_Usage < promo.usage_Limit);

            if (!isActiveAndValid) {
              return null;
            }

            let applicableItemsList = ["other"];
            if (promo.applicable_For) {
              applicableItemsList = promo.applicable_For
                .toLowerCase()
                .split(",")
                .map((s) => s.trim());
            }

            return {
              id: promo.promotion_ID,
              name: promo.title || "Untitled Promotion",
              code: promo.promotion_Code || "NOCODE",
              description:
                promo.promotion_Detail || "Enjoy this special offer!",
              discountType: promo.discount_Type
                ? promo.discount_Type.toLowerCase()
                : "unknown",
              discountValue: promo.discount_Value || 0,
              startDate: promo.start_Date,
              endDate: promo.end_Date,
              image:
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", // Placeholder image
              applicableItems: applicableItemsList,
              minimumPurchase: promo.minimum_Purchase || 0,
              maximumDiscount: promo.maximum_Discount || 0,
              usageLimit: promo.usage_Limit || 0,
              currentUsage: promo.current_Usage || 0,
              isVIP: applicableItemsList.includes("member"),
            };
          })
          .filter((promo) => promo !== null);

        setAllPromotions(validPromotions);
        setFilteredPromotions(validPromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        setFetchError(
          error.message || "Failed to fetch promotions. Please try again later."
        );
        setAllPromotions([]);
        setFilteredPromotions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = allPromotions.filter((promo) => {
      const matchesSearch =
        promo.name.toLowerCase().includes(lowerSearchTerm) ||
        promo.description.toLowerCase().includes(lowerSearchTerm) ||
        promo.code.toLowerCase().includes(lowerSearchTerm);

      const matchesFilter =
        filter === "all" ||
        (filter === "membership" && promo.isVIP) ||
        (filter === "ticket" && promo.applicableItems.includes("ticket"));

      return matchesSearch && matchesFilter;
    });
    setFilteredPromotions(results);
  }, [searchTerm, filter, allPromotions]);

  const openPromotionDetails = (promotion) => {
    setSelectedPromotion(promotion);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert(`Code "${code}" copied to clipboard!`);
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
        alert("Failed to copy code. Please try manually.");
      });
  };

  const formatDiscount = (type, value, maxValue = 0) => {
    const typeLower = type ? type.toLowerCase() : "unknown";
    const numericValue = Number(value);

    if (isNaN(numericValue)) {
      return "Invalid Discount";
    }

    if (typeLower === "percentage") {
      let text = `${numericValue}% OFF`;
      if (maxValue > 0) {
        text += ` (Tối đa ${maxValue.toLocaleString("vi-VN")} VND)`;
      }
      return text;
    } else if (typeLower === "fixed") {
      return `${numericValue.toLocaleString("vi-VN")} VND OFF`;
    }
    return "Special Offer";
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white flex flex-col items-center justify-center p-8">
        <FaSpinner className="animate-spin text-4xl mb-4" />
        <p className="text-xl">Loading Promotions...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white flex flex-col items-center justify-center p-8 text-center">
        <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Promotions</h2>
        <p className="text-gray-300 mb-4">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const featuredPromo =
    filteredPromotions.length > 0
      ? filteredPromotions[0]
      : allPromotions.length > 0
      ? allPromotions[0]
      : null;

  const UsageProgressBar = ({ current, limit }) => {
    if (limit <= 0) return null;

    const percentage = Math.min((current / limit) * 100, 100);

    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Đã dùng:</span>
          <span>{`${current} / ${limit}`}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
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
            Discover our latest deals and discounts to enhance your cinema
            experience. Find the best offers available now!
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Tìm kiếm khuyến mãi (tên, mã, mô tả)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label htmlFor="promo-filter" className="sr-only">
                Filter by type
              </label>
              <select
                id="promo-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả khuyến mãi</option>
                <option value="ticket">Vé xem phim</option>
                <option value="membership">Thành viên</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Promotion */}
        {featuredPromo && (
          <motion.div
            className="mb-12"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-90"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center">
                <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8 text-center md:text-left">
                  <div className="inline-block px-3 py-1 mb-4 bg-purple-500 bg-opacity-30 border border-purple-400 rounded-full text-sm font-semibold">
                    Ưu đãi nổi bật
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {featuredPromo.name}
                  </h2>
                  <p className="text-lg text-gray-300 mb-6 line-clamp-3">
                    {featuredPromo.description}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6 text-sm">
                    <div className="flex items-center text-purple-300">
                      <FaCalendarAlt className="mr-2" />
                      <span>
                        Hiệu lực đến: {formatDate(featuredPromo.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-purple-300">
                      <FaTicketAlt className="mr-2" />
                      <span>
                        Áp dụng cho:{" "}
                        {featuredPromo.applicableItems
                          .map(
                            (item) =>
                              item.charAt(0).toUpperCase() + item.slice(1)
                          )
                          .join(", ")}
                      </span>
                    </div>
                    {featuredPromo.minimumPurchase > 0 && (
                      <div className="flex items-center text-purple-300">
                        <FaShoppingBasket className="mr-2" />
                        <span>
                          Đơn tối thiểu:{" "}
                          {featuredPromo.minimumPurchase.toLocaleString(
                            "vi-VN"
                          )}{" "}
                          VND
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <button
                      onClick={() => copyToClipboard(featuredPromo.code)}
                      title="Copy Mã Khuyến Mãi"
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <span>{featuredPromo.code}</span> (Copy)
                    </button>
                    <button
                      onClick={() => openPromotionDetails(featuredPromo)}
                      className="px-6 py-3 bg-gray-800 bg-opacity-50 hover:bg-gray-700 border border-gray-600 rounded-lg font-medium transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
                <div className="md:w-1/3 flex justify-center mt-8 md:mt-0">
                  <div className="relative w-48 h-48 md:w-64 md:h-64">
                    <div className="absolute inset-0 bg-purple-600 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute inset-4 bg-purple-500 rounded-full opacity-40"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {featuredPromo.discountType === "percentage" ? (
                          <>
                            <span className="block text-5xl md:text-6xl font-bold">
                              {featuredPromo.discountValue}%
                            </span>
                            <span className="block text-lg md:text-xl font-medium">
                              OFF
                            </span>
                            {featuredPromo.maximumDiscount > 0 && (
                              <span className="block text-xs md:text-sm text-purple-300 mt-1">
                                (Tối đa{" "}
                                {featuredPromo.maximumDiscount.toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                VND)
                              </span>
                            )}
                          </>
                        ) : featuredPromo.discountType === "fixed" ? (
                          <>
                            <span className="block text-3xl md:text-4xl font-bold">
                              {featuredPromo.discountValue.toLocaleString(
                                "vi-VN"
                              )}
                            </span>
                            <span className="block text-lg md:text-xl font-medium">
                              VND OFF
                            </span>
                          </>
                        ) : (
                          <span className="block text-3xl md:text-4xl font-bold">
                            Offer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Promotions Grid */}
        {/* Added pb-12 padding-bottom here since the category section below was removed */}
        <div className="pb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaPercent className="mr-3 text-purple-400" />
            Khuyến Mãi Hiện Có
          </h2>
          {filteredPromotions.length === 0 && !isLoading ? (
            <div className="text-center py-12 bg-gray-800 bg-opacity-50 rounded-xl">
              <FaInfoCircle size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                Không tìm thấy khuyến mãi phù hợp
              </h3>
              <p className="text-gray-400">
                Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map((promotion, index) => (
                <motion.div
                  key={promotion.id}
                  className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.4 }}
                  whileHover={{
                    y: -5,
                    boxShadow:
                      "0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.1)",
                  }}
                >
                  <div className="relative h-48 overflow-hidden group">
                    <img
                      src={promotion.image}
                      alt={promotion.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
                    {promotion.isVIP && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-black font-bold rounded-full text-xs flex items-center shadow-md">
                        <FaStar className="mr-1" size={12} />
                        Membership
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-purple-600 text-white font-bold rounded-md text-sm shadow-md">
                      {formatDiscount(
                        promotion.discountType,
                        promotion.discountValue,
                        promotion.maximumDiscount
                      )}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3
                      className="text-xl font-bold mb-2 truncate"
                      title={promotion.name}
                    >
                      {promotion.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 h-10 flex-grow">
                      {promotion.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                      {promotion.applicableItems.map((item) => (
                        <span
                          key={item}
                          className={`px-2 py-1 rounded-md flex items-center border ${
                            item === "ticket"
                              ? "bg-indigo-900 bg-opacity-50 border-indigo-700"
                              : item === "membership"
                              ? "bg-blue-900 bg-opacity-50 border-blue-700"
                              : "bg-gray-700 bg-opacity-50 border-gray-600"
                          }`}
                        >
                          {item === "ticket" && (
                            <FaTicketAlt className="mr-1" size={10} />
                          )}
                          {item === "membership" && (
                            <FaUsers className="mr-1" size={10} />
                          )}
                          {item !== "ticket" && item !== "membership" && (
                            <FaShoppingBasket className="mr-1" size={10} />
                          )}
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-3 mb-4">
                         <div className="text-xs text-gray-400 flex items-center">
                             <FaCalendarAlt className="mr-2 flex-shrink-0" />
                             <span>
                                 Hiệu lực: {formatDate(promotion.startDate)} -{" "}
                                 {formatDate(promotion.endDate)}
                             </span>
                         </div>
                         {promotion.minimumPurchase > 0 && (
                             <div className="text-xs text-gray-400 flex items-center">
                                 <FaShoppingBasket className="mr-2 flex-shrink-0" />
                                 <span>
                                     Đơn tối thiểu:{" "}
                                     {promotion.minimumPurchase.toLocaleString("vi-VN")}{" "}
                                     VND
                                 </span>
                             </div>
                         )}
                         {promotion.usageLimit > 0 && (
                             <UsageProgressBar current={promotion.currentUsage} limit={promotion.usageLimit} />
                         )}
                    </div>
                    <div className="mt-auto flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => copyToClipboard(promotion.code)}
                        title={`Copy code: ${promotion.code}`}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors truncate"
                      >
                        Mã: {promotion.code}
                      </button>
                      <button
                        onClick={() => openPromotionDetails(promotion)}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Promotion Categories Section REMOVED */}

      </div>

      {/* Promotion Details Modal */}
      <AnimatePresence>
        {showModal && selectedPromotion && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-80 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                  className="absolute top-4 right-4 w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold mb-2 text-shadow-lg">
                    {selectedPromotion.name}
                  </h2>
                  {selectedPromotion.isVIP && (
                    <div className="inline-block px-3 py-1 bg-yellow-500 text-black font-bold rounded-full text-xs flex items-center w-fit shadow-md">
                      <FaStar className="mr-1" size={12} />
                      Membership Exclusive
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-purple-300 mb-2">
                    Mô tả chi tiết
                  </h3>
                  <p className="text-gray-300">
                    {selectedPromotion.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Mã Khuyến Mãi
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-2 bg-gray-700 rounded-lg font-mono text-lg text-purple-300 break-all">
                        {selectedPromotion.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedPromotion.code)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Thời gian hiệu lực
                    </h3>
                    <div className="flex items-center text-gray-300 text-lg">
                      <FaCalendarAlt className="mr-2 text-purple-300" />
                      <span>
                        {formatDate(selectedPromotion.startDate)} -{" "}
                        {formatDate(selectedPromotion.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-purple-300 mb-3">
                    Chi tiết ưu đãi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-purple-900 bg-opacity-70 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <FaPercent />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">
                          Mức giảm giá
                        </h4>
                        <p className="text-sm text-gray-400">
                          {formatDiscount(
                            selectedPromotion.discountType,
                            selectedPromotion.discountValue,
                            selectedPromotion.maximumDiscount
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-indigo-900 bg-opacity-70 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <FaTicketAlt />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">
                          Áp dụng cho
                        </h4>
                        <p className="text-sm text-gray-400">
                          {selectedPromotion.applicableItems
                            .map(
                              (item) =>
                                item.charAt(0).toUpperCase() + item.slice(1)
                            )
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    {selectedPromotion.minimumPurchase > 0 && (
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-amber-900 bg-opacity-70 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <FaShoppingBasket />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-200">
                            Điều kiện đơn hàng
                          </h4>
                          <p className="text-sm text-gray-400">
                            Giá trị tối thiểu:{" "}
                            {selectedPromotion.minimumPurchase.toLocaleString(
                              "vi-VN"
                            )}{" "}
                            VND
                          </p>
                        </div>
                      </div>
                    )}
                     {selectedPromotion.usageLimit > 0 && (
                       <div className="flex items-start">
                         <div className="w-10 h-10 bg-teal-900 bg-opacity-70 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                             <FaUsers />
                         </div>
                         <div className="flex-grow">
                             <h4 className="font-medium text-gray-200 mb-1">
                                 Giới hạn sử dụng
                             </h4>
                             <UsageProgressBar current={selectedPromotion.currentUsage} limit={selectedPromotion.usageLimit} />
                         </div>
                       </div>
                     )}
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-blue-900 bg-opacity-70 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <FaInfoCircle />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">
                          Điều khoản & Điều kiện
                        </h4>
                        <p className="text-sm text-gray-400">
                          {selectedPromotion.description ||
                            "Không áp dụng đồng thời với các khuyến mãi khác. Ban quản lý có quyền thay đổi hoặc hủy bỏ chương trình mà không cần báo trước."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors order-2 sm:order-1"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      copyToClipboard(selectedPromotion.code);
                      setShowModal(false);
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors order-1 sm:order-2"
                  >
                    Copy mã & Đóng
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