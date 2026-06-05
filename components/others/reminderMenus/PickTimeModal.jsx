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
      func: () =>
        noteActions({
          type: "DELETE_REMINDER",
          note: note,
          setLocalNote,
        }),
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
        style={{ zIndex: "312" }}
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
        <div className="action-title">Pick date & time</div>
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
          <div className="del-reminder-btn" onClick={deleteReminder}>Delete reminder</div>
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
