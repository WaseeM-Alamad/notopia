import BackIcon from "@/components/icons/BackIcon";
import InputLeftArrow from "@/components/icons/InputLeftArrow";
import Button from "@/components/Tools/Button";
import React, { memo, useEffect, useRef, useState } from "react";
import Select from "../Select";
import { useAppContext } from "@/context/AppContext";
import DateSelect from "./DateSelect";
import TimeSelect from "./TimeSelect";

const reps = ["Does not repeat", "Daily", "Weekly", "Monthly", "Yearly"];

const PickTime = ({ setIsPickSection, setIsOpen, noteActions, note }) => {
  const { showTooltip, hideTooltip } = useAppContext();
  const [selectedRep, setSelectedRep] = useState(reps[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isInputValid, setIsInputValid] = useState(false);
  const inputRef = useRef(null);

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

  const isInvalidDate = selectedDate < new Date() || !isInputValid;

  return (
    <div className="pick-time-container">
      <div className="pick-time-top">
        <Button
          onMouseEnter={(e) => showTooltip(e, "Go back")}
          onMouseLeave={hideTooltip}
          onFocus={(e) => showTooltip(e, "Remind me")}
          style={{ width: "28px", height: "28px" }}
          onClick={() => setIsPickSection(false)}
        >
          <InputLeftArrow size={19} />
        </Button>
        <span style={{ fontSize: ".88rem" }}>Pick date & time</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        <DateSelect
          value={selectedDate}
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
        />
        <TimeSelect
          options={time}
          value={selectedTime}
          onChange={(time) => {
            if (!time || time === selectedTime) return;
            if (time === "custom") {
              inputRef.current.select();
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
          setIsInputValid={setIsInputValid}
        />
        <Select options={reps} value={selectedRep} onChange={setSelectedRep} />
      </div>
      <button
        disabled={isInvalidDate}
        className="modal-bottom-btn"
        style={{
          fontSize: ".8rem",
          padding: "0.4rem 1rem",
          alignSelf: "end",
          marginRight: ".9rem",
          marginTop: ".5rem",
          width: "fit-content",
          height: "unset",
          minHeight: "unset",
          fontWeight: "500",
        }}
        onClick={() => {
          setIsOpen(false);
          const reminder = {
            date: selectedDate,
            rep: selectedRep,
          };
          noteActions({
            type: "SET_REMINDER",
            note: note,
            reminder,
          });
        }}
      >
        Save
      </button>
    </div>
  );
};

export default memo(PickTime);
