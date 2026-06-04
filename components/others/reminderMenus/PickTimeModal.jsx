import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useGlobalContext } from "@/context/GlobalContext";
import Select from "../Select";
import TimeSelect from "./TimeSelect";
import ClockTimePicker from "./ClockTimePicker";
import { format } from "date-fns";

const reps = ["Does not repeat", "Daily", "Weekly", "Monthly", "Yearly"];

const PickTimeModal = ({ isOpen, setIsOpen, note }) => {
  const { isActionModalOpenRef } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

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
    // console.log("selectedDate", selectedDate);
  }, [selectedDate]);

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
        <div className="action-title">Pick date & time</div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <Select options={["hi", "hi2"]} value={"hi"} onChange={() => {}} />
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
            className="action-modal-bottom-btn"
            onClick={() => {
              setIsOpen(false);
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
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal"),
  );
};

export default memo(PickTimeModal);
