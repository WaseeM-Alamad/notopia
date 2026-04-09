import { memo, useState } from "react";

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
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DatePicker = ({ onSelect, selected = null }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(selected);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalCells = 42;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - firstDay;
    const date = new Date(year, month, 1 + dayOffset);
    cells.push(date);
  }

  function handleDayClick(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today) return;
    setSelectedDate(d);
    if (onSelect) onSelect(d);
  }

  return (
    <div className="date-picker">
      <div className="month-nav">
        <button
          className="date-nav-btn"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 11L5 7L9 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="month-label">
          {MONTHS[month]} {year}
        </span>
        <button
          className="date-nav-btn"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 11L9 7L5 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="dow-row">
        {DAYS.map((d) => (
          <div key={d} className="dow">
            {d}
          </div>
        ))}
      </div>

      <div className="days-grid">
        {cells.map((date, i) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          const isCurrentMonth = date.getMonth() === month;
          const isPast = d < today;
          const isToday = d.getTime() === today.getTime();
          const isSelected =
            selectedDate && d.getTime() === selectedDate.getTime();

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => handleDayClick(date)}
              className={[
                "day-btn",
                !isCurrentMonth && "other-month",
                isPast && "past-day",
                isToday && !isSelected && "today-btn",
                isSelected && "selected-day",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(DatePicker);
