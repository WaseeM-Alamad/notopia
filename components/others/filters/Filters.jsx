import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";
import { useSearch } from "@/context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, memo, useEffect, useRef, useState } from "react";
import LabelFilterItem from "./LabelFilterItem";
import TypeFilterItem from "./TypeFilterItem";
import ColorFilterItem from "./ColorFilterItem";
import CollabFilterItem from "./CollabFilterItem";

const Filters = ({
  noMatchingNotes,
  filtersExist,
  notesReady,
  order,
  notes,
}) => {
  const { user } = useAppContext();
  const { setSearchTerm, searchRef, setFilters, skipHashChangeRef } =
    useSearch();
  const { labelsRef } = useLabelsContext();

  const userID = user?.id;

  const [colorsSet, setColorsSet] = useState(new Set());
  const [labelsSet, setLabelsSet] = useState(new Set());
  const [typesSet, setTypesSet] = useState(new Set());
  const [peopleMap, setPeopleMap] = useState(new Set());

  const firstRun = useRef(true);

  let renderedIndex = -1;

  const getFilters = () => {
    const colors = new Set();
    const labels = new Set();
    const types = new Set();
    const people = new Map();
    order.forEach((order) => {
      const note = notes.get(order);
      if (!note || note?.isTrash) return;
      note?.color && colors.add(note?.color);
      note?.labels.forEach((labelUUID) => labels.add(labelUUID));
      note?.images.length > 0 && types.add("Images");
      note?.collaborators.forEach((collab) => {
        const displayName =
          collab?.data?.displayName || collab?.snapshot?.displayName;
        const image = collab?.data?.image || collab?.snapshot?.image;
        const username = collab?.data?.username || collab?.snapshot?.username;
        if (collab.id === userID) return;
        people.set(displayName, {
          username: username,
          displayName: displayName,
          image: image,
        });
      });

      const creator = note?.creator;
      const isCreator = note?.creator?._id === userID;
      if (!isCreator) {
        const creatorObject = {
          username: creator?.username,
          displayName: creator?.displayName,
          image: creator?.image,
        };
        people.set(creator?.displayName, creatorObject);
      }
    });
    setColorsSet(colors);
    setLabelsSet(labels);
    setTypesSet(types);
    setPeopleMap(people);
  };

  useEffect(() => {
    getFilters();
  }, [notesReady]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (noMatchingNotes && filtersExist) {
      getFilters();
    }
  }, [noMatchingNotes]);

  const resetText = () => {
    setSearchTerm("");
    searchRef.current.value = "";
  };

  const typeClick = (type) => {
    const title = type.toLowerCase().slice(0, type.length - 1);
    window.location.hash = `search/${title}`;
    setFilters((prev) => ({ ...prev, image: true }));
  };

  const colorClick = (color) => {
    skipHashChangeRef.current = true;
    const encodedColor =
      "color" + doubleEncode("=") + tripleEncode(color.toLowerCase());
    window.location.hash = `search/${encodedColor}`;
    setFilters((prev) => ({ ...prev, color: color }));
  };

  const labelClick = (labelUUID) => {
    skipHashChangeRef.current = true;
    const label = labelsRef.current.get(labelUUID).label;
    const encodedLabel = "label" + doubleEncode("=") + tripleEncode(label);
    window.location.hash = `search/${encodedLabel}`;
    setFilters((prev) => ({ ...prev, label: labelUUID }));
  };

  const peopleClick = (username) => {
    skipHashChangeRef.current = true;
    const encodedUsername =
      "collab" + doubleEncode("=") + tripleEncode(username);
    window.location.hash = `search/${encodedUsername}`;
    setFilters((prev) => ({ ...prev, collab: username }));
  };

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const filtersToRender = [
    { title: "Types", function: typeClick, set: typesSet },
    { title: "Labels", function: labelClick, set: labelsSet },
    { title: "People", function: peopleClick, set: peopleMap },
    { title: "Colors", function: colorClick, set: colorsSet },
  ];

  return (
    <div
      className="search-section"
      style={{
        paddingTop: noMatchingNotes && filtersExist && "5.625rem",
      }}
    >
      <AnimatePresence>
        {noMatchingNotes && filtersExist && (
          <motion.div
            className="no-matching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            No matching results.
          </motion.div>
        )}
      </AnimatePresence>
      {filtersToRender.map((item) => {
        const title = item.title.toLowerCase();
        const isLabel = title === "labels";
        const isTypes = title === "types";
        const isColors = title === "colors";
        const isPeople = title === "people";

        const itemWidth = isLabel
          ? "160"
          : isTypes
            ? "160"
            : isColors
              ? "50"
              : isPeople
                ? "160"
                : "130";

        if (
          item.set.size === 0 ||
          (isColors && item.set.size === 1 && item.set.has("Default"))
        ) {
          return;
        }

        renderedIndex++;
        return (
          <motion.div
            key={item.title}
            initial={{ y: 200 / (renderedIndex + 1.7), opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            transition={{
              y: {
                delay: renderedIndex / 10,
                type: "spring",
                stiffness: 700,
                damping: 50,
                mass: 1,
              },
              opacity: { delay: renderedIndex / 10, duration: 0.3 },
            }}
            className="filter-container"
          >
            <div className="filter-container-title">
              {item.title.toUpperCase()}
            </div>

            <div
              className="filter-items-container"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, max-content))`,
              }}
            >
              {[...item.set].map((setItem, index) => {
                const isImages = setItem === "Images";

                const func = (data) => {
                  resetText();
                  item.function(data);
                };

                return (
                  <Fragment key={setItem}>
                    {isLabel ? (
                      <LabelFilterItem onClick={func} labelUUID={setItem} />
                    ) : isTypes ? (
                      <TypeFilterItem onClick={func} isImages={isImages} />
                    ) : isColors ? (
                      <ColorFilterItem onClick={func} color={setItem} />
                    ) : isPeople ? (
                      <CollabFilterItem onClick={func} data={setItem[1]} />
                    ) : (
                      <></>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default memo(Filters);
