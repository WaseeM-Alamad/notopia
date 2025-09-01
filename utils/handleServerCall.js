"use client";

const handleServerCall = async (fns, snackbar, getFirstRes = false) => {
  try {
    let result = null;
    let firstRes = null;
    window.dispatchEvent(new Event("loadingStart"));
    if (!navigator.onLine) return;
    for (const fn of fns) {
      if (!firstRes && getFirstRes) {
        firstRes = await fn();
      } else {
        result = await fn();
      }
    }

    if (firstRes && getFirstRes) {
      return { firstResult: firstRes, otherResult: result };
    } else {
      return result;
    }
  } catch (error) {
    snackbar({ snackMessage: error.message, showUndo: false });
  } finally {
    window.dispatchEvent(new Event("loadingEnd"));
  }
};

export default handleServerCall;
