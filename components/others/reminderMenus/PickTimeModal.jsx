import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useGlobalContext } from "@/context/GlobalContext";
import Select from "../Select";
import TimeSelect from "./TimeSelect";
import ClockTimePicker from "./ClockTimePicker";
import { format } from "date-fns";
import MobileDatePicker from "./MobileDatePicker";
import Button from "@/components/Tools/Button";

const reps = ["Does not repeat", "Daily", "Weekly", "Monthly", "Yearly"];

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const PickTimeModal = ({
  isOpen,
  setIsOpen,
  note,
  setLocalNote,
  noteActions,
}) => {
  const { isExpanded } = useGlobalContext();
  const isMobile = isExpanded.threshold === "before";
  const { isActionModalOpenRef, setDialogInfoRef } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const inputRef = useRef(null);

  const noteReminder = note?.reminder?.date
    ? new Date(note.reminder.date)
    : null;

  const noteRep =
    note?.reminder?.rep?.toLowerCase() !== "dnr" && noteReminder
      ? capitalizeFirstLetter(note?.reminder?.rep)
      : reps[0];

  const [selectedRep, setSelectedRep] = useState(noteRep);
  const [selectedTime, setSelectedTime] = useState(
    noteReminder ? format(noteReminder, "HH:mm") : "08:00",
  );
  const [selectedDate, setSelectedDate] = useState(noteReminder ?? new Date());

  const isInvalidDate = selectedDate < new Date();

  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute("data-prevent-scroll", 1);
    }

    return () => document.body.removeAttribute("data-prevent-scroll");
  }, [isOpen]);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!selectedTime) return;

    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      const [h, m] = selectedTime.split(":").map(Number);
      newDate.setHours(h, m, 0, 0);
      return newDate;
    });
  }, [selectedTime]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    isActionModalOpenRef.current = true;
    return () => (isActionModalOpenRef.current = false);
  }, []);

  const isDiabled = (time) => {
    if (!selectedDate) return true;
    const date = new Date(selectedDate);
    date.setHours(time);
    return date < new Date();
  };

  const time = [
    {
      value: "08:00",
      label: "Morning",
      sideText: "8:00 AM",
      disabled: isDiabled(8),
    },
    {
      value: "13:00",
      label: "Afternoon",
      sideText: "1:00 PM",
      disabled: isDiabled(13),
    },
    {
      value: "18:00",
      label: "Evening",
      sideText: "6:00 PM",
      disabled: isDiabled(18),
    },
    {
      value: "20:00",
      label: "Night",
      sideText: "8:00 PM",
      disabled: isDiabled(20),
    },
    { value: "custom", label: "Custom" },
  ];

  const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const dateOptions = [
    {
      value: startOfDay(new Date()),
      label: "Today",
    },
    {
      value: startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      label: "Tomorrow",
    },
    {
      value: startOfDay(new Date(new Date().setDate(new Date().getDate() + 7))),
      label: `Next ${new Date().toLocaleDateString("en-US", { weekday: "long" })}`,
    },
    { value: "custom", label: "Custom" },
  ];

  const deleteReminder = () => {
    setDialogInfoRef.current({
      func: () => {
        noteActions({
          type: "DELETE_REMINDER",
          note: note,
          setLocalNote,
        });
        setIsOpen(false);
      },
      title: "Delete reminder?",
      message: "You can add another reminder later.",
      btnMsg: "Delete",
    });
  };

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
        className="overlay"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
          pointerEvents: "none",
          display: "none",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        style={{ zIndex: "209" }}
        onClick={() => {
          setIsOpen(false);
        }}
      />
      <motion.div
        className="pick-time-modal"
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
      >
        <div
          className="action-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Pick date & time</span>
          {noteReminder && (
            <Button
              data-tooltip="Delete reminder"
              style={{
                width: "35px",
                height: "35px",
                position: "absolute",
                right: "0",
              }}
              onClick={deleteReminder}
            >
              <svg
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.36667 4.49524C5.83924 4.49524 6.22222 4.87047 6.22222 5.33333V12.5714C6.22222 13.0343 5.83924 13.4095 5.36667 13.4095C4.89417 13.4095 4.51115 13.0343 4.51115 12.5714V5.33333C4.51115 4.87047 4.89417 4.49524 5.36667 4.49524Z"
                  fill="var(--error)"
                />
                <path
                  d="M9.33333 5.33333C9.33333 4.87047 8.95036 4.49524 8.47778 4.49524C8.00528 4.49524 7.62222 4.87047 7.62222 5.33333V12.5714C7.62222 13.0343 8.00528 13.4095 8.47778 13.4095C8.95036 13.4095 9.33333 13.0343 9.33333 12.5714V5.33333Z"
                  fill="var(--error)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.77338 1.98347C2.80996 0.882118 3.75739 0 4.92077 0H9.07923C10.2426 0 11.19 0.882118 11.2266 1.98347H13.2376C13.6586 1.98347 14 2.30908 14 2.71074C14 3.10692 13.668 3.4291 13.2548 3.43784C13.293 3.53093 13.3116 3.63306 13.3059 3.73938L12.7567 14.0544C12.6986 15.1445 11.7552 16 10.6109 16H3.39085C2.24546 16 1.30146 15.1429 1.24496 14.0515L0.695396 3.43525C0.305713 3.40289 0 3.09087 0 2.71074C0 2.30908 0.341328 1.98347 0.762378 1.98347H2.77338ZM4.30084 1.98347C4.33531 1.68595 4.59972 1.45454 4.92077 1.45454H9.07923C9.4003 1.45454 9.66467 1.68595 9.6992 1.98347H4.30084ZM2.22215 3.43802H11.8341C11.8051 3.50892 11.7874 3.5854 11.7831 3.66558L11.2339 13.9806C11.217 14.2971 10.9432 14.5454 10.6109 14.5454H3.39085C3.05832 14.5454 2.78426 14.2966 2.76785 13.9797L2.22215 3.43802Z"
                  fill="var(--error)"
                />
              </svg>
            </Button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <Select
            options={dateOptions}
            value={startOfDay(selectedDate)}
            onChange={(date) => {
              if (date === "custom") {
                setDatePickerOpen(true);
                return;
              }
              const newDate = new Date(date);
              const [h, m] = selectedTime.split(":").map(Number);
              newDate.setHours(h, m, 0, 0);
              setSelectedDate(newDate);
            }}
            isDate={true}
          />
          <TimeSelect
            options={time}
            value={selectedTime}
            onChange={(time) => {
              if (!time || time === selectedTime) return;
              if (time === "custom") {
                setTimePickerOpen(true);
                return;
              }
              setSelectedTime(time);
              setSelectedDate((prev) => {
                const newDate = new Date(prev);
                const [h, m] = time.split(":").map(Number);
                newDate.setHours(h, m, 0, 0);
                return newDate;
              });
            }}
            useSideTextforInput={true}
            inputRef={inputRef}
            selectedDate={selectedDate}
          />
          <Select
            options={reps}
            value={selectedRep}
            onChange={setSelectedRep}
          />
        </div>
        <div className="action-btns-container">
          <button
            className="action-modal-bottom-btn action-cancel"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Cancel
          </button>
          <button
            disabled={isInvalidDate}
            className="action-modal-bottom-btn"
            onClick={() => {
              setIsOpen(false);

              if (+noteReminder === +selectedDate && selectedRep === noteRep)
                return;

              const acceptedReps = reps.slice(1);
              const rep = acceptedReps.includes(selectedRep)
                ? selectedRep.toLowerCase()
                : "DNR";

              const reminder = {
                date: selectedDate,
                rep: rep,
                enabled: true,
              };
              noteActions({
                type: "SET_REMINDER",
                note: note,
                reminder,
                setLocalNote,
              });
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
      <AnimatePresence>
        {timePickerOpen && (
          <ClockTimePicker
            isOpen={timePickerOpen}
            setIsOpen={setTimePickerOpen}
            setSelectedTime={setSelectedTime}
            initialTime={((arr) => ({ h: arr[0], m: arr[1] }))(
              selectedTime.split(":").map(Number),
            )}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {datePickerOpen && (
          <MobileDatePicker
            onChange={(date) => {
              if (!date) return;
              if (selectedTime) {
                const [h, m] = selectedTime.split(":").map(Number);
                date.setHours(h, m, 0, 0);
              } else {
                date.setHours(0, 0, 0, 0);
              }
              setSelectedDate(date);
            }}
            initialDate={selectedDate}
            isOpen={datePickerOpen}
            setIsOpen={setDatePickerOpen}
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal"),
  );
};

export default memo(PickTimeModal);
