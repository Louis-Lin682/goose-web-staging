const BackgroundWatermark = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <img
        src="/image/goose-bg.png"
        alt=""
        className="absolute left-1/2 top-1/2 h-[100lvh] w-[100lvw] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover md:object-fill opacity-[0.05] grayscale will-change-transform"
      />
    </div>
  );
};

export default BackgroundWatermark;
