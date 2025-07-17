import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { v4 as uuid } from "uuid";
import { createNoteAction } from "@/utils/actions";
import ComposeTools from "./ComposeTools";
import { debounce } from "lodash";
import { useAppContext } from "@/context/AppContext";
import { AnimatePresence } from "framer-motion";
import MoreMenu from "./MoreMenu";
import ManageLabelsCompose from "./ManageLabelsCompose";
import ImageDropZone from "../Tools/ImageDropZone";

const ComposeNote = ({
  dispatchNotes,
  setVisibleItems,
  containerRef,
  lastAddedNoteRef,
}) => {
  const {
    user,
    labelsRef,
    setLoadingImages,
    showTooltip,
    hideTooltip,
    closeToolTip,
    openSnackRef,
  } = useAppContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const userID = user?.id;
  const [note, setNote] = useState({
    uuid: "",
    title: "",
    content: "",
    color: "Default",
    background: "DefaultBG",
    labels: [],
    checkboxes: [],
    showCheckboxes: true,
    expandCompleted: true,
    isPinned: false,
    isArchived: false,
    isTrash: false,
    images: [],
    imageFiles: [],
  });
  const [selectedColor, setSelectedColor] = useState("Default");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(false);
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (titleRef.current) titleRef.current.textContent = "";
    if (contentRef.current) contentRef.current.textContent = "";

    // setSelectedColor("Default");
  }, [isOpen]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsOpen2(true);
      setIsOpen(true);
    };

    window.addEventListener("openModal", handler);
    return () => window.removeEventListener("openModal", handler);
  }, []);

  const centerModal = () => {
    requestAnimationFrame(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      const topPos = (viewportHeight - modalHeight) / 3;

      modalRef.current.style.transform = "none";
      modalRef.current.style.left = `${(viewportWidth - modalWidth) / 2}px`;
      modalRef.current.style.top = `${topPos > 30 ? topPos : 30}px`;
    });
  };

  const positionModal = (rect) => {
    const modal = modalRef.current;
    const modalRect = modal.getBoundingClientRect();

    const translateX = rect.left - modalRect.left;
    const translateY = rect.top - modalRect.top;

    const scaleX = rect.width / modalRect.width;
    const scaleY = rect.height / modalRect.height;

    modal.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  };

  const UploadImagesAction = async (noteUUID) => {
    const formData = new FormData();
    const files = note.imageFiles;

    if (files.length === 0) return;

    const imageUUIDs = [];

    formData.append("noteUUID", noteUUID);

    files.forEach(({ file, uuid }) => {
      const imageUUID = uuid;
      imageUUIDs.push(imageUUID);

      formData.append("files", file);
      formData.append("imageUUIDs", imageUUID);
    });

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      imageUUIDs.forEach((id) => newSet.add(id));
      return newSet;
    });

    const res = await fetch("/api/note/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      imageUUIDs.forEach((id) => newSet.delete(id));
      return newSet;
    });

    if (data.error) {
      console.error("Upload error:", data.error);
    } else {
      const updatedImages = data;
      const imagesMap = new Map();
      updatedImages.forEach((imageData) => {
        imagesMap.set(imageData.uuid, imageData);
      });
      dispatchNotes({
        type: "UPDATE_IMAGES",
        note: { uuid: noteUUID },
        imagesMap: imagesMap,
      });
    }
  };

  const handleCreateNote = async () => {
    const newUUID = uuid();

    const newNote = {
      uuid: newUUID,
      title: note.title,
      content: note.content,
      color: note.color,
      background: note.background,
      labels: note.labels,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      checkboxes: note.checkboxes,
      showCheckboxes: note.showCheckboxes,
      expandCompleted: note.expandCompleted,
      isTrash: note.isTrash,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: note.images,
      textUpdatedAt: new Date(),
    };
    dispatchNotes({
      type: "ADD_NOTE",
      newNote: newNote,
    });

    setVisibleItems((prev) => new Set([...prev, newUUID]));

    window.dispatchEvent(new Event("loadingStart"));
    try {
      await createNoteAction(newNote);
      await UploadImagesAction(newNote.uuid);
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const reset = () => {
    setSelectedColor("Default");
    setNote({
      uuid: "",
      title: "",
      content: "",
      color: "Default",
      labels: [],
      checkboxes: [],
      showCheckboxes: true,
      expandCompleted: true,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      images: [],
      imageFiles: [],
    });
    setRedoStack([]);
    setUndoStack([]);
  };

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", centerModal);
    return () => window.removeEventListener("resize", centerModal);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const observer = new ResizeObserver(() => centerModal());
    if (modalRef.current) observer.observe(modalRef.current);

    centerModal();

    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.id === "n-overlay") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.paddingRight = "0px";
    }
  }, [isOpen]);

  useEffect(() => {
    if (!modalRef.current || !isOpen2) return;
    const overlay = document.getElementById("n-overlay");
    if (isOpen) {
      modalRef.current.style.display = "flex";
      centerModal();

      modalRef.current.style.opacity = 0;
      modalRef.current.style.marginTop = "-8px";
      modalRef.current.style.transition =
        "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), left 0s, top .13s, background-color 0.25s ease-in-out";
      modalRef.current.offsetHeight;
      modalRef.current.style.opacity = "1";
      modalRef.current.style.marginTop = "0px";

      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.style.opacity = "1";
    } else {
      setIsOpen2(false);
      overlay.style.opacity = "0";
      modalRef.current.style.transition =
        "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)";

      const noteEmpty =
        !note.title &&
        !note.content &&
        note.images.length === 0 &&
        note.labels.length === 0;

      if (noteEmpty) {
        modalRef.current.style.marginTop = "-8px";
        modalRef.current.style.opacity = "0";

        const handler = (e) => {
          if (e.propertyName === "margin-top") {
            modalRef.current.removeEventListener("transitionend", handler);
            modalRef.current.removeAttribute("style");
            overlay.removeAttribute("style");
            reset();
          }
        };

        modalRef.current.removeEventListener("transitionend", handler);
        modalRef.current.addEventListener("transitionend", handler);
      } else {
        handleCreateNote();

        const observer = new MutationObserver(() => {
          const lastNote = lastAddedNoteRef.current;
          if (!lastNote) return;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const rect = lastNote.getBoundingClientRect();
              positionModal(rect);
              lastNote.style.opacity = "0";
            });
          });
          observer.disconnect();
        });

        observer.observe(containerRef.current, {
          childList: true,
          subtree: false,
        });

        const handler = (e) => {
          if (e.propertyName === "transform") {
            modalRef.current.removeEventListener("transitionend", handler);
            requestAnimationFrame(() => {
              const lastNote = lastAddedNoteRef.current;
              modalRef.current.removeAttribute("style");
              overlay.removeAttribute("style");
              lastNote.style.removeProperty("opacity");
              reset();
            });
          }
        };

        modalRef.current.removeEventListener("transitionend", handler);
        modalRef.current.addEventListener("transitionend", handler);
      }
    }
  }, [isOpen]);

  const handlePinClick = () => {
    // closeToolTip();
    setNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
  };

  const AddNoteImageDelete = (imageUUID, imageURL) => {
    const imageObject = { url: imageURL, uuid: imageUUID };
    let imageFileObject;
    let imageIndex;

    setNote((restOfNote) => {
      const filteredImages = restOfNote.images.reduce((acc, image, index) => {
        if (image.uuid === imageUUID) {
          imageIndex = index;
          return acc;
        }

        acc.push(image);
        return acc;
      }, []);
      return { ...restOfNote, images: filteredImages };
    });

    setNote((restOfNote) => {
      const filteredImageFiles = restOfNote.imageFiles.reduce(
        (acc, imageFile) => {
          if (imageFile.uuid === imageUUID) {
            imageFileObject = { file: imageFile.file, uuid: imageUUID };
            return acc;
          }
          acc.push(imageFile);
          return acc;
        },
        []
      );
      return { ...restOfNote, imageFiles: filteredImageFiles };
    });

    const undo = () => {
      setNote((restOfNote) => {
        const updatedImages = [...restOfNote.images];
        updatedImages.splice(imageIndex, 0, imageObject);

        return {
          ...restOfNote,
          images: updatedImages,
          imageFiles: [...restOfNote.imageFiles, imageFileObject],
        };
      });
    };

    openSnackRef.current({ snackMessage: "Image deleted", snackOnUndo: undo });
  };

  const titleDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 120),
    []
  );

  const contentDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 100),
    []
  );

  const handleUndo = async () => {
    if (undoStack.length === 1) {
      setRedoStack((prev) => [...prev, undoStack[0]]);
      setUndoStack([]);
      titleRef.current.innerText = "";
      contentRef.current.innerText = "";
      setNote((prev) => ({ ...prev, title: "", content: "" }));
    } else {
      const redoItem = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, redoItem]);
      const updatedStack = undoStack.slice(0, -1);
      setUndoStack(updatedStack);
      const undoItem = updatedStack[updatedStack.length - 1];

      titleRef.current.innerText = undoItem.title;
      contentRef.current.innerText = undoItem.content;
      setNote((prev) => ({
        ...prev,
        title: undoItem.title,
        content: undoItem.content,
      }));
    }
  };

  const handleRedo = async () => {
    const undoItem = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, undoItem]);
    setRedoStack((prev) => prev.slice(0, -1));
    const redoItem = redoStack[redoStack.length - 1];

    titleRef.current.innerText = redoItem.title;
    contentRef.current.innerText = redoItem.content;

    setNote((prev) => ({
      ...prev,
      title: redoItem.title,
      content: redoItem.content,
    }));
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent;
    const t = text === "\n" ? "" : text;
    setRedoStack([]);
    titleDebouncedSetUndo({ title: t, content: contentRef.current.innerText });
    setNote({ ...note, title: t });
    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent;
    const t = text === "\n" ? "" : text;
    setRedoStack([]);
    contentDebouncedSetUndo({ title: titleRef.current.innerText, content: t });
    setNote({ ...note, content: t });
    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const insert = async () => {
    for (let i = 0; i < 20; i++) {
      const newNote = {
        uuid: uuid(),
        title: note.title,
        content: note.content,
        color: note.color,
        background: "DefaultBG",
        labels: note.labels,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        isTrash: note.isTrash,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: note.images,
      };
      createNoteAction(newNote);
    }
  };

  const removeLabel = (labelUUID) => {
    const newLabels = note?.labels.filter(
      (noteLabelUUID) => noteLabelUUID !== labelUUID
    );
    setNote((prev) => ({ ...prev, labels: newLabels }));
  };

  const handleLabelClick = (e, label) => {
    e.stopPropagation();
    setIsOpen(false);
    const encodedLabel = encodeURIComponent(label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

  const handleLabels = () => {
    setMoreMenuOpen(false);
    setLabelsOpen(true);
  };

  const menuItems = [
    {
      title: note.labels.length === 0 ? "Add label" : "Change labels",
      function: handleLabels,
      icon: "label-menu-icon",
    },
    {
      title: "Show checkboxes",
      function: () => setMoreMenuOpen(false),
      icon: "add-checkbox-menu-icon",
    },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleNoteMouseLeave = (e) => {
    setIsDragOver(false);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
  };

  const handleOnDrop = (e) => {
    e.preventDefault();
    if (!inputRef.current) return;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      inputRef.current.files = dt.files;
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  };

  if (!isClient) return;

  return createPortal(
    <>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleOnDrop}
        onMouseLeave={handleNoteMouseLeave}
        ref={modalRef}
        className={[
          "add-modal",
          selectedColor,
          isOpen && "modal-shadow",
          selectedColor === "Default" ? "default-border" : "transparent-border",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* <button onClick={insert}>insert</button> */}
        <div
          style={{ overflowY: !isOpen && "hidden" }}
          className={`modal-inputs-container ${"n-bg-" + note.background}`}
        >
          {note.images.length === 0 ||
            (!note.images && <div className="modal-corner" />)}
          <div style={{ opacity: !isOpen && "0" }} className="modal-pin">
            <Button onClick={handlePinClick} disabled={!isOpen}>
              <PinIcon
                isPinned={note.isPinned}
                opacity={0.8}
                rotation={note.isPinned ? "-45deg" : "-5deg"}
                images={note.images.length !== 0}
              />
            </Button>
          </div>
          <div
            style={{
              position: "relative",
              transition: "all 0.2s ease",
              opacity: isOpen ? "1" : "0.15",
            }}
          >
            <NoteImagesLayout
              images={note.images}
              deleteSource="AddModal"
              AddNoteImageDelete={AddNoteImageDelete}
              modalOpen={isOpen}
            />
            {/* {!isOpen && note.images.length > 0 && (
              <div className="linear-loader" />
            )} */}
          </div>
          <div
            style={{
              opacity: isOpen
                ? "1"
                : note.content && !note.title
                  ? "0"
                  : !note.title && !note.content
                    ? "0"
                    : "1",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onPaste={handlePaste}
            ref={titleRef}
            className="
               modal-title-input modal-editable-title"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Title"
            spellCheck="false"
          />
          <div
            style={{
              opacity: isOpen
                ? "1"
                : !note.content && note.title
                  ? "0"
                  : !note.title && !note.content
                    ? "0"
                    : "1",
              minHeight: "30px",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className={`${"modal-content-input"} modal-editable-content`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Note"
            spellCheck="false"
          />
          {note?.labels?.length > 0 && (
            <div
              style={{ paddingBottom: "0.8rem" }}
              className="note-labels-container"
            >
              {note?.labels
                .sort((a, b) => {
                  const labelsMap = labelsRef.current;
                  const labelA = labelsMap.get(a)?.label || "";
                  const labelB = labelsMap.get(b)?.label || "";
                  return labelA.localeCompare(labelB);
                })
                .map((labelUUID, index) => {
                  const label = labelsRef.current.get(labelUUID)?.label;
                  return (
                    <div
                      onClick={(e) => handleLabelClick(e, label)}
                      key={labelUUID}
                      className={[
                        "label-wrapper",
                        !note?.isTrash && "label-wrapper-h",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <label className="note-label">{label}</label>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          closeToolTip();
                          removeLabel(labelUUID);
                        }}
                        onMouseEnter={(e) =>
                          showTooltip(e, "Remove label")
                        }
                        onMouseLeave={hideTooltip}
                        className="remove-label"
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        <ComposeTools
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setNote={setNote}
          note={note}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          redoStack={redoStack}
          undoStack={undoStack}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          setAnchorEl={setAnchorEl}
          setMoreMenuOpen={setMoreMenuOpen}
          setLabelsOpen={setLabelsOpen}
          inputRef={inputRef}
        />
        <AnimatePresence>{isDragOver && <ImageDropZone />}</AnimatePresence>
      </div>
      <AnimatePresence>
        {moreMenuOpen && !labelsOpen && (
          <MoreMenu
            setIsOpen={setMoreMenuOpen}
            anchorEl={anchorEl}
            isOpen={moreMenuOpen}
            menuItems={menuItems}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {labelsOpen && (
          <ManageLabelsCompose
            note={note}
            setNote={setNote}
            isOpen={labelsOpen}
            setIsOpen={setLabelsOpen}
            anchorEl={anchorEl}
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(ComposeNote);
