/**
 * Pocket Rule
 * Main module initialization, ApplicationV2 window,
 * JSON rule library, search, viewer, and toolbar integration.
 */

import {
  PocketRuleSearch
} from "./rule-search.js";


import {
  getRuleById,
  prepareRuleView
} from "./rule-viewer.js";


const MODULE_ID =
  "pocket-rule";


const RULES_URL =
  "modules/pocket-rule/data/rules-glossary.json";


const SEARCH_TEMPLATE =
  "modules/pocket-rule/templates/search.hbs";


const VIEWER_TEMPLATE =
  "modules/pocket-rule/templates/rule-viewer.hbs";


const {
  ApplicationV2,
  HandlebarsApplicationMixin
} = foundry.applications.api;


/* ------------------------------------------------------------ */
/*  RULE LIBRARY                                                */
/* ------------------------------------------------------------ */

let ruleLibrary =
  [];


let ruleLibraryPromise =
  null;


/**
 * Load the Pocket Rule JSON database.
 *
 * The promise is cached so Foundry does not repeatedly
 * download the same file every time Pocket Rule opens.
 */

async function loadRuleLibrary() {

  if (
    Array.isArray(
      ruleLibrary
    ) &&
    ruleLibrary.length
  ) {

    return ruleLibrary;
  }


  if (ruleLibraryPromise) {

    return ruleLibraryPromise;
  }


  ruleLibraryPromise =
    fetch(RULES_URL)
      .then(response => {

        if (!response.ok) {

          throw new Error(
            `Unable to load rules glossary: ${response.status}`
          );
        }


        return response.json();
      })
      .then(data => {

        if (!Array.isArray(data)) {

          throw new Error(
            "rules-glossary.json must contain a JSON array."
          );
        }


        ruleLibrary =
          data;


        console.log(
          `Pocket Rule | Loaded ${ruleLibrary.length} rules`
        );


        return ruleLibrary;
      })
      .catch(error => {

        ruleLibraryPromise =
          null;


        console.error(
          "Pocket Rule | Failed to load rules glossary",
          error
        );


        throw error;
      });


  return ruleLibraryPromise;
}


/* ------------------------------------------------------------ */
/*  APPLICATION                                                 */
/* ------------------------------------------------------------ */

