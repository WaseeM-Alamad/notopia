const HorizontalLoader = ({ color = "#000000", size = 1 }) => {
  return (
    <div
      style={{ color: color, transform: `scale(${size})` }}
      className="lds-ellipsis"
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default HorizontalLoader;
