# Three Lives — A Field Guide

A research prototype based on Oishi & Westgate's three-dimensional model of
wellbeing (happy / meaningful / psychologically rich). Built with React + Vite.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy: GitHub Pages (recommended for sharing)

This repo includes a GitHub Actions workflow that builds and publishes the
site automatically on every push to `main`.

### One-time setup

1. **Create a new GitHub repo** (e.g. `three-lives`) and push this code:

   ```bash
   git init
   git add .
   git commit -m "Initial prototype"
   git branch -M main
   git remote add origin git@github.com:YOUR_USERNAME/three-lives.git
   git push -u origin main
   ```

2. **Edit `.github/workflows/deploy.yml`**: change `VITE_BASE` to match your
   repo name (with leading and trailing slashes), e.g. `/three-lives/`.

3. **Enable Pages**: GitHub repo → Settings → Pages → Source: **GitHub Actions**.

4. Push any change to `main`. The workflow runs automatically. After ~1 minute,
   your site is live at:

   ```
   https://YOUR_USERNAME.github.io/three-lives/
   ```

5. Share that URL with collaborators.

### After the initial setup

Just push. The site rebuilds automatically. No further config needed.

---

## Deploy: Railway (alternative)

Railway also works, though it's overkill for a static site. From the project
root:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Railway will detect Vite, build, and serve. You'll get a URL like
`three-lives.up.railway.app`. The free tier ($5 credit/month) easily covers
a prototype with light traffic.

---

## References

- Oishi, S., & Westgate, E. C. (2022). A psychologically rich life: Beyond
  happiness and meaning. *Psychological Review, 129*(4), 790–811.
- Oishi, S., & Westgate, E. C. (2025). Psychological richness offers a third
  path to a good life. *Trends in Cognitive Sciences, 29*(11), 1023–1033.
- Oishi, S. (2025). *Life in Three Dimensions.* Doubleday.

GLS-15 scale: Oishi et al. (2024).