class PocketRuleApplication
  extends HandlebarsApplicationMixin(
    ApplicationV2
  ) {


  static DEFAULT_OPTIONS = {

    id:
      "pocket-rule-window",

    classes: [
      "pocket-rule-app",
      "theme-dark"
    ],

    tag:
      "div",

    position: {
      width: 430,
      height: 310
    },

    window: {
      title:
        "Pocket Rule",

      icon:
        "fa-solid fa-book-open",

      resizable:
        true,

      minimizable:
        true
    }
  };


  static PARTS = {

    main: {
      template:
        SEARCH_TEMPLATE
    }
  };


  constructor(
    options = {}
  ) {

    super(options);


    this.selectedRule =
      null;


    this.searchController =
      null;
  }


  /* ---------------------------------------------------------- */
  /*  CHOOSE TEMPLATE                                           */
  /* ---------------------------------------------------------- */

  _configureRenderParts(
    options
  ) {

    const parts =
      super._configureRenderParts(
        options
      );


    if (parts.main) {

      parts.main.template =
        this.selectedRule
          ? VIEWER_TEMPLATE
          : SEARCH_TEMPLATE;
    }


    return parts;
  }


  /* ---------------------------------------------------------- */
  /*  PREPARE DATA                                              */
  /* ---------------------------------------------------------- */

  async _prepareContext(
    options
  ) {

    const context =
      await super._prepareContext(
        options
      );


    if (
      !this.selectedRule
    ) {

      return context;
    }


    const viewerContext =
      prepareRuleView(
        this.selectedRule,
        ruleLibrary
      );


    return {
      ...context,
      ...viewerContext
    };
  }


  /* ---------------------------------------------------------- */
  /*  RENDER                                                    */
  /* ---------------------------------------------------------- */

  _onRender(
    context,
    options
  ) {

    super._onRender(
      context,
      options
    );


    if (
      this.selectedRule
    ) {

      this._activateRuleViewer();

      return;
    }


    this._activateSearch();
  }


  /* ---------------------------------------------------------- */
  /*  SEARCH                                                    */
  /* ---------------------------------------------------------- */

  _activateSearch() {

    const input =
      this.element.querySelector(
        "#pocket-rule-search-input"
      );


    const results =
      this.element.querySelector(
        "[data-pocket-rule-results]"
      );


    if (
      !input ||
      !results
    ) {

      return;
    }


    this.searchController =
      new PocketRuleSearch({

        input,

        results,

        rules:
          ruleLibrary,

        onSelect:
          rule =>
            this._openRule(
              rule
            )
      });


    this.searchController
      .activate();


    requestAnimationFrame(
      () =>
        input.focus()
    );
  }


  /* ---------------------------------------------------------- */
  /*  VIEWER                                                    */
  /* ---------------------------------------------------------- */

  _activateRuleViewer() {

    const backButton =
      this.element.querySelector(
        "[data-pocket-rule-back]"
      );


    if (backButton) {

      backButton.addEventListener(
        "click",
        () =>
          this._backToSearch()
      );
    }


    const relatedButtons =
      this.element.querySelectorAll(
        "[data-pocket-rule-related]"
      );


    for (
      const button
      of relatedButtons
    ) {

      button.addEventListener(
        "click",
        () => {

          const ruleId =
            button.dataset
              .pocketRuleRelated;


          const rule =
            getRuleById(
              ruleId,
              ruleLibrary
            );


          if (rule) {

            this._openRule(
              rule
            );
          }
        }
      );
    }
  }


  /* ---------------------------------------------------------- */
  /*  OPEN RULE                                                 */
  /* ---------------------------------------------------------- */

  _openRule(rule) {

    if (!rule) {
      return;
    }


    this.selectedRule =
      rule;


    this.render({
      parts: [
        "main"
      ]
    });
  }


  /* ---------------------------------------------------------- */
  /*  BACK                                                      */
  /* ---------------------------------------------------------- */

  _backToSearch() {

    this.selectedRule =
      null;


    this.render({
      parts: [
        "main"
      ]
    });
  }
}


/* ------------------------------------------------------------ */
/*  APPLICATION INSTANCE                                        */
/* ------------------------------------------------------------ */

let pocketRuleApp =
  null;


/* ------------------------------------------------------------ */
/*  OPEN POCKET RULE                                            */
/* ------------------------------------------------------------ */

async function openPocketRule() {

  try {

    await loadRuleLibrary();

  } catch (error) {

    ui.notifications.error(
      "Pocket Rule could not load its rules database."
    );

    return;
  }


  if (!pocketRuleApp) {

    pocketRuleApp =
      new PocketRuleApplication();
  }


  if (
    pocketRuleApp.rendered
  ) {

    pocketRuleApp
      .bringToFront();

    return;
  }


  pocketRuleApp.render({
    force: true
  });
}


/* ------------------------------------------------------------ */
/*  MODULE INITIALIZATION                                       */
/* ------------------------------------------------------------ */

Hooks.once(
  "init",
  () => {

    console.log(
      "Pocket Rule | Initializing"
    );


    const module =
      game.modules.get(
        MODULE_ID
      );


    if (module) {

      module.api = {

        open:
          openPocketRule,

        getRules:
          () => ruleLibrary
      };
    }
  }
);


/* ------------------------------------------------------------ */
/*  PRELOAD DATABASE                                            */
/* ------------------------------------------------------------ */

Hooks.once(
  "ready",
  () => {

    loadRuleLibrary()
      .catch(() => {

        /*
         * The error has already been logged.
         * Pocket Rule will try again when opened.
         */

      });
  }
);


/* ------------------------------------------------------------ */
/*  SCENE CONTROLS                                              */
/* ------------------------------------------------------------ */

Hooks.on(
  "getSceneControlButtons",
  controls => {

    controls["pocket-rule"] = {

      name:
        "pocket-rule",

      title:
        "Pocket Rule",

      icon:
        "fa-solid fa-book-open",

      order:
        90,

      visible:
        true,


      onChange:
        (_event, active) => {

          if (!active) {
            return;
          }


          void openPocketRule();
        }
    };
  }
);
