import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Hapus Data",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onCancel : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all mx-4 scale-100 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={!isLoading ? onCancel : undefined}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Warning Icon with pulse effect */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
            {message}
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-transparent text-white font-bold bg-red-600 hover:bg-red-700 shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
