import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Tag, Percent, Calendar, ShoppingBag, Info,
  Search, Star, Check, Copy, Sparkles, Gift
} from "lucide-react";
import { Modal } from "antd";
import { toast } from "react-toastify";
import { API_URL } from '../config/apiUrl';

interface Promotion {
  promotion_ID: number;
  title?: string;
  promotion_Code: string;
  start_Date: string;
  end_Date: string;
  discount_Type: string;
  discount_Value: number;
  minimum_Purchase: number;
  maximum_Discount?: number;
  applicable_For?: string;
  promotion_Detail?: string;
  status: string;
}

const UserPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/Promotion`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const promoList = data?.$values || data || [];
        setPromotions(Array.isArray(promoList) ? promoList : []);
      } catch (err) {
        console.error("Error fetching promotions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã ${code}`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const filteredPromos = promotions.filter((p) => {
    if (filterType === "percentage" && p.discount_Type?.toLowerCase() !== "percentage") return false;
    if (filterType === "fixed" && p.discount_Type?.toLowerCase() === "percentage") return false;
    if (searchTerm) {
      const codeMatch = p.promotion_Code?.toLowerCase().includes(searchTerm.toLowerCase());
      const titleMatch = (p.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!codeMatch && !titleMatch) return false;
    }
    return true;
  });

  const featured = promotions[0];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Gift className="h-8 w-8 text-red-500" />
            Khuyến mãi & Ưu đãi
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tổng hợp các mã giảm giá và chương trình ưu đãi đặc quyền tại CinemaPlus
          </p>
        </div>

        {/* Featured Banner */}
        {featured && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/60 via-[#161D2F] to-indigo-950/60 border border-red-500/20 p-8 lg:p-10 mb-10 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  <Sparkles className="h-3.5 w-3.5" /> ƯU ĐÃI NỔI BẬT
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  {featured.title || 'Mã giảm giá chào mừng'}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-xl">
                  {featured.promotion_Detail || 'Nhận ngay ưu đãi hấp dẫn khi đặt vé xem phim tại CinemaPlus.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  {featured.end_Date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-red-400" />
                      <span>HSD: {format(parseISO(featured.end_Date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {featured.minimum_Purchase > 0 && (
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-blue-400" />
                      <span>Đơn tối thiểu: {featured.minimum_Purchase.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Code Box */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 bg-white/5 border border-white/10 p-6 rounded-2xl flex-shrink-0">
                <div className="text-center">
                  <span className="text-xs text-gray-400">Mã khuyến mãi</span>
                  <div className="text-2xl font-black text-amber-400 tracking-wider mt-0.5">
                    {featured.promotion_Code}
                  </div>
                </div>
                <button
                  onClick={() => copyCode(featured.promotion_Code)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/30"
                >
                  {copiedCode === featured.promotion_Code ? (
                    <>
                      <Check className="h-4 w-4" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Sao chép mã
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#161D2F] border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
                filterType === "all" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("percentage")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
                filterType === "percentage" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Giảm theo %
            </button>
            <button
              onClick={() => setFilterType("fixed")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
                filterType === "fixed" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Giảm số tiền
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã hoặc tên ưu đãi..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        {/* Promotions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#161D2F] border border-white/10 rounded-2xl p-6 h-56 animate-pulse" />
            ))}
          </div>
        ) : filteredPromos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromos.map((promo) => (
              <div
                key={promo.promotion_ID}
                className="bg-[#161D2F] border border-white/10 hover:border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                      {promo.discount_Type?.toLowerCase() === "percentage"
                        ? `GIẢM ${promo.discount_Value}%`
                        : `GIẢM ${promo.discount_Value?.toLocaleString('vi-VN')} Đ`}
                    </span>
                    <span className="text-xs text-gray-400">
                      {promo.status || "Active"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                    {promo.title || promo.promotion_Code}
                  </h3>

                  <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
                    {promo.promotion_Detail || 'Áp dụng cho mọi khách hàng khi thanh toán vé trực tuyến.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Đơn tối thiểu:</span>
                    <span className="text-white font-semibold">
                      {promo.minimum_Purchase?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-400 tracking-wider">
                      {promo.promotion_Code}
                    </div>
                    <button
                      onClick={() => copyCode(promo.promotion_Code)}
                      className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-md shadow-red-500/20"
                      title="Sao chép mã"
                    >
                      {copiedCode === promo.promotion_Code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedPromo(promo)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-all"
                      title="Chi tiết"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#161D2F] border border-white/10 rounded-2xl py-20 text-center">
            <Tag className="h-12 w-12 mx-auto text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-white">Không tìm thấy mã khuyến mãi</h3>
            <p className="text-gray-400 text-sm mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPromo && (
        <Modal
          title={<span className="text-white font-bold">{selectedPromo.title || selectedPromo.promotion_Code}</span>}
          open={!!selectedPromo}
          onCancel={() => setSelectedPromo(null)}
          footer={[
            <button
              key="copy"
              onClick={() => copyCode(selectedPromo.promotion_Code)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl"
            >
              Sao chép mã: {selectedPromo.promotion_Code}
            </button>,
          ]}
        >
          <div className="space-y-4 py-3 text-sm text-gray-300">
            <p>{selectedPromo.promotion_Detail}</p>
            <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Loại giảm giá:</span>
                <span className="font-semibold text-white">{selectedPromo.discount_Type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Giá trị giảm:</span>
                <span className="font-semibold text-amber-400">
                  {selectedPromo.discount_Type?.toLowerCase() === 'percentage'
                    ? `${selectedPromo.discount_Value}%`
                    : `${selectedPromo.discount_Value?.toLocaleString('vi-VN')} đ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Đơn hàng tối thiểu:</span>
                <span className="font-semibold text-white">
                  {selectedPromo.minimum_Purchase?.toLocaleString('vi-VN')} đ
                </span>
              </div>
              {selectedPromo.maximum_Discount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Giảm tối đa:</span>
                  <span className="font-semibold text-white">
                    {selectedPromo.maximum_Discount?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserPromotionsPage;
