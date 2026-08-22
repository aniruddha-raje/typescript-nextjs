import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Only the pure logic in src/lib is covered for now; component tests would
    // need a DOM environment and are deliberately out of scope.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
