/**
 * Pocket Rule
 * Main module initialization, ApplicationV2 window,
 * and Foundry toolbar integration.
 */

const MODULE_ID = "pocket-rule";

const {
  ApplicationV2,
  HandlebarsApplicationMixin
} = foundry.applications.api;


/* ------------------------------------------------------------ */
/*  Pocket Rule Application                                     */
/* ------------------------------------------------------------ */

class PocketRuleApplication extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "pocket-rule-window",

    classes: [
      "pocket-rule-app",
      "theme-dark"
    ],

    tag: "div",

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
      template: "modules/pocket-rule/templates/search.hbs"
    }
  };


  /**
   * Focus the search field whenever Pocket Rule is rendered.
   */
  _onRender(context, options) {
    super._onRender(context, options);

    const input = this.element.querySelector(
      "#pocket-rule-search-input"
    );

    if (input) {
      requestAnimationFrame(() => input.focus());
    }
  }
}


/* ------------------------------------------------------------ */
/*  Application Instance                                        */
/* ------------------------------------------------------------ */

let pocketRuleApp = null;


/* ------------------------------------------------------------ */
/*  Open Pocket Rule                                            */
/* ------------------------------------------------------------ */

function openPocketRule() {

  if (!pocketRuleApp) {
    pocketRuleApp = new PocketRuleApplication();
  }

  /*
   * If Pocket Rule is already open, don't create another copy.
   * Bring the existing window to the front instead.
   */
  if (pocketRuleApp.rendered) {

    pocketRuleApp.bringToFront();

    const input = pocketRuleApp.element.querySelector(
      "#pocket-rule-search-input"
    );

    if (input) input.focus();

    return;
  }

  pocketRuleApp.render({
    force: true
  });
}


/* ------------------------------------------------------------ */
/*  Module Initialization                                       */
/* ------------------------------------------------------------ */

Hooks.once("init", () => {

  console.log("Pocket Rule | Initializing");

  const module = game.modules.get(MODULE_ID);

  if (module) {
    module.api = {
      open: openPocketRule
    };
  }
});


/* ------------------------------------------------------------ */
/*  Scene Controls                                              */
/* ------------------------------------------------------------ */

Hooks.on("getSceneControlButtons", (controls) => {

  controls["pocket-rule"] = {

    name: "pocket-rule",

    title: "Pocket Rule",

    icon: "fa-solid fa-book-open",

    order: 90,

    visible: true,

    /*
     * Clicking the book itself opens Pocket Rule.
     * No secondary toolbar is required.
     */
    onChange: (_event, active) => {

      if (!active) return;

      openPocketRule();
    }
  };
});
