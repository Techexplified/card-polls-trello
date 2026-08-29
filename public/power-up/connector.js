// ---- CONFIG ----
var APP_KEY = "3199792bc734a614dee83502ceeeb6ff";
var APP_NAME = "Card Polls & Reactions";

window.TrelloPowerUp.initialize(
  {
    // This is what makes "Add a poll" show up under the "Power-Ups"
    // heading on the back of a card (Screenshot 1).
    "card-buttons": function (t, options) {
      return [
        {
          icon: {
            dark: "https://card-polls-trello.vercel.app/images/poll-icon-dark.svg",
            light:
              "https://card-polls-trello.vercel.app/images/poll-icon-light.svg",
          },
          text: "Add a poll",
          callback: function (t) {
            return t.popup({
              title: "Add a Poll",
              url: "./poll-popup.html",
              height: 300,
            });
          },
        },
      ];
    },
    // Renders the "Polls" section on the card, below the description,
    // whenever a poll has been saved for this card.
    "card-back-section": function (t, options) {
      return t.get("card", "shared", "poll").then(function (poll) {
        if (!poll) {
          return null; // no section shown until a poll exists
        }
        return {
          title: "Polls",
          icon: "https://card-polls-trello.vercel.app/images/poll-icon-dark.svg",
          content: {
            type: "iframe",
            url: t.signUrl("./poll-section.html"),
            height: 190,
          },
        };
      });
    },

    // Lets Trello know whether the current member has authorized yet.
    // Trello uses this to decide whether to show an "Authorize Account"
    // prompt under the Power-Up's settings (gear icon).
    "authorization-status": function (t, options) {
      return t
        .getRestApi()
        .isAuthorized()
        .then(function (isAuthorized) {
          return { authorized: isAuthorized };
        });
    },

    // What happens if the user authorizes from the gear-icon settings
    // menu instead of from the "Add a poll" button.
    "show-authorization": function (t, options) {
      return t.popup({
        title: "Authorize Card Polls",
        url: "./poll-popup.html",
        height: 220,
      });
    },
  },
  {
    appKey: APP_KEY,
    appName: APP_NAME,
  },
);
