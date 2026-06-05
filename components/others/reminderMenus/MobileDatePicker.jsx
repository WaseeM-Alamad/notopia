import { useEffect, useRef, useState } from "react";
import "@/assets/styles/mobileDatePicker.css";
import { motion } from "framer-motion";
import { useGlobalContext } from "@/context/GlobalContext";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      currentMonth: true,
      date: new Date(year, month, day),
    });
  }

  // Next month days
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: nextDay++,
      currentMonth: false,
      date: new Date(year, month + 1, nextDay),
    });
  }

  return cells;
}

const isPastDay = (cell) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(cell.date);
  date.setHours(0, 0, 0, 0);

  return date < today;
};

export default function MobileDatePicker({
  initialDate,
  onChange,
  isOpen,
  setIsOpen,
}) {
  const { isExpanded } = useGlobalContext();
  const isMobile = isExpanded.threshold === "before";
  const selectedYearRef = useRef(null);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const today = new Date();
  const init = initialDate ?? today;

  const [selected, setSelected] = useState({
    year: init.getFullYear(),
    month: init.getMonth(),
    day: init.getDate(),
  });
  const [view, setView] = useState({
    year: init.getFullYear(),
    month: init.getMonth(),
  });
  const [showYearGrid, setShowYearGrid] = useState(false);

  useEffect(() => {
    if (showYearGrid && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center" });
    }
  }, [showYearGrid]);

  const cells = getCalendarDays(view.year, view.month);

  const prevMonth = () => {
    setView((v) => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const nextMonth = () => {
    setView((v) => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const selectDay = (cell) => {
    setSelected({
      year: cell.date.getFullYear(),
      month: cell.date.getMonth(),
      day: cell.day,
    });
    setView({ year: cell.date.getFullYear(), month: cell.date.getMonth() });
  };

  const selectYear = (year) => {
    setView((v) => ({ ...v, year }));
    setSelected((s) => ({ ...s, year }));
    setShowYearGrid(false);
  };

  const handleOk = () => {
    const date = new Date(selected.year, selected.month, selected.day);
    onChange?.(date);
    setIsOpen(false);
  };

  const isSelected = (cell) =>
    cell.day === selected.day &&
    cell.date.getMonth() === selected.month &&
    cell.date.getFullYear() === selected.year;

  const formattedHeader = new Date(
    selected.year,
    selected.month,
    selected.day,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const years = [];
  for (let y = 1924; y <= 2124; y++) years.push(y);

  return (
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
        style={{ zIndex: "411" }}
        onClick={() => {
          setIsOpen(false);
        }}
      />
      <motion.div
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
        className="dp-modal"
      >
        {/* Header */}
        <div className="dp-header">
          <span className="dp-label">Select date</span>
          <div className="dp-selected-date">
            <span>{formattedHeader}</span>
          </div>
        </div>

        <div className="dp-divider" />

        <div className="dp-month-nav">
          <button
            className="dp-month-label"
            onClick={() => setShowYearGrid((v) => !v)}
          >
            {MONTHS[view.month]} {view.year}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: 4 }}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {!showYearGrid && (
            <div className="dp-arrows">
              <button className="dp-arrow-btn" onClick={prevMonth}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="dp-arrow-btn" onClick={nextMonth}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {showYearGrid ? (
          /* Year grid */
          <div className="dp-year-grid">
            {years.map((y) => (
              <button
                key={y}
                ref={y === view.year ? selectedYearRef : null}
                className={`dp-year-item${y === view.year ? " dp-year-selected" : ""}`}
                onClick={() => selectYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Month nav */}

            {/* Day headers */}
            <div className="dp-grid">
              {DAYS.map((d, i) => (
                <span key={i} className="dp-day-header">
                  {d}
                </span>
              ))}
              {cells.map((cell, i) => (
                <button
                  key={i}
                  className={`dp-day${
                    cell.currentMonth && isSelected(cell)
                      ? " dp-day-selected"
                      : ""
                  }${!cell.currentMonth ? " dp-day-other-month" : ""}`}
                  onClick={() => selectDay(cell)}
                  disabled={isPastDay(cell)}
                >
                  {cell.day}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="dp-actions">
          <button
            className="action-modal-bottom-btn action-cancel"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Cancel
          </button>
          <button className="action-modal-bottom-btn" onClick={handleOk}>
            OK
          </button>
        </div>
      </motion.div>
    </>
  );
}
