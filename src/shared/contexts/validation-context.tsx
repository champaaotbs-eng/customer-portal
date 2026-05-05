import React, { createContext, useContext } from "react";

type ValidatorFn = () => boolean;

interface ValidationContextType {
  registerValidator: (fn: ValidatorFn) => () => void;
  validateAll: () => boolean;
}

const ValidationContext = createContext<ValidationContextType | null>(null);

export const ValidationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const validators = React.useRef<Set<ValidatorFn>>(new Set());

  const registerValidator = (fn: ValidatorFn) => {
    validators.current.add(fn);
    return () => validators.current.delete(fn);
  };

  const validateAll = () => {
    let allValid = true;
    for (const fn of validators.current) {
      const isValid = fn();
      if (!isValid) allValid = false;
    }
    return allValid;
  };

  return (
    <ValidationContext.Provider value={{ registerValidator, validateAll }}>
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidationContext = () => {
  const ctx = useContext(ValidationContext);
  if (!ctx)
    throw new Error(
      "useValidationContext must be used within ValidationProvider"
    );
  return ctx;
};
