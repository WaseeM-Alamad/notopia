"use client";
import { createContext, useContext, useRef, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);
  const skipHashChangeRef = useRef(null);
  const [filters, setFilters] = useState({
    color: null,
    label: null,
  });

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        searchRef,
        skipHashChangeRef,
        filters,
        setFilters,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
