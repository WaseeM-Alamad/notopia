const HorizontalLoader = ({ color = "#000000", size = 1, style = {} }) => {
  return (
    <div
      style={{ color: color, transform: `scale(${size})`, ...style }}
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
