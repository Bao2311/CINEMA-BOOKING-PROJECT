import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = '2xl', className = '' }) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const maxWidthClass = sizeClasses[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`bg-[#161D2F] border border-white/10 text-white rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto w-full ${maxWidthClass} ${className}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition z-10"
          aria-label="Đóng"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
