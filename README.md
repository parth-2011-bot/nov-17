# THE PALAK EFFECT

A million compliments. One Palak. A rather questionable machine built to deliver them.

Plain HTML, CSS and JavaScript. No frameworks, no build step, no accounts, no servers.

---

## 1. How to open it

1. Unzip the folder.
2. Double-click `index.html`. It opens in your browser. That's all.

(Optional: for hosting, upload the whole folder to any static host, such as GitHub Pages or Netlify.)

The fonts load from Google Fonts when you're online. Offline, the site quietly falls back to
system fonts and still works.

**Folder layout**

```
index.html            both pages + the introduction text
css/style.css         both themes
js/compliments.js     YOUR FILE: compliments, categories, birthday messages
js/main.js            the machinery (you don't need to touch it)
assets/images/shinchan.png   <- put the sticker here
```

## 2. Replace and add compliments

Open `js/compliments.js`. Each category looks like this:

```js
{
  name: "THE SOFT ONES",
  compliments: [
    "First compliment.",
    "Second compliment.",
  ],
},
```

- **Add**: add a new line of text in quotes, followed by a comma.
- **Replace**: change the text.
- **Remove**: delete the line.
- **Move between categories**: cut the line and paste it into another category.
- Use `'single quotes'` inside a compliment, or write `\"` for a double quote.
- Blank lines and empty categories are skipped. If everything is empty, the site shows a friendly
  "the machine is empty" message instead of breaking.

You can also give a compliment an id (optional):
`{ id: "soft-01", text: "..." }`.

The no-repeat system shows every compliment once before any repeats, then reshuffles on its own.
The discovery counter and the deck are saved in the browser, so a refresh doesn't lose progress.
(To reset them while testing, clear the site's local storage.)

## 3. Create additional categories

In `js/compliments.js`, copy any whole category block, paste it below the others, and change
`name`. It shows up automatically, including in the "narrow it down" filter.
There's a commented-out template at the bottom of the file.

## 4. Edit the introduction

Open `index.html` and find the block marked **EDIT THE INTRODUCTION HERE**. Change the words
inside the `<p>` tags and keep the class names (`line-lead`, `line-punch`, `line-close`).

The handwritten margin notes in the light theme are the `annot` lines; edit or delete them freely.

## 5. Change the birthday message

In `js/compliments.js`, at the top, under `SETTINGS`:

- `birthdayGreeting`: short line on the intro page
- `birthdayMessage`: the main message above the generator
- `birthdaySurprise`: the hidden gift that opens with confetti

The date and timezone (`month: 11, day: 20, "Asia/Kolkata"`) are in the same place.

How it behaves, always in IST regardless of where she's browsing from:

- Before Nov 20: counts down to Nov 20 at 00:00 IST.
- On Nov 20: birthday mode (bunting in the light theme, gold glow and twinkles in the dark theme,
  the birthday message, the gift). The generator keeps working.
- From Nov 21: counts down to next Nov 20.

**Preview birthday mode without waiting:**

- `index.html?preview=birthday` shows birthday mode.
- `index.html?now=2026-11-19T23:59:50+05:30` pretends it's that moment and keeps ticking.

## 6. Where the Shinchan image goes

Put the file at:

```
assets/images/shinchan.png
```

It appears as a small sticker on both pages in both themes. A transparent PNG looks best.
If the file isn't there, the sticker is simply hidden and nothing breaks.

## 7. The two themes

The toggle (top right, both pages) switches between two complete templates:

- **Light: The Original Effect.** Scrapbook paper, tape, handwritten notes, a torn slip for the compliment.
- **Dark: The After-Hours Effect.** A framed, typewritten machine with a mechanical counter and a typewriter reveal.

Switching keeps the current compliment, the discovered count and the deck exactly as they were.
The chosen theme is remembered across refreshes.
