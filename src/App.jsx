import HandTracker from "./components/HandTracker.jsx";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <h1 style={{ fontFamily: "sans-serif", color: "#f9fafb", margin: 0 }}>
        AirScript <span style={{ color: "#22d3ee" }}>· Phase 1&ndash;3</span>
      </h1>
      <HandTracker />
    </div>
  );
}
