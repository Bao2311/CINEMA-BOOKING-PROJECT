import React from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-2">
      <CheckCircle className="h-6 w-6" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-lg font-bold">&times;</button>
    </div>
  );
};

export default Notification;
