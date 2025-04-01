import React, { useState } from 'react';
import { Promotion } from '../../types';

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (promotion: Omit<Promotion, 'id'>) => void;
  onCancel: () => void;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ promotion, onSubmit, onCancel }) => {
  const [name, setName] = useState(promotion?.name || '');
  const [description, setDescription] = useState(promotion?.description || '');
  const [discountPercentage, setDiscountPercentage] = useState(promotion?.discountPercentage.toString() || '');
  const [startDate, setStartDate] = useState(promotion?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(promotion?.endDate || '');
  const [code, setCode] = useState(promotion?.code || '');
  const [isActive, setIsActive] = useState(promotion?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!discountPercentage.trim()) newErrors.discountPercentage = 'Discount percentage is required';
    if (isNaN(Number(discountPercentage))) newErrors.discountPercentage = 'Discount percentage must be a number';
    if (Number(discountPercentage) <= 0 || Number(discountPercentage) > 100) {
      newErrors.discountPercentage = 'Discount percentage must be between 1 and 100';
    }
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!code.trim()) newErrors.code = 'Promotion code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      name,
      description,
      discountPercentage: Number(discountPercentage),
      startDate,
      endDate,
      code,
      isActive,
      promotionId: promotion?.promotionId || 0,
      title: name,
      promotionCode: code,
      discountType: 'percentage',
      discountValue: Number(discountPercentage),
      minimumPurchase: 0,
      applicableFor: 'all',
      currentUsage: 0,
      status: 'Active',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Promotion Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">
          Discount Percentage
        </label>
        <input
          type="number"
          id="discountPercentage"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          min="1"
          max="100"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.discountPercentage ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.discountPercentage && <p className="mt-1 text-sm text-red-600">{errors.discountPercentage}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`