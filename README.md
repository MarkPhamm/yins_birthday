# Yến — 23rd Birthday Letter

A static birthday letter site for Yến, meant to be opened on a phone and hosted on GitHub Pages.

## Local preview

From the project root:

```bash
# Python
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Then open [http://localhost:8080](http://localhost:8080).

## GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`.
5. Save, then wait a minute for the site URL to appear.

The site uses relative paths (`index.html`, `styles.css`, `script.js`, `images/...`), so it works at the repository root URL.

## Structure

- `index.html` — envelope open + hero + letter
- `styles.css` — blush/sage theme, paper letter, petals/hearts
- `script.js` — open animation, ambient petals, scroll reveals
- `images/23_birthday/` — photos and birthday clip
