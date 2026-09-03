/**
 * Pocket Rule
 * Main module initialization and Foundry toolbar integration.
 */

const MODULE_ID = "pocket-rule";

/* ------------------------------------------------------------ */
/*  Pocket Rule API                                             */
/* ------------------------------------------------------------ */

function openPocketRule() {
  ui.notifications.info("Pocket Rule opened!");
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

    // Foundry's built-in Font Awesome open-book icon.
    icon: "fa-solid fa-book-open",

    // Places Pocket Rule toward the bottom of the left toolbar.
    order: 90,

    visible: true,

    /**
     * Pocket Rule does not need a secondary tool palette.
     * Clicking the book itself opens Pocket Rule.
     */
    onChange: (_event, active) => {
      if (!active) return;

      openPocketRule();
    }
  };
});