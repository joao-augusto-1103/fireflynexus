import React from 'react';
import { User } from 'lucide-react';

const CustomerAvatar = ({ 
  customer, 
  size = 'sm', 
  className = '',
  showName = false,
  showPhone = false 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 flex-shrink-0`}>
        {customer?.foto ? (
          <img
            src={customer.foto}
            alt={customer.nome || 'Cliente'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center`}
          style={{ display: customer?.foto ? 'none' : 'flex' }}
        >
          <User className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
      
      {(showName || showPhone) && (
        <div className="flex flex-col min-w-0">
          {showName && customer?.nome && (
            <span className={`font-medium text-slate-900 dark:text-white truncate ${textSizes[size]}`}>
              {customer.nome}
            </span>
          )}
          {showPhone && customer?.telefone && (
            <span className={`text-slate-500 dark:text-slate-400 truncate ${textSizes[size === 'xs' ? 'xs' : 'sm']}`}>
              {customer.telefone}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerAvatar;
