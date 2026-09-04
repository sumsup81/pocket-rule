/**
 * Pocket Rule
 * Search engine
 *
 * This file is responsible for:
 * - Normalizing search text
 * - Ranking exact and partial matches
 * - Handling common aliases
 * - Handling small spelling mistakes
 * - Rendering up to four result cards
 */


/* ------------------------------------------------------------ */
/*  TEMPORARY TEST DATA                                         */
/*                                                              */
/*  These are NOT our final rules.                              */
/*  They only exist so we can test the search engine.           */
/* ------------------------------------------------------------ */

export const SAMPLE_RULES = [
  {
    id: "grappled",
    name: "Grappled",
    category: "Condition",
    icon: "fa-solid fa-hand",
    aliases: [
      "grapple",
      "grappling"
    ],
    keywords: [
      "movement",
      "speed",
      "condition",
      "grab"
    ],
    preview: "A condition associated with grappling and movement."
  },

  {
    id: "concentration",
    name: "Concentration",
    category: "Magic",
    icon: "fa-solid fa-brain",
    aliases: [
      "concentrating",
      "spell concentration"
    ],
    keywords: [
      "spell",
      "magic",
      "saving throw"
    ],
    preview: "Rules for maintaining certain spells and magical effects."
  },

  {
    id: "opportunity-attack",
    name: "Opportunity Attack",
    category: "Combat",
    icon: "fa-solid fa-crosshairs",
    aliases: [
      "attack of opportunity",
      "opportunity attacks",
      "reaction attack"
    ],
    keywords: [
      "reaction",
      "combat",
      "movement",
      "melee"
    ],
    preview: "A reaction associated with an enemy moving away from you."
  },

  {
    id: "ability-check",
    name: "Ability Check",
    category: "D20 Test",
    icon: "fa-solid fa-dice-d20",
    aliases: [
      "skill check",
      "ability checks",
      "skill checks"
    ],
    keywords: [
      "ability",
      "skill",
      "check",
      "d20"
    ],
    preview: "A D20 Test used when a creature attempts an uncertain task."
  },

  {
    id: "prone",
    name: "Prone",
    category: "Condition",
    icon: "fa-solid fa-person",
    aliases: [
      "knocked down",
      "lying down"
    ],
    keywords: [
      "condition",
      "ground",
      "movement"
    ],
    preview: "A condition associated with being down on the ground."
  },

  {
    id: "cover",
    name: "Cover",
    category: "Combat",
    icon: "fa-solid fa-shield-halved",
    aliases: [
      "half cover",
      "three quarters cover",
      "total cover"
    ],
    keywords: [
      "armor class",
      "ac",
      "dexterity",
      "obstacle"
    ],
    preview: "Rules for protection provided by creatures and obstacles."
  },

  {
    id: "hide",
    name: "Hide",
    category: "Action",
    icon: "fa-solid fa-eye-slash",
    aliases: [
      "hiding",
      "stealth",
      "hide action"
    ],
    keywords: [
      "hidden",
      "stealth",
      "action",
      "concealment"
    ],
    preview: "The action used when attempting to conceal yourself."
  },

  {
    id: "short-rest",
    name: "Short Rest",
    category: "Rest",
    icon: "fa-solid fa-bed",
    aliases: [
      "short rests",
      "rest"
    ],
    keywords: [
      "healing",
      "hit dice",
      "recovery"
    ],
    preview: "A period of downtime used for certain kinds of recovery."
  },

  {
    id: "death-saving-throw",
    name: "Death Saving Throw",
    category: "D20 Test",
    icon: "fa-solid fa-skull",
    aliases: [
      "death save",
      "death saves",
      "death saving throws"
    ],
    keywords: [
      "dying",
      "unconscious",
      "death",
      "save"
    ],
    preview: "A special saving throw associated with being at 0 Hit Points."
  },

  {
    id: "unarmed-strike",
    name: "Unarmed Strike",
    category: "Combat",
    icon: "fa-solid fa-hand-fist",
    aliases: [
      "punch",
      "unarmed attack",
      "unarmed strikes"
    ],
    keywords: [
      "attack",
      "grapple",
      "shove",
      "combat"
    ],
    preview: "An attack made without a weapon."
  }
];


/* ------------------------------------------------------------ */
/*  NORMALIZE TEXT                                              */
/* ------------------------------------------------------------ */

/**
 * Search engines should not care about capitalization,
 * punctuation, or accidental extra spaces.
 *
 * Example:
 *
 * "Opportunity-Attack!"
 *
 * becomes:
 *
 * "opportunity attack"
 */

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/* ------------------------------------------------------------ */
/*  SPELLING DISTANCE                                           */
/* ------------------------------------------------------------ */

/**
 * Damerau-Levenshtein distance.
 *
 * This measures how different two words are.
 *
 * Examples:
 *
 * grapple
 * grapel
 *
 * are very close.
 *
 * concentration
 * concetration
 *
 * are also very close.
 *
 * It also understands accidentally swapping two letters.
 */

