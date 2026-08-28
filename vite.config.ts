import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || /node_modules\/(react|scheduler)\//.test(id)) return "react-vendor";
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("katex")) return "katex";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          const radix = id.match(/@radix-ui\/([^/]+)/);
          if (radix) return `radix-${radix[1]}`;
          return "vendor";
        },
      },
    },
  },
}));
