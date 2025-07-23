"use client";

import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { useEffect, useRef } from "react";

export function useBatchLoading({
  currentSection,
  notesState,
  notesStateRef,
  setVisibleItems,
  visibleItems,
  labelObj,
  notesReady,
  setIsGrid,
  containerRef,
  matchesFilters,
}) {
  const { labelsRef, layout, labelsReady, calculateLayoutRef } =
    useAppContext();
  const {
    filters,
    labelSearchTerm,
    setLabelSearchTerm,
    searchRef,
    searchTerm,
  } = useSearch();
  const isLoadingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const layoutTimeoutRef = useRef(null);
  const layoutVersionRef = useRef(0);
  const isFirstBatchRef = useRef(true);

  const loadNextBatch = (data) => {
    const { currentSet: currentVisibleSet, version } = data;
    const container = containerRef.current;
    if (!container) {
      isLoadingRef.current = false;
      return;
    }
    const scrollY = window.scrollY;
    const totalHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    if (
      totalHeight > viewportHeight + scrollY + 700 ||
      version !== layoutVersionRef.current
    ) {
      isLoadingRef.current = false;
      return;
    }

    isLoadingRef.current = true;

    const currentNotes = data.notes || notesStateRef.current.notes;
    const currentOrder = data.order || notesStateRef.current.order;
    let sectionCount = 0;

    let batchSize = 5;

    if (isFirstBatchRef.current) {
      batchSize = 10;
      isFirstBatchRef.current = false;
    }

    const unrendered =
      currentSection?.toLowerCase() === "labels"
        ? [...labelsRef.current]
            .sort(
              ([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt)
            )
            .filter(([uuid, labelData]) => {
              const search = labelSearchTerm.trim().toLowerCase();
              const label = labelData.label.toLowerCase().trim();

              const notRenderedYet = !currentVisibleSet.has(uuid);
              const matchesSearch = search === "" || label.includes(search);

              return notRenderedYet && matchesSearch;
            })
        : currentOrder.filter((uuid) => {
            const note = currentNotes.get(uuid);
            if (!currentVisibleSet.has(uuid) && filterUnrendered(note)) {
              sectionCount++;
              return true;
            }
          });

    const sortedUnrendered =
      currentSection?.toLowerCase() !== "labels"
        ? unrendered.sort((a, b) => {
            const noteA = currentNotes.get(a);
            const noteB = currentNotes.get(b);

            if (noteA?.isPinned && !noteB?.isPinned) return -1;
            if (!noteA?.isPinned && noteB?.isPinned) return 1;

            if (!noteA?.isArchived && noteB?.isArchived) return -1;
            if (noteA?.isArchived && !noteB?.isArchived) return 1;

            return 0;
          })
        : unrendered;

    const nextBatch = sortedUnrendered.slice(0, batchSize);
    if (nextBatch.length === 0) return;

    requestIdleCallback(() => {
      if (version !== layoutVersionRef.current) return;
      setVisibleItems((prev) => {
        const updated = new Set(prev);
        currentSection?.toLowerCase() !== "labels"
          ? nextBatch.forEach((uuid) => updated.add(uuid))
          : nextBatch.forEach(([uuid, label]) => updated.add(uuid));

        setTimeout(() => {
          if (version !== layoutVersionRef.current) return;

          requestAnimationFrame(() => {
            setTimeout(() => {
              loadNextBatch({
                currentSet: updated,
                version: version,
              });
            }, 800);
          });
        }, 50);

        return updated;
      });
    });
  };

  const resetBatchLoading = () => {
    if (layoutVersionRef.current >= 1) {
      layoutVersionRef.current = 0;
    } else {
      layoutVersionRef.current += 0.1;
    }
    setVisibleItems(new Set());
  };

  const resetAndLoad = (timeout = true) => {
    requestIdleCallback(() => {
      resetBatchLoading();
      const version = layoutVersionRef.current;
      clearTimeout(layoutTimeoutRef.current);
      requestAnimationFrame(() => {
        layoutTimeoutRef.current = setTimeout(
          () => {
            loadNextBatch({
              currentSet: new Set(),
              version: version,
            });
          },
          timeout ? 100 : 10
        );
      });
    });
  };

  const filterUnrendered = (note) => {
    switch (currentSection?.toLowerCase()) {
      case "home":
        return !note.isArchived && !note.isTrash;
      case "archive":
        return note.isArchived && !note.isTrash;
      case "trash":
        return note.isTrash;
      case "search":
        return matchesFilters(note);
      case "dynamiclabel":
        return note?.labels?.includes(labelObj?.uuid) && !note.isTrash;
    }
  };

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      const version = layoutVersionRef.current;
      if (scrollTop + viewportHeight >= fullHeight - 700) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (isLoadingRef.current) return;
            loadNextBatch({
              currentSet: visibleItems,
              version: version,
            });
          }, 800);
        });
      }
    };

    window.addEventListener("scroll", handler);

    return () => window.removeEventListener("scroll", handler);
  }, [visibleItems, layout]);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        resetAndLoad();
      });
    };

    window.addEventListener("reloadNotes", handler);
    return () => window.removeEventListener("reloadNotes", handler);
  }, [notesState.notes, notesState.order]);

  useEffect(() => {
    if (!layout) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      setIsGrid(layout === "grid");
      return;
    }
    requestIdleCallback(() => {
      resetBatchLoading();
      const version = layoutVersionRef.current;
      clearTimeout(layoutTimeoutRef.current);
      setIsGrid(layout === "grid");

      requestAnimationFrame(() => {
        layoutTimeoutRef.current = setTimeout(() => {
          loadNextBatch({
            currentSet: new Set(),
            version: version,
          });
        }, 200);
      });
    });
  }, [layout]);

  useEffect(() => {
    if (isFirstRenderRef.current) return;
    requestAnimationFrame(() => {
      resetAndLoad(false);
    });
  }, [labelSearchTerm]);

  useEffect(() => {
    if (isFirstRenderRef.current || currentSection.toLowerCase() !== "search")
      return;
    requestAnimationFrame(() => {
      resetAndLoad(false);
    });
  }, [filters]);

  useEffect(() => {
    if (isFirstRenderRef.current || !labelObj || !notesReady || !labelsReady)
      return;
    requestAnimationFrame(() => {
      resetAndLoad(false);
    });
  }, [labelObj, notesReady, labelsReady]);

  useEffect(() => {
    if (currentSection?.toLowerCase() !== "search" || isFirstRenderRef.current)
      return;
    requestAnimationFrame(() => {
      resetAndLoad(false);
    });
  }, [searchTerm]);

  useEffect(() => {
    if (!notesReady || !labelsReady) return;

    if (currentSection?.toLowerCase() === "dynamiclabel") {
      return;
    }

    resetBatchLoading();
    const version = layoutVersionRef.current;
    requestAnimationFrame(() => {
      loadNextBatch({
        currentSet: new Set(),
        version: version,
      });
    });
    if (searchRef.current && currentSection?.toLowerCase() !== "search") {
      searchRef.current.value = "";
      setLabelSearchTerm("");
    }
  }, [currentSection, notesReady, labelsReady]);

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      const version = layoutVersionRef.current;
      if (scrollTop + viewportHeight >= fullHeight - 700) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (isLoadingRef.current) return;
            loadNextBatch({
              currentSet: visibleItems,
              version: version,
            });
          }, 0);
        });
      }
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [visibleItems, layout]);

  // useEffect(() => {
  //   const handler = () => {
  //     const order = notesStateRef.current.order;
  //     const notes = notesStateRef.current.notes;
  //     let stopID = null;

  //     for (let uuid of order) {
  //       const note = notes.get(uuid);
  //       if (!note?.ref?.current) continue;

  //       const noteElement = note.ref.current;
  //       const scrollTop = window.scrollY;
  //       const viewportHeight = window.innerHeight;
  //       const noteBottom =
  //         noteElement.getBoundingClientRect().bottom + scrollTop;

  //       if (noteBottom  > scrollTop + viewportHeight + 700) {
  //         console.log(noteBottom)
  //         stopID = note.uuid;
  //         break;
  //       }
  //     }
  //     const newSet = new Set();

  //     for (let uuid of visibleItems) {
  //       newSet.add(uuid);
  //       if (uuid === stopID) break;
  //     }

  //     // setVisibleItems(newSet);
  //     // console.log(newSet.size);
  //   };

  //   window.addEventListener("focus", handler);
  //   return () => window.removeEventListener("focus", handler);
  // }, [visibleItems]);
}
