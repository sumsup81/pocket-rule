/**
 * Pocket Rule
 * Rule viewer helpers
 *
 * Rule data is supplied by rules-glossary.json.
 */


/* ------------------------------------------------------------ */
/*  FIND A RULE                                                 */
/* ------------------------------------------------------------ */

export function getRuleById(
  id,
  rules = []
) {

  return rules.find(
    rule =>
      rule.id === id
  ) ?? null;
}


/* ------------------------------------------------------------ */
/*  NORMALIZE TERM                                              */
/* ------------------------------------------------------------ */

function normalizeTerm(
  value = ""
) {

  return String(value)
    .toLowerCase()
    .trim();
}


/* ------------------------------------------------------------ */
/*  INFER RELATED RULES                                         */
/* ------------------------------------------------------------ */

function inferRelatedRules(
  rule,
  rules = [],
  limit = 3
) {

  const sourceTerms =
    new Set(
      [
        ...(rule.keywords ?? []),
        ...(rule.aliases ?? [])
      ].map(
        normalizeTerm
      )
    );


  return rules
    .filter(
      candidate =>
        candidate.id !==
        rule.id
    )
    .map(candidate => {

      const candidateTerms = [
        ...(candidate.keywords ?? []),
        ...(candidate.aliases ?? [])
      ].map(
        normalizeTerm
      );


      let score = 0;


      for (
        const term
        of candidateTerms
      ) {

        if (
          sourceTerms.has(term)
        ) {

          score += 2;
        }
      }


      const ruleName =
        normalizeTerm(
          rule.name
        );


      const candidateName =
        normalizeTerm(
          candidate.name
        );


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
/*  PREPARE TEXT BLOCKS                                         */
/* ------------------------------------------------------------ */

/**
 * Pocket Rule supports two rule-text formats.
 *
 * OLD:
 *
 * "text": "Some rule text."
 *
 * or:
 *
 * "text": [
 *   "Paragraph one.",
 *   "Paragraph two."
 * ]
 *
 *
 * NEW:
 *
 * "text": [
 *   {
 *     "heading": "Speed 0",
 *     "body": "Your Speed is 0."
 *   }
 * ]
 *
 *
 * Everything gets converted into the same viewer format.
 */

function prepareTextBlocks(
  rule
) {

  const text =
    rule.text;


  if (!text) {

    if (rule.preview) {

      return [
        {
          heading: null,
          body: rule.preview
        }
      ];
    }

    return [];
  }


  /* One plain string */

  if (
    typeof text ===
    "string"
  ) {

    return [
      {
        heading: null,
        body: text
      }
    ];
  }


  /* Array */

  if (
    Array.isArray(text)
  ) {

    return text
      .map(item => {

        /*
         * Old paragraph format.
         */

        if (
          typeof item ===
          "string"
        ) {

          return {
            heading: null,
            body: item
          };
        }


        /*
         * New section format.
         */

        if (
          item &&
          typeof item ===
          "object"
        ) {

          return {
            heading:
              item.heading ??
              null,

            body:
              item.body ??
              ""
          };
        }


        return null;
      })
      .filter(
        block =>
          block &&
          block.body
      );
  }


  return [];
}


/* ------------------------------------------------------------ */
/*  PREPARE VIEWER DATA                                         */
/* ------------------------------------------------------------ */

export function prepareRuleView(
  rule,
  rules = []
) {

  if (!rule) {
    return null;
  }


  const textBlocks =
    prepareTextBlocks(
      rule
    );


  let relatedRules =
    [];


  if (
    Array.isArray(
      rule.related
    ) &&
    rule.related.length
  ) {

    relatedRules =
      rule.related
        .map(
          id =>
            getRuleById(
              id,
              rules
            )
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

    textBlocks,

    relatedRules,

    source:
      rule.source ??
      "Pocket Rule"
  };
}
