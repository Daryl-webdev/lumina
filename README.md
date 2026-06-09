# Lumina Atelier — UI Clone

A static UI clone of the Lumina jewelry demo. Built with vanilla HTML, CSS, and JavaScript — no build step required.

## Run

Simply open `index.html` in a browser, or serve the folder with any static server:

```powershell
# Option 1: Python
python -m http.server 8080

# Option 2: Node (if you have npx)
npx serve .
```

Then visit http://localhost:8080.

## Structure

```
Lumina/
├── index.html        # Page markup
├── css/style.css     # Styling (typography, layout, components)
├── js/main.js        # Product data, catalog/highlights rendering, cart logic
└── README.md
```

## What's implemented

- Sticky header with brand, navigation, cart icon (with counter), menu button
- Hero section with eyebrow tag, large serif headline, description, CTA
- Catalog carousel with 10 products and prev/next controls
- Featured Highlights grid (filtered by `highlight: true`)
- Slide-in cart drawer with add/remove, subtotal/total, checkout button
- Toast notification on add-to-cart
- Dark footer with four columns
- Responsive layout (mobile, tablet, desktop)

## Customizing

Edit the `products` array in [js/main.js](js/main.js) to add/remove items or toggle the `highlight` flag.

Color palette and fonts live at the top of [css/style.css](css/style.css):

- Background: `#faf6ef`
- Accent (gold): `#b08b5b`
- Text: `#1a1a1a`
- Fonts: Cormorant Garamond (display) + Inter (body)
