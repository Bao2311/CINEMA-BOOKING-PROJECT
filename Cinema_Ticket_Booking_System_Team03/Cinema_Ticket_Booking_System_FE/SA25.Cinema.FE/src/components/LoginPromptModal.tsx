import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  message = "Bạn cần đăng nhập để thực hiện thao tác này.",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate("/login", { state: { from: location } });
  };

  const handleRegister = () => {
    onClose();
    navigate("/register", { state: { from: location } });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "linear-gradient(145deg, #1a2235, #0f1623)",
            border: "1px solid rgba(229,9,20,0.3)",
            borderRadius: "20px",
            padding: "2.5rem 2rem",
            width: "100%",
            maxWidth: "420px",
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E50914, #b00710)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              boxShadow: "0 8px 24px rgba(229,9,20,0.4)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {/* Title */}
          <h2
            id="login-prompt-title"
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 0.5rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Đăng nhập để tiếp tục
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize: "0.925rem",
              color: "#9CA3AF",
              margin: "0 0 1.75rem",
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)",
              marginBottom: "1.75rem",
            }}
          />

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "0.85rem 1.5rem",
                background: "linear-gradient(135deg, #E50914, #b00710)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 16px rgba(229,9,20,0.35)",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 24px rgba(229,9,20,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 16px rgba(229,9,20,0.35)";
              }}
            >
              🔐 Đăng nhập ngay
            </button>

            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                padding: "0.85rem 1.5rem",
                background: "rgba(255,255,255,0.05)",
                color: "#e5e7eb",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.12)";
              }}
            >
              ✨ Tạo tài khoản mới
            </button>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.7rem 1.5rem",
                background: "transparent",
                color: "#6B7280",
                border: "none",
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontWeight: 400,
                cursor: "pointer",
                transition: "color 0.2s ease",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
              }}
            >
              Tiếp tục xem không cần đăng nhập
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default LoginPromptModal;
