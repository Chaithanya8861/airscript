import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/airscript/",
  server: {
    // Camera access requires a secure context. localhost is exempt from
    // needing HTTPS, but if you test on your phone over LAN you'll need
    // to run vite with --https or use a tool like ngrok.
    host: true,
  },
});