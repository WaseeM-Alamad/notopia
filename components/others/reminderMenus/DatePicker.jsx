import { useState } from "react";

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

export default function DatePicker({ onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build a full 6-row grid (42 cells) always filled with dates
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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
    <div style={s.card}>
      <div style={s.monthNav}>
        <button
          style={s.navBtn}
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
        <span style={s.monthLabel}>
          {MONTHS[month]} {year}
        </span>
        <button
          style={s.navBtn}
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

      <div style={s.dowRow}>
        {DAYS.map((d) => (
          <div key={d} style={s.dow}>
            {d}
          </div>
        ))}
      </div>

      <div style={s.daysGrid}>
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
              style={{
                ...s.dayBtn,
                ...(!isCurrentMonth ? s.otherMonth : {}),
                ...(isPast ? s.pastDay : {}),
                ...(isToday && !isSelected ? s.todayBtn : {}),
                ...(isSelected ? s.selectedDay : {}),
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  card: {
    // position: "absolute",
    zIndex: "10",
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderTop: "1px solid var(--focus-border)",
    borderBottomLeftRadius: ".7rem",
    borderBottomRightRadius: ".7rem",
    boxShadow: "0 4px 20px 0px 0px 12px -10px var(--shadow)",
    width: "100%",
    boxSizing: "border-box",
    padding: ".8rem",
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  navBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "6px",
    color: "var(--text3)",
    display: "flex",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text)",
  },
  dowRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "4px",
  },
  dow: {
    textAlign: "center",
    fontSize: "11px",
    color: "var(--text)",
    fontWeight: "550",
    padding: "4px 0",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  dayBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "13px",
    color: "var(--text)",
    height: "25px",
    width: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    fontFamily: "inherit",
    transition: "background 0.1s",
  },
  otherMonth: {
    opacity: "0.6",
  },
  pastDay: {
    opacity: ".35",
    cursor: "default",
    pointerEvents: "none",
  },
  todayBtn: {
    border: "1px solid #3b82f6",
    color: "#2563eb",
    fontWeight: "500",
  },
  selectedDay: {
    background: "#2563eb",
    color: "#fff",
    fontWeight: "500",
    border: "none",
  },
};
