"use client";
import { createContext, useContext, useRef, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [labelSearchTerm, setLabelSearchTerm] = useState("");
  const searchRef = useRef(null);
  const skipHashChangeRef = useRef(false);
  const [filters, setFilters] = useState({
    image: null,
    color: null,
    label: null,
    collab: null,
  });

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        labelSearchTerm,
        setLabelSearchTerm,
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
