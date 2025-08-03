"use client";

const handleServerCall = async (fns, snackbar) => {
  try {
    let result;
    window.dispatchEvent(new Event("loadingStart"));
    if (navigator.onLine) {
      for (const fn of fns) {
        result = await fn();
      }
    }

    return result;
  } catch (error) {
    snackbar({ snackMessage: error.message, showUndo: false });
  } finally {
    window.dispatchEvent(new Event("loadingEnd"));
  }
};

export default handleServerCall;
