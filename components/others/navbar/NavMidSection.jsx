import LeftArrow from "@/components/icons/LeftArrow";
import Button from "@/components/Tools/Button";
import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import NavButtons from "./NavButtons";
import InputSearchIcon from "@/components/icons/InputSearchIcon";
import InputLeftArrow from "@/components/icons/InputLeftArrow";
import { useLabelsContext } from "@/context/LabelsContext";

const NavMidSection = () => {
  const { showTooltip, hideTooltip, currentSection, labelsReady } =
    useAppContext();
  const {
    searchRef,
    labelSearchTerm,
    setSearchTerm,
    setLabelSearchTerm,
    filters: searchFilters,
    skipHashChangeRef,
  } = useSearch();

  const { labelsRef } = useLabelsContext();

  const [inputPlaceHolder, setInputPlaceHolder] = useState("Search notes");

  const isSearchPage = currentSection.toLowerCase() === "search";
  const isLabelSearch =
    currentSection?.toLowerCase() === "labels" && labelSearchTerm.trim();

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "");
      const decodedHash = doubleDecode(hash.replace("search/", ""));

      if (hash.toLowerCase().startsWith("note/")) return;

      if (hash.startsWith("search/")) {
        const filters = decodedHash.split("&");

        filters.forEach((filter, index) => {
          if (index > 1) {
            return;
          }
          if (filter.startsWith("text")) {
            return;
          }
          const decodedFilter = decodeURIComponent(filter);
          const parts = decodedFilter.split(/=(.+)/);
          const type = parts[0];
          const within = parts[1];
          if (type === "color") {
            setInputPlaceHolder(
              `Search within "${
                within.charAt(0).toUpperCase() + within.slice(1)
              }"`,
            );
          } else if (type === "label") {
            if (!labelsReady || !searchFilters.label) return;
            const labelUUID = searchFilters.label;
            const label = labelsRef.current.get(labelUUID).label;
            setInputPlaceHolder('Search within "' + label + `"`);
          } else if (type === "image") {
            setInputPlaceHolder(`Search within "Images"`);
          } else if (type === "collab") {
            const ph = searchFilters?.collab
              ? `Search within "${searchFilters?.collab}"`
              : "Search";
            setInputPlaceHolder(ph);
          }
        });
      } else if (currentSection?.toLowerCase() === "labels") {
        setInputPlaceHolder("Search labels");
      } else {
        setInputPlaceHolder("Search notes");
      }
    };

    handler();

    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, [labelsReady, searchFilters, currentSection]);

  const inputClick = () => {
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash.startsWith("search") || currentHash === "labels") {
      return;
    }
    const hash = "search";
    const event = new CustomEvent("sectionChange", {
      detail: { hash },
    });
    window.dispatchEvent(event);
  };

  const handleClearSearch = () => {
    const hash = window.location.hash.replace("#", "");

    if (hash.startsWith("search/")) {
      window.location.hash = "search";
    } else {
      window.location.hash = "home";
    }
  };

  const debouncedHandleInputOnChange = useMemo(
    () =>
      debounce((e) => {
        const hash = window.location.hash.replace("#", "");
        if (hash === "labels") {
          setLabelSearchTerm(e.target.value.trim());
        } else {
          skipHashChangeRef.current = true;
          setSearchTerm(e.target.value.trim());
        }
      }, 300),
    [],
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flex: "1 1 100%",
        verticalAlign: "middle",
        justifyContent: "flex-end",
        whiteSpace: "nowrap",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          width: "100%",
          boxSizing: "border-box",
          padding: "0 0.625rem",
          height: "75%",
        }}
      >
        <div
          className="search-wrapper"
          onBlur={(e) => {
            const width = window.innerWidth;
            if (width >= 795) return;
            const element = e.currentTarget;
            const nextFocused = e.relatedTarget;

            if (!element.contains(nextFocused)) {
              // setShowInput(false);
            }
          }}
        >
          <div style={{ padding: "0 0.5rem", paddingRight: "0.3rem" }}>
            <Button
              onClick={() => {
                if (isLabelSearch) {
                  setLabelSearchTerm("");
                  searchRef.current.value = "";
                  return;
                }
                if (isSearchPage) {
                  handleClearSearch();
                } else {
                  inputClick();
                }
              }}
              onMouseEnter={(e) =>
                showTooltip(e, isSearchPage ? "Back" : "Search")
              }
              onMouseLeave={hideTooltip}
              tabIndex="-1"
              className="nav-btn nav-search-icon"
            >
              {isSearchPage || isLabelSearch ? (
                <InputLeftArrow />
              ) : (
                <InputSearchIcon />
              )}
            </Button>
          </div>
          <input
            onClick={inputClick}
            ref={searchRef}
            dir="auto"
            onChange={debouncedHandleInputOnChange}
            className="search"
            placeholder={inputPlaceHolder}
            spellCheck="false"
          />

          <div
            style={{
              padding: "0 0.5rem",
              display: currentSection?.toLowerCase() !== "labels" && "none",
            }}
          ></div>
          <div className="inside-nav-btns">
            <NavButtons />
          </div>
        </div>
      </div>
      <div className="outside-nav-btns">
        <NavButtons />
      </div>
    </div>
  );
};

export default NavMidSection;
