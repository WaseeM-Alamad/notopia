import { useAppContext } from "@/context/AppContext";
import { useCallback, useEffect, useRef } from "react";

export function useSnackbar({
  setSnackbarState,
  setNoActionUndone,
  setUnloadWarn,
  undoFunction,
  redoFunction,
  onCloseFunction,
  allowUndoRef,
  allowRedoRef,
}) {
  const { openSnackRef } = useAppContext();

  const openSnackFunction = useCallback((data) => {
    const showUndo = data.showUndo ?? true;
    const noAction = data.noActionUndone ?? false;
    if (data.close) {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();
    } else {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();

      setTimeout(() => {
        setSnackbarState({
          message: data.snackMessage,
          showUndo: showUndo,
          snackOpen: true,
        });
        if (data.snackOnUndo !== undefined) {
          allowUndoRef.current = true;
          allowRedoRef.current = false;
          undoFunction.current = data.snackOnUndo;
        }
        if (data.snackRedo !== undefined) {
          redoFunction.current = data.snackRedo;
        }
        if (data.snackOnClose !== undefined) {
          onCloseFunction.current = data.snackOnClose;
        }
        if (data.unloadWarn) {
          setUnloadWarn(true);
        }

        setNoActionUndone(noAction);
      }, 80);
    }
  }, []);

  useEffect(() => {
    openSnackRef.current = openSnackFunction;
  }, [openSnackFunction]);
}
