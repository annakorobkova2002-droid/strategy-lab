# Deployment (GitHub Pages)

1. Push this repository to GitHub (branch `main`).
2. In the repository: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
3. Open the **Actions** tab. The workflow *Test and deploy to GitHub Pages* runs validate → tests → type check → build → deploy.
4. When it finishes, the site is live at `https://<your-username>.github.io/strategy-lab/`.

Every later push to `main` redeploys automatically.

## Notes
- The app uses hash routing (`#/lectures/S05`), so it works on Pages without server rewrites.
- All asset paths are relative, so the site works under the `/strategy-lab/` sub-path.
- Progress is stored per browser (localStorage). Use **Settings → Export progress** to move it between devices.
- GitHub Pages from a **private** repository requires a paid GitHub plan. The repository contains only original summaries, so a public repository is fine.

## Troubleshooting
- **The workflow fails at "Validate content"**: a question or lecture file has an error; the log lists it.
- **The page is blank**: open the browser console. Check that Pages is set to "GitHub Actions" and that the deploy job succeeded.
