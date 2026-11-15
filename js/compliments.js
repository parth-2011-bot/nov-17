/* ==========================================================================
   THE PALAK EFFECT : the file you edit.

   You never need to touch main.js. Everything personal lives here:
     1. SETTINGS (birthday date, birthday messages)
     2. COMPLIMENT_CATEGORIES (the compliments themselves)

   Tips
   - Every compliment is just a line of text inside quotes, followed by a comma.
   - If your compliment contains a double quote ("), either use a single
     quote (') instead, or write it as \"  (backslash first).
   - Typographic apostrophes (’) and quotes (“ ”) are fine.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. SETTINGS
   -------------------------------------------------------------------------- */
window.PALAK_SETTINGS = {

  // The birthday. The site always uses this timezone, wherever the visitor is.
  birthday: { month: 11, day: 20, timezone: "Asia/Kolkata" },

  // Small line shown at the top of the intro page on the birthday.
  birthdayGreeting: "Happy birthday, Palak.",

  // The main birthday message (shown above the generator on November 20).
  birthdayMessage:
    "Happy birthday, Palak. The machine has been running overtime for this one. " +
    "Also everything machine says is true btw.",

  // The tiny birthday-only surprise (opens when she taps the little gift).
  birthdaySurprise:
    "Surprise: there is no nothing here " +
    "there are more where those came from. Happy birthday, Palak.",
};


/* --------------------------------------------------------------------------
   2. COMPLIMENTS

   Structure:

   { name: "CATEGORY NAME",
     compliments: [
       "A plain compliment.",
       { id: "optional-id", text: "A compliment with an optional id." },
     ]
   },

   - Add a compliment : add a new line inside a category's compliments [ ].
   - Remove one       : delete its line.
   - Move one         : cut the line, paste it into another category.
   - New category     : copy a whole { name: ..., compliments: [ ... ] } block,
                        paste it below, change the name. It appears on the
                        site (and in "narrow it down") automatically.
   - Empty categories are simply skipped, and an empty list is fine too.

   The ids are optional. If you leave them out, the site makes its own.
   -------------------------------------------------------------------------- */
window.COMPLIMENT_CATEGORIES = [

  {
    name: "THE OBVIOUS ONES",
    compliments: [
      "You make rooms feel easier to be in.",
      "You're the kind of person people are quietly glad to see walk in.",
      "Your presence is a genuinely good thing.",
    ],
  },

  {
    name: "ODDLY SPECIFIC",
    compliments: [
      "The exact face you make right before saying something unexpectedly funny deserves its own documentary.",
      "Your genrator jaisi hasi lowkey nice",
      "You look so pretty when you cry (i am not saying that you should cry btw its a refrence to something you told me) .",
    ],
  },

  {
    name: "THE SCIENCE DEPARTMENT",
    compliments: [
      "Scientifically speaking, you are element number 35: rare, reactive, and posionous(just kidding).",
      "If not being serious were a licensed profession, you would be dangerously overqualified(its a good thing btw).",
      "The Science Department reviewed your file and concluded 'a lot, in the best way'..",
    ],
  },

  {
    name: "THE random ONES",
    compliments: [
      "You are the best tsundere btw .",
      "Crazyy how you could the most unserious and the most caring person both",
      "The world is a gentler place with you in it.",
    ],
  },

  {
    name: "UNNECESSARILY DRAMATIC",
    compliments: [
      "O, thou celestial catastrophe, how dost thou manage to be so devastatingly magnificent whilst possessing absolutely no awareness of the chaos thou inflicteth upon the hearts of mere mortals?",
      "Had Shakespeare laid eyes upon thee, he would've abandoned every tragedy, for no written sorrow could rival the unbearable beauty of thy existence.",
      "By the heavens above, thou art a walking contradiction — an absolute menace to society, yet somehow the finest creation the universe hath ever dared to produce..",
    ],
  },

  /* Want another category? Copy this block, remove the comment marks, edit it.

  {
    name: "MY NEW CATEGORY",
    compliments: [
      "First compliment.",
      "Second compliment.",
    ],
  },

  */
];
