/**
 * Pocket Rule
 * Main module initialization, ApplicationV2 window,
 * search integration, and Foundry toolbar integration.
 */

import {
  PocketRuleSearch
} from "./rule-search.js";


const MODULE_ID =
  "pocket-rule";


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
      height: 270
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
        "modules/pocket-rule/templates/search.hbs"
    }
  };


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


    const input =
      this.element.querySelector(
        "#pocket-rule-search-input"
      );


    const results =
      this.element.querySelector(
        "[data-pocket-rule-results]"
      );


    /*
     * Connect the visible search box to our
     * search engine.
     */

    this.searchController =
      new PocketRuleSearch({

        input,

        results,

        onSelect:
          rule =>
            this._onRuleSelected(rule)
      });


    this.searchController.activate();


    /*
     * Put the cursor directly in the search box.
     */

    if (input) {

      requestAnimationFrame(
        () => input.focus()
      );
    }
  }


  /* ---------------------------------------------------------- */
  /*  RULE SELECTED                                             */
  /* ---------------------------------------------------------- */

  _onRuleSelected(rule) {

    /*
     * Temporary test.
     *
     * The next development step will replace this
     * notification with the real rule viewer.
     */

    ui.notifications.info(
      `${rule.name} selected`
    );

    console.log(
      "Pocket Rule | Rule selected:",
      rule
    );
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


  /*
   * Pocket Rule is already open.
   */

  if (pocketRuleApp.rendered) {

    pocketRuleApp.bringToFront();


    const input =
      pocketRuleApp.element.querySelector(
        "#pocket-rule-search-input"
      );


    if (input) {
      input.focus();
    }

    return;
  }


  /*
   * Open Pocket Rule.
   */

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


      /*
       * Clicking the book itself opens
       * Pocket Rule.
       */

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
