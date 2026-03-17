import { useLocation } from "@tanstack/react-router";
import React, { useRef, useContext, useEffect } from "react";

type FileMap = Map<string, File>;

interface FileContextType {
  fileMapRef: React.MutableRefObject<FileMap>;
  signalRefClear: number;
  clearFileMap: () => void;
}

const FileContext = React.createContext<FileContextType | null>(null);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const fileMapRef = useRef<FileMap>(new Map());
  const [signalRefClear, setSignalRefClear] = React.useState(0);
  const pathname = useLocation();

  const clearFileMap = () => {
    fileMapRef?.current.clear();
    setSignalRefClear((prev) => prev + 1);
  }

  useEffect(() => {
    clearFileMap();
  }, [pathname]);

  return (
    <FileContext.Provider value={{ fileMapRef, signalRefClear, clearFileMap }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileMap = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFileMap must be used within FileProvider");
  return context;
};
