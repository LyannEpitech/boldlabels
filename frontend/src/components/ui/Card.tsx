import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'sm',
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-surface rounded-lg border border-border transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };
  
  const hoverClasses = hover
    ? 'hover:shadow-md hover:border-border-hover cursor-pointer'
    : '';
  
  const classes = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    hoverClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = '', ...props 
}) => (
  <div className={`flex flex-col space-y-1.5 p-5 ${className}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className = '', ...props 
}) => (
  <h3 className={`text-base font-semibold leading-none tracking-tight text-text-primary ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = '', ...props 
}) => (
  <div className={`p-5 pt-0 ${className}`} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = '', ...props 
}) => (
  <div className={`flex items-center p-5 pt-0 ${className}`} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className = '', ...props 
}) => (
  <p className={`text-sm text-text-muted ${className}`} {...props} />
);

export default Card;
