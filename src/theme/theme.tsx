import { createContext, ReactNode, useContext } from 'react';
import { clientTheme, proTheme, Theme } from './colors';

const ThemeContext = createContext<Theme>(clientTheme);

// The professional area (src/app/pro) wraps its screens in <ThemeProvider pro>
export function ThemeProvider({ pro = false, children }: { pro?: boolean; children: ReactNode }) {
  return (
    <ThemeContext.Provider value={pro ? proTheme : clientTheme}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
