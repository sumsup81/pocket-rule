/**
 * Pocket Rule
 * Rule viewer helpers
 */

import {
  SAMPLE_RULES
} from "./rule-search.js";


/* ------------------------------------------------------------ */
/*  FIND A RULE                                                 */
/* ------------------------------------------------------------ */

export function getRuleById(
  id,
  rules = SAMPLE_RULES
) {

  return rules.find(
    rule => rule.id === id
  ) ?? null;
}


/* ------------------------------------------------------------ */
/*  SIMPLE TERM NORMALIZATION                                   */
/* ------------------------------------------------------------ */

function normalizeTerm(value = "") {

  return String(value)
    .toLowerCase()
    .trim();
}


/* ------------------------------------------------------------ */
/*  INFER RELATED RULES                                         */
/*                                                              */
/*  Our final SRD database will contain deliberate related-rule */
/*  links. For our test data, this can infer sensible links by  */
/*  comparing keywords.                                        */
/* ------------------------------------------------------------ */

function inferRelatedRules(
  rule,
  rules = SAMPLE_RULES,
  limit = 3
) {

  const sourceTerms =
    new Set(
      [
        ...(rule.keywords ?? []),
        ...(rule.aliases ?? [])
      ].map(normalizeTerm)
    );


  return rules
    .filter(
      candidate =>
        candidate.id !== rule.id
    )
    .map(candidate => {

      const candidateTerms = [
        ...(candidate.keywords ?? []),
        ...(candidate.aliases ?? [])
      ].map(normalizeTerm);


      let score = 0;


      for (const term of candidateTerms) {

        if (sourceTerms.has(term)) {
          score += 2;
        }
      }


      /*
       * Give a small bonus when the name of one rule
       * appears among another rule's keywords/aliases.
       */

      const ruleName =
        normalizeTerm(rule.name);

      const candidateName =
        normalizeTerm(candidate.name);


      if (
        candidateTerms.some(
          term =>
            term.includes(ruleName) ||
            ruleName.includes(term)
        )
      ) {
        score += 1;
      }


      if (
        [...sourceTerms].some(
          term =>
            term.includes(candidateName) ||
            candidateName.includes(term)
        )
      ) {
        score += 1;
      }


      return {
        rule: candidate,
        score
      };
    })
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
/*  PREPARE VIEWER DATA                                         */
/* ------------------------------------------------------------ */

export function prepareRuleView(
  rule,
  rules = SAMPLE_RULES
) {

  if (!rule) {
    return null;
  }


  /*
   * Eventually official glossary entries can contain
   * several paragraphs.
   *
   * For now our sample data only has "preview", so this
   * gracefully uses that as the body text.
   */

  let paragraphs = [];

  if (Array.isArray(rule.text)) {

    paragraphs =
      rule.text.filter(Boolean);

  } else if (rule.text) {

    paragraphs = [
      rule.text
    ];

  } else if (rule.preview) {

    paragraphs = [
      rule.preview
    ];
  }


  /*
   * Prefer deliberate related-rule IDs when supplied.
   * Otherwise infer a few relationships from keywords.
   */

  let relatedRules = [];


  if (
    Array.isArray(rule.related) &&
    rule.related.length
  ) {

    relatedRules =
      rule.related
        .map(
          id =>
            getRuleById(id, rules)
        )
        .filter(Boolean);

  } else {

    relatedRules =
      inferRelatedRules(
        rule,
        rules,
        3
      );
  }


  return {

    rule,

    paragraphs,

    relatedRules,

    source:
      rule.source ??
      "Pocket Rule test data"
  };
}
