"use client";

import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";
import { useSearch } from "@/context/SearchContext";
import { useEffect, useRef } from "react";

export function useBatchLoading({
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
  const {
    layout,
    labelsReady,
    currentSection,
    loadNextBatchRef,
    notesIndexMapRef,
    breakpoint,
    initialLoading,
    skipLabelObjRefresh,
  } = useAppContext();

  const {
    filters,
    labelSearchTerm,
    setLabelSearchTerm,
    searchRef,
    searchTerm,
  } = useSearch();

  const { labelsRef } = useLabelsContext();

  const isLoadingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const layoutTimeoutRef = useRef(null);
  const layoutVersionRef = useRef(0);
  const isFirstBatchRef = useRef(true);
  const visibleItemsRef = useRef(null);

  const BUFFER = 700;

  useEffect(() => {
    if (!initialLoading) {
      requestAnimationFrame(() => {
        loadNextBatch();
      });
    }
  }, [initialLoading]);

  useEffect(() => {
    visibleItemsRef.current = visibleItems;
  }, [visibleItems]);

  const loadNextBatch = (data = {}) => {
    const {
      currentSet: currentVisibleSet = visibleItems,
      version = layoutVersionRef.current,
    } = data;
    const container = containerRef.current;
    if (!container || !currentSection) {
      isLoadingRef.current = false;
      return;
    }
    const scrollY = window.scrollY;
    const containerBottom = container.getBoundingClientRect().bottom + scrollY;
    const viewportHeight = window.innerHeight;
    const threshold = viewportHeight + scrollY + BUFFER;

    if (containerBottom > threshold || version !== layoutVersionRef.current) {
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
              ([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt),
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
            if (!currentVisibleSet.has(uuid) && isInCurrentSection(note)) {
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
    if (nextBatch.length === 0) {
      isLoadingRef.current = false;
      return;
    }

    requestIdleCallback(() => {
      if (version !== layoutVersionRef.current) {
        isLoadingRef.current = false;
        return;
      }
      setVisibleItems((prev) => {
        const updated = new Set(prev);
        currentSection?.toLowerCase() !== "labels"
          ? nextBatch.forEach((uuid) => updated.add(uuid))
          : nextBatch.forEach(([uuid, label]) => updated.add(uuid));

        setTimeout(() => {
          if (version !== layoutVersionRef.current) {
            isLoadingRef.current = false;
            return;
          }

          requestAnimationFrame(() => {
            setTimeout(() => {
              loadNextBatch({
                currentSet: updated,
                version: version,
              });
            }, 700);
          });
        }, 50);

        return updated;
      });
    });
  };

  useEffect(() => {
    loadNextBatchRef.current = loadNextBatch;
  }, [loadNextBatch]);

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
          timeout ? 100 : 10,
        );
      });
    });
  };

  const isInCurrentSection = (note) => {
    switch (currentSection?.toLowerCase()) {
      case "home":
        return !note?.isArchived && !note?.isTrash;
      case "archive":
        return note?.isArchived && !note?.isTrash;
      case "trash":
        return note?.isTrash;
      case "search":
        return matchesFilters(note);
      case "dynamiclabel":
        return note?.labels?.includes(labelObj?.uuid) && !note?.isTrash;
    }
  };

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      const version = layoutVersionRef.current;
      if (scrollTop + viewportHeight >= fullHeight - BUFFER) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (isLoadingRef.current) return;
            loadNextBatch({
              currentSet: visibleItemsRef.current,
              version: version,
            });
          }, 500);
        });
      }
    };

    window.addEventListener("scroll", handler);

    return () => window.removeEventListener("scroll", handler);
  }, [loadNextBatch, layout]);

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
    resetBatchLoading();
    requestIdleCallback(() => {
      clearTimeout(layoutTimeoutRef.current);
      setIsGrid(layout === "grid");

      requestAnimationFrame(() => {
        layoutTimeoutRef.current = setTimeout(() => {
          resetAndLoad();
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
    if (
      isFirstRenderRef.current ||
      !currentSection ||
      currentSection.toLowerCase() !== "search"
    )
      return;
    requestAnimationFrame(() => {
      resetAndLoad(false);
    });
  }, [filters]);

  useEffect(() => {
    if (skipLabelObjRefresh.current) {
      skipLabelObjRefresh.current = false;
      return;
    }
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
      if (isLoadingRef.current) return;
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadNextBatch();
        }, 500);
      });
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [loadNextBatch]);

  useEffect(() => {
    if (
      notesState.notes.length === 0 ||
      notesState.order.length === 0 ||
      isLoadingRef.current
    ) {
      return;
    }
    requestAnimationFrame(() => {
      loadNextBatch();
    });
  }, [notesState]);

  useEffect(() => {
    const handler = () => {
      const order = notesStateRef.current.order;
      const notes = notesStateRef.current.notes;

      const container = containerRef.current;

      if (!container) return;
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const containerBottom =
        container.getBoundingClientRect().bottom + scrollY;

      const threshold = viewportHeight + BUFFER + scrollY;

      if (containerBottom <= threshold || isLoadingRef.current) {
        return;
      }

      const isGrid = layout === "grid";
      const gridNoteWidth =
        breakpoint === 1 ? 240 : breakpoint === 2 ? 180 : 240;
      const COLUMN_WIDTH = isGrid ? gridNoteWidth : 600;
      const GUTTER = breakpoint === 1 ? 15 : 8;

      const parent = container.parentElement;
      const parentWidth = parent.clientWidth;
      const style = window.getComputedStyle(parent);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      const availableWidth = parentWidth - paddingLeft - paddingRight;

      const columns = !isGrid
        ? 1
        : Math.max(1, Math.floor(availableWidth / (COLUMN_WIDTH + GUTTER)));

      let lastUUID = null;

      const visibleOrder = [];
      for (const uuid of visibleItemsRef.current) {
        const index = notesIndexMapRef.current.get(uuid);
        visibleOrder.push(index);
      }

      const positionsMap = new Map();

      for (let i = 5; i < visibleOrder.length; i += 5) {
        const positions = [];
        let tempLastUUID = null;
        for (let j = i - columns; j < i; j++) {
          if (j < 0) continue;
          const noteIndex = visibleOrder[j];
          const note = notes.get(order[noteIndex]);
          const noteElement = note?.ref?.current;
          if (!noteElement || !isInCurrentSection(note)) continue;
          tempLastUUID = note.uuid;
          let bottom = positionsMap.get(note.uuid);

          if (!bottom) {
            bottom =
              noteElement.getBoundingClientRect().bottom + window.scrollY;
            positionsMap.set(note.uuid, bottom);
          }

          positions.push(bottom);
        }
        if (positions.length === 0) continue;
        const max = Math.max(...positions);
        const tallestNote = Math.floor(max + 15);
        if (tallestNote > viewportHeight + window.scrollY + BUFFER) {
          lastUUID = tempLastUUID;
          break;
        }
      }

      setVisibleItems(() => {
        const newItems = new Set();

        for (let noteUUID of order) {
          if (!visibleItemsRef.current.has(noteUUID)) continue;
          newItems.add(noteUUID);
          if (noteUUID === lastUUID) {
            break;
          }
        }

        return newItems;
      });
    };

    window.addEventListener("focus", handler);
    window.addEventListener("removeOffScreenNotes", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("removeOffScreenNotes", handler);
    };
  }, [currentSection, layout, breakpoint]);

  if (!currentSection) return;
}
