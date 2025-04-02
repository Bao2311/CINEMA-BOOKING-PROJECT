import React from 'react';
import { Bell, Loader2, Gift, Settings, Ticket } from 'lucide-react';
import { Notification } from '../../interfaces/ProfileInterfaces';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationsTabProps {
  notifications: Notification[];
  isLoading: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  isLoading,
  setNotifications
}) => {
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return dateString;
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500">Đang tải thông báo...</p>
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Bạn không có thông báo nào.</p>
          </div>
        )}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${notification.isRead ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div
                    className={`flex-shrink-0 rounded-full p-1.5 mr-3 ${
                      notification.type === 'promo' ? 'bg-green-100 text-green-600' :
                      notification.type === 'system' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {notification.type === 'promo' ? <Gift className="h-5 w-5" /> :
                    notification.type === 'system' ? <Settings className="h-5 w-5" /> :
                    <Ticket className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`font-medium text-sm ${notification.isRead ? 'text-gray-800' : 'text-indigo-900'}`}>
                        {notification.title}
                      </h4>
                      <span className={`text-xs flex-shrink-0 ${notification.isRead ? 'text-gray-500' : 'text-indigo-700'}`}>
                        {formatDateTime(notification.date)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-indigo-800'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="ml-2 flex-shrink-0 mt-1">
                      <span className="h-2 w-2 bg-indigo-500 rounded-full inline-block"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;