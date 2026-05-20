import { useState, useRef, useEffect } from "react";

function parseTime(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am?|pm?)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3] || null;

  if (min < 0 || min > 59) return null;

  if (suffix === "am" || suffix === "a") {
    if (hour > 12) return null;
    if (hour === 12) hour = 0;
  } else if (suffix === "pm" || suffix === "p") {
    if (hour > 12) return null;
    if (hour !== 12) hour += 12;
  } else {
    if (hour < 0 || hour > 23) return null;
  }

  return { hour, min };
}

function to12hr({ hour, min }) {
  const display12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${display12}:${String(min).padStart(2, "0")} ${period}`;
}

function to24hr({ hour, min }) {
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function display24as12(value24) {
  if (!value24) return "";
  const [h, m] = value24.split(":").map(Number);
  return to12hr({ hour: h, min: m });
}

export default function TimeInput({
  value,
  onChange,
  setTimeRef,
  placeholder = "Add a time",
  selectedOption,
  inputRef,
  setIsInputValid,
}) {
  const [draft, setDraft] = useState(display24as12(value));

  const commit = (secondary) => {
    const time = secondary ?? draft;
    const parsed = parseTime(time);
    if (parsed) {
      setDraft(to12hr(parsed));
      onChange?.(to24hr(parsed));
      setIsInputValid(true);
    } else {
      onChange?.("");
      setIsInputValid(false);
    }
  };

  useEffect(() => {
    commit(value);
  }, []);

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      commit();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setDraft(display24as12(value));
      inputRef.current?.blur();
    }
  };

  const setTime = (time) => {
    const [h, m] = time.split(":").map(Number);
    setDraft(to12hr({ hour: h, min: m }));
  };

  useEffect(() => {
    setTimeRef.current = setTime;
  }, [setTime]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        width: "100%",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        className="select-input time-input"
        style={{
          cursor: "pointer",
          backgroundColor: "transparent",
          borderColor: selectedOption?.disabled ? "var(--error)" : "",
        }}
        onBlur={() => commit()}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
