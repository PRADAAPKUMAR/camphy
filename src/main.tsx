import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("PhysicsHQ root element is missing");
}

rootElement.innerHTML = `
  <main class="flex min-h-screen items-center justify-center bg-background text-foreground">
    <p class="text-sm text-muted-foreground">Opening PhysicsHQ…</p>
  </main>
`;

void import("./App.tsx")
  .then(({ default: App }) => {
    createRoot(rootElement).render(<App />);
  })
  .catch((error: unknown) => {
    console.error("PhysicsHQ startup failed", error);
    rootElement.innerHTML = `
      <main class="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <section class="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-lg">
          <h1 class="text-xl font-extrabold">PhysicsHQ could not open</h1>
          <p class="mt-2 text-sm text-muted-foreground">The latest version did not load. Reload the page to try again.</p>
          <button id="startup-reload" type="button" class="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Reload page</button>
        </section>
      </main>
    `;
    document.getElementById("startup-reload")?.addEventListener("click", () => window.location.reload());
  });
