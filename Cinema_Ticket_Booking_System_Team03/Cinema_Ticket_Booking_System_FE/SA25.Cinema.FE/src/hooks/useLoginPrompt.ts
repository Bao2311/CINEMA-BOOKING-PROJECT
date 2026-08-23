import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook tiện ích để hiển thị modal nhắc đăng nhập khi người dùng chưa xác thực.
 *
 * Cách dùng:
 *   const { requireAuth, LoginModal } = useLoginPrompt();
 *
 *   // Bao render modal ở đầu JSX:
 *   <>{LoginModal}</>
 *
 *   // Khi cần bảo vệ 1 action:
 *   const handleBooking = requireAuth(() => { ... }, "Bạn cần đăng nhập để đặt vé.");
 */
export function useLoginPrompt() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  /**
   * Bọc một callback: nếu đã đăng nhập thì chạy callback ngay,
   * nếu chưa thì hiện modal nhắc đăng nhập.
   */
  const requireAuth = useCallback(
    (callback: () => void, customMessage?: string) => {
      return () => {
        if (isAuthenticated) {
          callback();
        } else {
          setMessage(customMessage);
          setPendingCallback(() => callback);
          setIsOpen(true);
        }
      };
    },
    [isAuthenticated]
  );

  /**
   * Mở modal nhắc trực tiếp (không kèm callback).
   */
  const promptLogin = useCallback((customMessage?: string) => {
    if (!isAuthenticated) {
      setMessage(customMessage);
      setIsOpen(true);
    }
  }, [isAuthenticated]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingCallback(null);
  }, []);

  return {
    /** Gọi requireAuth(fn, message) để bảo vệ 1 action */
    requireAuth,
    /** Gọi promptLogin(message) để mở modal trực tiếp */
    promptLogin,
    /** Props dùng cho <LoginPromptModal> */
    loginModalProps: {
      isOpen,
      onClose: handleClose,
      message,
    },
    isAuthenticated,
  };
}
