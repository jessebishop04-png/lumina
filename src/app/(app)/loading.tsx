export default function AppLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "min(40vh, 360px)",
      }}
    >
      <div className="spinner" />
    </div>
  );
}
