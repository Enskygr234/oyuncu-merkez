import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./": aynı derleme hem GitHub Pages alt klasöründe hem APK içinde çalışsın
export default defineConfig({
  base: "./",
  plugins: [react()],
});
