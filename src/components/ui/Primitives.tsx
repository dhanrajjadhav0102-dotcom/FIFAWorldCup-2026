import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const styles = {
    primary: 'bg-fifa-burgundy/20 text-fifa-burgundy-light border-fifa-burgundy/40',
    secondary: 'bg-fifa-gold/20 text-fifa-gold-light border-fifa-gold/40',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    danger: 'bg-red-500/20 text-red-400 border-red-500/40',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const styles = {
    primary: 'bg-fifa-burgundy text-white hover:bg-fifa-burgundy-light shadow-lg shadow-fifa-burgundy/20',
    secondary: 'bg-fifa-gold text-fifa-dark hover:bg-fifa-gold-light shadow-lg shadow-fifa-gold/20',
    outline: 'border border-fifa-gold/30 text-fifa-gold-light hover:bg-fifa-gold/10 hover:border-fifa-gold',
    danger: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800/50',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${styles[variant]} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-semibold uppercase tracking-wider text-fifa-gold-light"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-fifa-cardDark border border-gray-700/60 rounded-lg text-sm px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fifa-gold transition-colors duration-200 ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = true }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-5 border border-gray-800/40 relative overflow-hidden ${hoverEffect ? 'hover:border-fifa-gold/30 hover:shadow-xl hover:shadow-fifa-gold/5 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="glass-panel w-full max-w-lg rounded-xl shadow-2xl relative z-10 border border-gray-700/40 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800/60">
              <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white rounded-lg p-1.5 hover:bg-gray-800/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-300">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end space-x-3 p-4 bg-fifa-cardDark/50 border-t border-gray-800/60">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
