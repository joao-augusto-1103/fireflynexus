import React from 'react';

const HamburgerMenuIcon = ({ className = "h-5 w-5", ...props }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      {/* Linha 1 com ponto */}
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <line x1="7" y1="6" x2="20" y2="6" />
      
      {/* Linha 2 com ponto */}
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <line x1="7" y1="12" x2="20" y2="12" />
      
      {/* Linha 3 com ponto */}
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
      <line x1="7" y1="18" x2="20" y2="18" />
    </svg>
  );
};

export default HamburgerMenuIcon;
