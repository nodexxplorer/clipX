// src/components/common/ErrorMessage.jsx
import { motion } from 'framer-motion';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiRefreshCw } from 'react-icons/fi';

const ErrorMessage = ({ 
  type = 'error', // 'error', 'warning', 'info'
  title,
  message = 'Something went wrong', 
  retry,
  retryText = 'Try Again',
  showIcon = true,
  fullPage = false,
  className = '',
}) => {
  const types = {
    error: {
      icon: FiAlertCircle,
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/20',
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/20',
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
    },
  };

  const config = types[type] || types.error;
  const Icon = config.icon;

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center max-w-md ${className}`}
        >
          <div className={`${config.bgColor} p-6 rounded-full w-24 h-24 mx-auto mb-6 
                         flex items-center justify-center`}>
            <Icon className={config.iconColor} size={48} />
          </div>
          
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          )}
          
          <p className="text-gray-400 mb-6">{message}</p>
          
          {retry && (
            <button 
              onClick={retry} 
              className="btn-primary inline-flex items-center gap-2"
            >
              <FiRefreshCw size={18} />
              {retryText}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-white mb-1">{title}</h4>
          )}
          <p className="text-gray-300 text-sm">{message}</p>
          
          {retry && (
            <button 
              onClick={retry} 
              className="mt-3 text-sm text-primary-500 hover:text-primary-400 
                       inline-flex items-center gap-1 font-medium"
            >
              <FiRefreshCw size={14} />
              {retryText}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Network Error Component
export const NetworkError = ({ retry }) => (
  <ErrorMessage
    type="error"
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection."
    retry={retry}
    fullPage
  />
);

// Not Found Error Component
export const NotFoundError = ({ type = 'page' }) => (
  <ErrorMessage
    type="warning"
    title="Not Found"
    message={`The ${type} you're looking for doesn't exist or has been removed.`}
    fullPage
  />
);

// Server Error Component
export const ServerError = ({ retry }) => (
  <ErrorMessage
    type="error"
    title="Server Error"
    message="We're experiencing technical difficulties. Please try again later."
    retry={retry}
    fullPage
  />
);

export default ErrorMessage;