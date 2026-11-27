// Bundles the React app with esbuild into dist/ (static, GitHub Pages friendly).
// `--serve` starts a local dev server at http://localhost:5173 with rebuild on change.
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const serve = process.argv.includes("--serve");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
cpSync(join(ROOT, "public"), OUT, { recursive: true });

const options = {
  entryPoints: [join(ROOT, "src/main.tsx")],
  bundle: true,
  outfile: join(OUT, "assets/app.js"),
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  minify: !serve,
  sourcemap: serve,
  loader: { ".json": "json" },
  define: { "process.env.NODE_ENV": serve ? '"development"' : '"production"' },
  logLevel: "info",
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: OUT, port: 5173 });
  console.log(`Strategy Lab running at http://localhost:${port}`);
} else {
  await esbuild.build(options);
  cpSync(join(OUT, "index.html"), join(OUT, "404.html"));
  console.log("Built to dist/");
}
