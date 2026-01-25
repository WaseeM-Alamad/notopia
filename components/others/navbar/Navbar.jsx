"use client";

import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import LogoSection from "./LogoSection";
import NavMidSection from "./NavMidSection";
import NavProfileSection from "./NavProfileSection";
import "@/assets/styles/navbar.css";

const Navbar = () => {
  const { currentSection, isFiltered } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const showShadow =
    isScrolled && ["Home", "Search"].includes(currentSection) && !isFiltered;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!currentSection) return;

  return (
    <nav
      className={`${showShadow ? "nav-shadow" : ""} ${currentSection?.toLowerCase() === "search" ? "search-page" : ""} ${isFiltered ? "search-filtered" : ""}`}
    >
      <LogoSection />
      <NavMidSection />
      <NavProfileSection />
    </nav>
  );
};

export default Navbar;
