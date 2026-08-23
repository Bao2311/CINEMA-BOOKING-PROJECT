import React from 'react';
import { Check, X, Bell } from 'lucide-react';

// Component cho hiển thị thông báo
const AlertMessage: React.FC<{
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => {
  const bgColor =
    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
    type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-blue-50 border-blue-200 text-blue-800';

  const icon =
    type === 'success' ? <Check className="h-5 w-5" /> :
    type === 'error' ? <X className="h-5 w-5" /> :
    <Bell className="h-5 w-5" />;

  return (
    <div className={`${bgColor} border px-4 py-3 rounded-md mb-4 flex items-start justify-between`}>
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
