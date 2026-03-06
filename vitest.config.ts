import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./src/tests/setupTests.ts"],
  },
})