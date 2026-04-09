import BackIcon from "@/components/icons/BackIcon";
import InputLeftArrow from "@/components/icons/InputLeftArrow";
import Button from "@/components/Tools/Button";
import React, { memo, useEffect, useState } from "react";
import Select from "../Select";
import { useAppContext } from "@/context/AppContext";
import DateSelect from "./DateSelect";

const reps = ["Does not repeat", "Daily", "Weekly", "Monthly", "Yearly"];

const PickTime = ({ setIsPickSection, setIsOpen }) => {
  const { showTooltip, hideTooltip } = useAppContext();
  const [selectedRep, setSelectedRep] = useState(reps[0]);
  const [selectedTime, setSelectedTime] = useState("8");
  const [selectedDate, setSelectedDate] = useState(null);
  const currentHour = new Date().getHours();

  const isDiabled = (time) => {
    if (!selectedDate) return true;
    const date = new Date(selectedDate);
    date.setHours(time);
    return date < new Date();
  };

  const time = [
    {
      value: "8",
      label: "Morning",
      sideText: "8:00 AM",
      disabled: isDiabled(8),
    },
    { value: "13", label: "Afternoon", sideText: "1:00 PM" },
    { value: "18", label: "Evening", sideText: "6:00 PM" },
    { value: "20", label: "Night", sideText: "8:00 PM" },
    { value: "custom", label: "Custom" },
  ];

  const isInvalidDate = selectedDate < new Date();

  useEffect(() => {
    console.log(selectedDate);
  }, [selectedDate]);

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
            date.setHours(0, 0, 0);
            date.setHours(selectedTime);
            setSelectedDate(date);
          }}
        />
        <Select
          options={time}
          value={selectedTime}
          onChange={(time) => {
            setSelectedTime(time);
            setSelectedDate((prev) => {
              const newDate = new Date(prev);
              newDate.setHours(time);
              return newDate;
            });
          }}
          useSideTextforInput={true}
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
        onClick={() => setIsOpen(false)}
      >
        Save
      </button>
    </div>
  );
};

export default memo(PickTime);
