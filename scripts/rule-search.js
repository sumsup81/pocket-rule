/**
 * Pocket Rule
 * Search engine
 *
 * Rule data is supplied by rules-glossary.json.
 * This file contains search logic only.
 */


/* ------------------------------------------------------------ */
/*  NORMALIZE TEXT                                              */
/* ------------------------------------------------------------ */

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

function spellingDistance(a, b) {

  a = normalizeText(a);
  b = normalizeText(b);

  const rows =
    a.length + 1;

  const columns =
    b.length + 1;

  const matrix =
    Array.from(
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


      matrix[i][j] =
        Math.min(

          matrix[i - 1][j] + 1,

          matrix[i][j - 1] + 1,

          matrix[i - 1][j - 1] + cost
        );


      /*
       * Handle accidentally swapped letters.
       *
       * Example:
       * "teh" instead of "the"
       */

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {

        matrix[i][j] =
          Math.min(
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

function fuzzyWordScore(
  query,
  candidate
) {

  query =
    normalizeText(query);

  candidate =
    normalizeText(candidate);


  if (!query || !candidate) {
    return 0;
  }


  const candidates = [
    candidate,
    ...candidate.split(" ")
  ];


  let bestScore = 0;


  for (const value of candidates) {

    const distance =
      spellingDistance(
        query,
        value
      );


    const allowedDistance =
      Math.max(
        1,
        Math.ceil(
          query.length * 0.25
        )
      );


    if (
      distance >
      allowedDistance
    ) {
      continue;
    }


    const score =
      400 -
      (distance * 50);


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

function scoreRule(
  query,
  rule
) {

  const q =
    normalizeText(query);


  if (!q) {
    return 0;
  }


  const name =
    normalizeText(
      rule.name
    );


  const aliases =
    (rule.aliases ?? [])
      .map(normalizeText);


  const keywords =
    (rule.keywords ?? [])
      .map(normalizeText);


  const preview =
    normalizeText(
      rule.preview ?? ""
    );


  /* Exact official name */

  if (name === q) {
    return 1000;
  }


  /* Exact alias */

  if (aliases.includes(q)) {
    return 950;
  }


  /* Official name starts with input */

  if (name.startsWith(q)) {
    return 900;
  }


  /* Alias starts with input */

  if (
    aliases.some(
      alias =>
        alias.startsWith(q)
    )
  ) {
    return 850;
  }


  /* Input appears in official name */

  if (name.includes(q)) {
    return 800;
  }


  /* Input appears in alias */

  if (
    aliases.some(
      alias =>
        alias.includes(q)
    )
  ) {
    return 750;
  }


  /* Exact keyword */

  if (keywords.includes(q)) {
    return 700;
  }


  /* Keyword begins with input */

  if (
    keywords.some(
      keyword =>
        keyword.startsWith(q)
    )
  ) {
    return 650;
  }


  /* Preview-text match */

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


  for (
    const candidate
    of fuzzyCandidates
  ) {

    fuzzyScore =
      Math.max(
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
  rules = [],
  limit = 4
) {

  const normalizedQuery =
    normalizeText(query);


  if (
    !normalizedQuery ||
    !Array.isArray(rules)
  ) {

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

        if (
          b.score !==
          a.score
        ) {

          return (
            b.score -
            a.score
          );
        }


        return (
          a.rule.name.localeCompare(
            b.rule.name
          )
        );
      }
    )
    .slice(
      0,
      limit
    )
    .map(
      result =>
        result.rule
    );
}


/* ------------------------------------------------------------ */
/*  SEARCH CONTROLLER                                           */
/* ------------------------------------------------------------ */

export class PocketRuleSearch {

  constructor({
    input,
    results,
    rules = [],
    onSelect
  }) {

    this.input =
      input;

    this.results =
      results;

    this.rules =
      rules;

    this.onSelect =
      onSelect;


    this._handleInput =
      this._handleInput.bind(this);


    this._handleKeyDown =
      this._handleKeyDown.bind(this);
  }


  /* ---------------------------------------------------------- */
  /*  ACTIVATE                                                  */
  /* ---------------------------------------------------------- */

  activate() {

    if (
      !this.input ||
      !this.results
    ) {

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
      searchRules(
        query,
        this.rules
      );


    this.renderMatches(
      query,
      matches
    );
  }


  /* ---------------------------------------------------------- */
  /*  KEYBOARD                                                  */
  /* ---------------------------------------------------------- */

  _handleKeyDown(event) {

    if (
      event.key !==
      "Enter"
    ) {

      return;
    }


    const query =
      this.input.value;


    const matches =
      searchRules(
        query,
        this.rules
      );


    const first =
      matches[0];


    if (!first) {
      return;
    }


    event.preventDefault();


    this.selectRule(
      first
    );
  }


  /* ---------------------------------------------------------- */
  /*  WELCOME                                                   */
  /* ---------------------------------------------------------- */

  renderWelcome() {

    this.results
      .replaceChildren();


    const welcome =
      document.createElement(
        "div"
      );


    welcome.className =
      "pocket-rule-welcome";


    const icon =
      document.createElement(
        "i"
      );


    icon.className =
      "fa-solid fa-book-open pocket-rule-welcome-icon";


    const title =
      document.createElement(
        "div"
      );


    title.className =
      "pocket-rule-welcome-title";


    title.textContent =
      "Pocket Rule";


    const text =
      document.createElement(
        "div"
      );


    text.className =
      "pocket-rule-welcome-text";


    text.textContent =
      "Type a rule, condition, action, or keyword.";


    welcome.append(
      icon,
      title,
      text
    );


    this.results.append(
      welcome
    );
  }


  /* ---------------------------------------------------------- */
  /*  NO RESULTS                                                */
  /* ---------------------------------------------------------- */

  renderNoResults(query) {

    this.results
      .replaceChildren();


    const welcome =
      document.createElement(
        "div"
      );


    welcome.className =
      "pocket-rule-welcome";


    const icon =
      document.createElement(
        "i"
      );


    icon.className =
      "fa-solid fa-magnifying-glass pocket-rule-welcome-icon";


    const title =
      document.createElement(
        "div"
      );


    title.className =
      "pocket-rule-welcome-title";


    title.textContent =
      "No matching rule";


    const text =
      document.createElement(
        "div"
      );


    text.className =
      "pocket-rule-welcome-text";


    text.textContent =
      `Nothing close to "${query}" was found.`;


    welcome.append(
      icon,
      title,
      text
    );


    this.results.append(
      welcome
    );
  }


  /* ---------------------------------------------------------- */
  /*  RESULTS                                                   */
  /* ---------------------------------------------------------- */

  renderMatches(
    query,
    matches
  ) {

    this.results
      .replaceChildren();


    if (!matches.length) {

      this.renderNoResults(
        query
      );

      return;
    }


    for (
      const rule
      of matches
    ) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "pocket-rule-card";


      card.tabIndex =
        0;


      card.dataset.ruleId =
        rule.id;


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "pocket-rule-card-header";


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "pocket-rule-card-title";


      const icon =
        document.createElement(
          "i"
        );


      icon.className =
        rule.icon ??
        "fa-solid fa-book-open";


      icon.style.marginRight =
        "7px";


      const name =
        document.createElement(
          "span"
        );


      name.textContent =
        rule.name;


      title.append(
        icon,
        name
      );


      const category =
        document.createElement(
          "div"
        );


      category.className =
        "pocket-rule-card-category";


      category.textContent =
        rule.category ??
        "Rule";


      header.append(
        title,
        category
      );


      const preview =
        document.createElement(
          "div"
        );


      preview.className =
        "pocket-rule-card-preview";


      preview.textContent =
        rule.preview ?? "";


      card.append(
        header,
        preview
      );


      card.addEventListener(
        "click",
        () =>
          this.selectRule(
            rule
          )
      );


      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
              "Enter" ||
            event.key ===
              " "
          ) {

            event.preventDefault();

            this.selectRule(
              rule
            );
          }
        }
      );


      this.results.append(
        card
      );
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

      this.onSelect(
        rule
      );
    }
  }
}
