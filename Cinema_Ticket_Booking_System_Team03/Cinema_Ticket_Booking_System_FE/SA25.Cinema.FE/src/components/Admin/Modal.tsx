import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#161D2F] border border-white/10 text-white rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto w-full max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
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
