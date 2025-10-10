import * as React from 'react';

/**
 * Label component for form fields
 * Provides consistent styling for form labels
 */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`block text-sm font-medium mb-2 ${className || ''}`}
      {...props}
    />
  );
});

Label.displayName = 'Label';

export { Label };
