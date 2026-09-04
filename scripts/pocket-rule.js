/**
 * Pocket Rule
 * Main module initialization, ApplicationV2 window,
 * search integration, rule viewer, and toolbar integration.
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


const SEARCH_TEMPLATE =
  "modules/pocket-rule/templates/search.hbs";


const VIEWER_TEMPLATE =
  "modules/pocket-rule/templates/rule-viewer.hbs";


const {
  ApplicationV2,
  HandlebarsApplicationMixin
} = foundry.applications.api;


/* ------------------------------------------------------------ */
/*  Pocket Rule Application                                     */
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
      title: "Pocket Rule",
      icon: "fa-solid fa-book-open",
      resizable: true,
      minimizable: true
    }
  };


  static PARTS = {

    main: {
      template:
        SEARCH_TEMPLATE
    }
  };


  constructor(options = {}) {

    super(options);

    /*
     * null means we are viewing the search screen.
     *
     * A rule object means we are viewing that rule.
     */

    this.selectedRule = null;

    this.searchController = null;
  }


  /* ---------------------------------------------------------- */
  /*  CHOOSE TEMPLATE                                           */
  /* ---------------------------------------------------------- */

  _configureRenderParts(options) {

    const parts =
      super._configureRenderParts(options);


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

  async _prepareContext(options) {

    const context =
      await super._prepareContext(options);


    if (!this.selectedRule) {
      return context;
    }


    const viewerContext =
      prepareRuleView(
        this.selectedRule
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


    /*
     * If a rule is selected, activate viewer controls.
     */

    if (this.selectedRule) {

      this._activateRuleViewer();

      return;
    }


    /*
     * Otherwise activate search.
     */

    this._activateSearch();
  }


  /* ---------------------------------------------------------- */
  /*  ACTIVATE SEARCH                                           */
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


    if (!input || !results) {
      return;
    }


    this.searchController =
      new PocketRuleSearch({

        input,

        results,

        onSelect:
          rule =>
            this._openRule(rule)
      });


    this.searchController.activate();


    requestAnimationFrame(
      () => input.focus()
    );
  }


  /* ---------------------------------------------------------- */
  /*  ACTIVATE RULE VIEWER                                      */
  /* ---------------------------------------------------------- */

  _activateRuleViewer() {

    const backButton =
      this.element.querySelector(
        "[data-pocket-rule-back]"
      );


    if (backButton) {

      backButton.addEventListener(
        "click",
        () => this._backToSearch()
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
            getRuleById(ruleId);


          if (rule) {
            this._openRule(rule);
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
  /*  BACK TO SEARCH                                            */
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
/*  Application Instance                                        */
/* ------------------------------------------------------------ */

let pocketRuleApp =
  null;


/* ------------------------------------------------------------ */
/*  Open Pocket Rule                                            */
/* ------------------------------------------------------------ */

function openPocketRule() {

  if (!pocketRuleApp) {

    pocketRuleApp =
      new PocketRuleApplication();
  }


  if (pocketRuleApp.rendered) {

    pocketRuleApp.bringToFront();

    return;
  }


  pocketRuleApp.render({
    force: true
  });
}


/* ------------------------------------------------------------ */
/*  Module Initialization                                       */
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
        open: openPocketRule
      };
    }
  }
);


/* ------------------------------------------------------------ */
/*  Scene Controls                                              */
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

          openPocketRule();
        }
    };
  }
);
