import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={!isLoading ? onCancel : undefined}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-100 mx-auto"
          >
            {/* Close Button */}
            <button 
              onClick={!isLoading ? onCancel : undefined}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2.5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              {/* Warning Icon with pulse effect */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, bounce: 0.5 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-60"></div>
                <div className="relative bg-gradient-to-br from-red-50 to-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center border-[6px] border-white shadow-lg">
                  <AlertTriangle className="w-10 h-10 drop-shadow-sm" />
                </div>
              </motion.div>

              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-base text-gray-500 mb-8 leading-relaxed px-2">
                {message}
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3.5 rounded-xl text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50 border border-gray-200/50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-[0_8px_20px_-6px_rgba(225,29,72,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 border border-red-500/20"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
