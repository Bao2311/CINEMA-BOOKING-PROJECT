import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import PromotionForm from '../components/Admin/PromotionForm';
import { Promotion } from '../types';
import { mockPromotions } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const isAdmin = isAuthenticated && user?.role === 'admin';
  
  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll use mock data
    const today = new Date();
    
    // For regular users, only show active promotions
    // For admins, show all promotions
    const filteredPromotions = isAdmin
      ? mockPromotions
      : mockPromotions.filter(
          promo => promo.isActive && new Date(promo.endDate) >= today
        );
    
    setPromotions(filteredPromotions);
    setIsLoading(false);
  }, [isAdmin]);

  const handleAddPromotion = (promotionData: Omit<Promotion, 'id'>) => {
    // In a real app, this would be an API call
    // For now, we'll simulate adding a promotion
    const newPromotion: Promotion = {
      id: `promo-${Date.now()}`,
      ...promotionData,
    };
    
    setPromotions([...promotions, newPromotion]);
    setIsAddingPromotion(false);
  };

  const handleUpdatePromotion = (promotionData: Omit<Promotion, 'id'>) => {
    // In a real app, this would be an API call
    // For now, we'll simulate updating a promotion
    if (!editingPromotion) return;
    
    const updatedPromotions = promotions.map(promotion => 
      promotion.id === editingPromotion.id ? { ...promotion, ...promotionData } : promotion
    );
    
    setPromotions(updatedPromotions);
    setEditingPromotion(null);
  };

  const handleDeletePromotion = (id: string) => {
    // In a real app, this would be an API call with confirmation
    // For now, we'll simulate deleting a promotion
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      setPromotions(promotions.filter(promotion => promotion.id !== id));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
          {isAdmin && (
            <button
              onClick={() => setIsAddingPromotion(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add Promotion
            </button>
          )}
        </div>
        
        {isAdmin && isAddingPromotion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Promotion</h2>
            <PromotionForm
              onSubmit={handleAddPromotion}
              onCancel={() => setIsAddingPromotion(false)}
            />
          </div>
        )}
        
        {isAdmin && editingPromotion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Promotion</h2>
            <PromotionForm
              promotion={editingPromotion}
              onSubmit={handleUpdatePromotion}
              onCancel={() => setEditingPromotion(null)}
            />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No promotions available at the moment.</p>
              </div>
            ) : (
              promotions.map(promotion => (
                <div
                  key={promotion.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                    promotion.isActive ? 'border-green-200' : 'border-gray-200'
                  } hover:shadow-lg transition-shadow`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{promotion.name}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                        promotion.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-lg font-semibold px-3 py-1 rounded">
                        {promotion.discountPercentage}% OFF
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{promotion.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>Valid from: {new Date(promotion.startDate).toLocaleDateString()}</span>
                      <span>Until: {new Date(promotion.endDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="font-medium">
                        Code: <span className="text-indigo-600">{promotion.code}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(promotion.code)}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Copy code"
                      >
                        {copiedCode === promotion.code ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    
                    {isAdmin && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingPromotion(promotion)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromotionsPage;