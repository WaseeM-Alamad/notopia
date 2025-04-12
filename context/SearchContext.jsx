"use client";
import { createContext, useContext, useRef, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);
  const isTypingRef = useRef(null);
  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, searchRef, isTypingRef }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
