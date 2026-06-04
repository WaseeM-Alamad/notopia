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

export { to12hr, to24hr, display24as12 };