function spellingDistance(a, b) {

  a = normalizeText(a);
  b = normalizeText(b);

  const rows = a.length + 1;
  const columns = b.length + 1;

  const matrix = Array.from(
    { length: rows },
    () => Array(columns).fill(0)
  );

  for (let i = 0; i < rows; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < columns; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {

    for (let j = 1; j < columns; j++) {

      const cost =
        a[i - 1] === b[j - 1]
          ? 0
          : 1;

      matrix[i][j] = Math.min(

        matrix[i - 1][j] + 1,

        matrix[i][j - 1] + 1,

        matrix[i - 1][j - 1] + cost
      );

      /*
       * Detect transposed letters.
       *
       * Example:
       *
       * "teh"
       * "the"
       */

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {

        matrix[i][j] = Math.min(
          matrix[i][j],
          matrix[i - 2][j - 2] + 1
        );
      }
    }
  }

  return matrix[a.length][b.length];
}


/* ------------------------------------------------------------ */
/*  FUZZY WORD SCORE                                            */
/* ------------------------------------------------------------ */

function fuzzyWordScore(query, candidate) {

  query = normalizeText(query);
  candidate = normalizeText(candidate);

  if (!query || !candidate) return 0;

  /*
   * Compare against the complete phrase AND every individual
   * word inside the phrase.
   */

  const candidates = [
    candidate,
    ...candidate.split(" ")
  ];

  let bestScore = 0;

  for (const value of candidates) {

    const distance = spellingDistance(
      query,
      value
    );

    const allowedDistance =
      Math.max(
        1,
        Math.ceil(query.length * 0.25)
      );

    if (distance > allowedDistance) {
      continue;
    }

    const score =
      400 - (distance * 50);

    bestScore =
      Math.max(
        bestScore,
        score
      );
  }

  return bestScore;
}


/* ------------------------------------------------------------ */
/*  SCORE ONE RULE                                              */
/* ------------------------------------------------------------ */

function scoreRule(query, rule) {

  const q = normalizeText(query);

  if (!q) return 0;

  const name =
    normalizeText(rule.name);

  const aliases =
    (rule.aliases ?? [])
      .map(normalizeText);

  const keywords =
    (rule.keywords ?? [])
      .map(normalizeText);

  const preview =
    normalizeText(rule.preview ?? "");


  /* Exact official name */

  if (name === q) {
    return 1000;
  }


  /* Exact alias */

  if (aliases.includes(q)) {
    return 950;
  }


  /* Official name begins with what was typed */

  if (name.startsWith(q)) {
    return 900;
  }


  /* Alias begins with what was typed */

  if (
    aliases.some(
      alias => alias.startsWith(q)
    )
  ) {
    return 850;
  }


  /* Search appears inside official name */

  if (name.includes(q)) {
    return 800;
  }


  /* Search appears inside an alias */

  if (
    aliases.some(
      alias => alias.includes(q)
    )
  ) {
    return 750;
  }


  /* Exact keyword */

  if (keywords.includes(q)) {
    return 700;
  }


  /* Keyword begins with search */

  if (
    keywords.some(
      keyword => keyword.startsWith(q)
    )
  ) {
    return 650;
  }


  /* Search appears in preview text */

  if (preview.includes(q)) {
    return 500;
  }


  /* ---------------------------------------------------------- */
  /*  FUZZY SPELLING                                            */
  /* ---------------------------------------------------------- */

  const fuzzyCandidates = [
    name,
    ...aliases,
    ...keywords
  ];

  let fuzzyScore = 0;

  for (const candidate of fuzzyCandidates) {

    fuzzyScore = Math.max(
      fuzzyScore,
      fuzzyWordScore(
        q,
        candidate
      )
    );
  }

  return fuzzyScore;
}


/* ------------------------------------------------------------ */
/*  SEARCH RULES                                                */
/* ------------------------------------------------------------ */

export function searchRules(
  query,
  rules = SAMPLE_RULES,
  limit = 4
) {

  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  return rules
    .map(rule => ({
      rule,
      score:
        scoreRule(
          normalizedQuery,
          rule
        )
    }))
    .filter(
      result =>
        result.score > 0
    )
    .sort(
      (a, b) => {

        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.rule.name.localeCompare(
          b.rule.name
        );
      }
    )
    .slice(0, limit)
    .map(
      result => result.rule
    );
}


/* ------------------------------------------------------------ */
/*  SEARCH CONTROLLER                                           */
/* ------------------------------------------------------------ */

export class PocketRuleSearch {

  constructor({
    input,
    results,
    onSelect
  }) {

    this.input = input;

    this.results = results;

    this.onSelect = onSelect;

    this._handleInput =
      this._handleInput.bind(this);

    this._handleKeyDown =
      this._handleKeyDown.bind(this);
  }


  /* ---------------------------------------------------------- */
  /*  ACTIVATE                                                  */
  /* ---------------------------------------------------------- */

  activate() {

    if (!this.input || !this.results) {
      return;
    }

    this.input.addEventListener(
      "input",
      this._handleInput
    );

    this.input.addEventListener(
      "keydown",
      this._handleKeyDown
    );

    this.renderWelcome();
  }


  /* ---------------------------------------------------------- */
  /*  INPUT                                                     */
  /* ---------------------------------------------------------- */

  _handleInput() {

    const query =
      this.input.value;

    if (!query.trim()) {

      this.renderWelcome();

      return;
    }

    const matches =
      searchRules(query);

    this.renderMatches(
      query,
      matches
    );
  }


  /* ---------------------------------------------------------- */
  /*  KEYBOARD                                                  */
  /* ---------------------------------------------------------- */

  _handleKeyDown(event) {

    /*
     * For our first test:
     *
     * ENTER opens the first search result.
     *
     * Arrow-key navigation will be added after we know
     * the basic search engine is stable.
     */

    if (event.key !== "Enter") {
      return;
    }

    const query =
      this.input.value;

    const matches =
      searchRules(query);

    const first =
      matches[0];

    if (!first) {
      return;
    }

    event.preventDefault();

    this.selectRule(first);
  }


  /* ---------------------------------------------------------- */
  /*  WELCOME                                                   */
  /* ---------------------------------------------------------- */

  renderWelcome() {

    this.results.replaceChildren();

    const welcome =
      document.createElement("div");

    welcome.className =
      "pocket-rule-welcome";

    const icon =
      document.createElement("i");

    icon.className =
      "fa-solid fa-book-open pocket-rule-welcome-icon";

    const title =
      document.createElement("div");

    title.className =
      "pocket-rule-welcome-title";

    title.textContent =
      "Pocket Rule";

    const text =
      document.createElement("div");

    text.className =
      "pocket-rule-welcome-text";

    text.textContent =
      "Type a rule, condition, action, or keyword.";

    welcome.append(
      icon,
      title,
      text
    );

    this.results.append(welcome);
  }


  /* ---------------------------------------------------------- */
  /*  NO RESULTS                                                */
  /* ---------------------------------------------------------- */

  renderNoResults(query) {

    this.results.replaceChildren();

    const welcome =
      document.createElement("div");

    welcome.className =
      "pocket-rule-welcome";

    const icon =
      document.createElement("i");

    icon.className =
      "fa-solid fa-magnifying-glass pocket-rule-welcome-icon";

    const title =
      document.createElement("div");

    title.className =
      "pocket-rule-welcome-title";

    title.textContent =
      "No matching rule";

    const text =
      document.createElement("div");

    text.className =
      "pocket-rule-welcome-text";

    text.textContent =
      `Nothing close to "${query}" was found.`;

    welcome.append(
      icon,
      title,
      text
    );

    this.results.append(welcome);
  }


  /* ---------------------------------------------------------- */
  /*  RESULTS                                                   */
  /* ---------------------------------------------------------- */

  renderMatches(
    query,
    matches
  ) {

    this.results.replaceChildren();

    if (!matches.length) {

      this.renderNoResults(query);

      return;
    }

    for (const rule of matches) {

      const card =
        document.createElement("div");

      card.className =
        "pocket-rule-card";

      card.tabIndex = 0;

      card.dataset.ruleId =
        rule.id;


      /* Header */

      const header =
        document.createElement("div");

      header.className =
        "pocket-rule-card-header";


      /* Title */

      const title =
        document.createElement("div");

      title.className =
        "pocket-rule-card-title";


      const icon =
        document.createElement("i");

      icon.className =
        rule.icon ??
        "fa-solid fa-book-open";

      icon.style.marginRight =
        "7px";


      const name =
        document.createElement("span");

      name.textContent =
        rule.name;


      title.append(
        icon,
        name
      );


      /* Category */

      const category =
        document.createElement("div");

      category.className =
        "pocket-rule-card-category";

      category.textContent =
        rule.category ?? "Rule";


      header.append(
        title,
        category
      );


      /* Preview */

      const preview =
        document.createElement("div");

      preview.className =
        "pocket-rule-card-preview";

      preview.textContent =
        rule.preview ?? "";


      card.append(
        header,
        preview
      );


      /* Mouse click */

      card.addEventListener(
        "click",
        () => this.selectRule(rule)
      );


      /* Keyboard accessibility */

      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            this.selectRule(rule);
          }
        }
      );


      this.results.append(card);
    }
  }


  /* ---------------------------------------------------------- */
  /*  SELECT RULE                                               */
  /* ---------------------------------------------------------- */

  selectRule(rule) {

    if (
      typeof this.onSelect ===
      "function"
    ) {

      this.onSelect(rule);
    }
  }
}
