import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() 
{
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) 
{
    const [dark, setDark] = useState(false);

    return (
        <ThemeContext.Provider value={{ dark, setDark }}>
        {children}
        </ThemeContext.Provider>
    );
}
