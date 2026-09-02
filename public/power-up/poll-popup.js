/* global */

var APP_KEY = "3199792bc734a614dee83502ceeeb6ff";
var APP_NAME = "Card Polls & Reactions";

var t = window.TrelloPowerUp.iframe({
  appKey: APP_KEY,
  appName: APP_NAME,
});

var overlayEl = document.getElementById("auth-overlay");
var authorizeBtn = document.getElementById("authorize-btn");
var errorEl = document.getElementById("auth-error");

function showOverlay() {
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
  document.getElementById("poll-form").classList.remove("hidden");
  t.sizeTo("#app");
}

function checkAuthAndRender() {
  return t
    .getRestApi()
    .isAuthorized()
    .then(function (isAuthorized) {
      if (isAuthorized) {
        hideOverlay();
      } else {
        showOverlay();
      }
    });
}

authorizeBtn.addEventListener("click", function () {
  authorizeBtn.disabled = true;
  errorEl.classList.add("hidden");

  t.getRestApi()
    .authorize({ scope: "read,write", expiration: "never" })
    .then(function () {
      return checkAuthAndRender();
    })
    .catch(function (err) {
      authorizeBtn.disabled = false;
      errorEl.textContent =
        "Authorization was cancelled or failed. Please try again.";
      errorEl.classList.remove("hidden");
      console.error("Trello authorization error:", err);
    });
});

t.render(function () {
  return checkAuthAndRender();
});

var tabNew = document.getElementById("tab-new");
var tabRecent = document.getElementById("tab-recent");

if (tabNew && tabRecent) {
  tabNew.addEventListener("click", function () {
    tabNew.classList.add("active");
    tabRecent.classList.remove("active");
    // TODO: show "new poll" fields, hide "recent polls" list
  });
  tabRecent.addEventListener("click", function () {
    tabRecent.classList.add("active");
    tabNew.classList.remove("active");
    // TODO: fetch and show past polls via t.get()/your backend
  });
}

// ---- Dynamic "Add option" rows ----
var optionsContainer = document.getElementById("options-container");
var addOptionBtn = document.getElementById("add-option-btn");
var optionCount = 2;

addOptionBtn.addEventListener("click", function () {
  optionCount++;

  var row = document.createElement("div");
  row.className = "option-row";

  var input = document.createElement("input");
  input.type = "text";
  input.className = "poll-input";
  input.placeholder = "Option " + optionCount;

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-option-btn";
  removeBtn.setAttribute("aria-label", "Remove option");
  removeBtn.textContent = "\u00D7";
  removeBtn.addEventListener("click", function () {
    row.remove();
    t.sizeTo("#app");
  });

  row.appendChild(input);
  row.appendChild(removeBtn);
  optionsContainer.appendChild(row);
  t.sizeTo("#app");
});

// ---- Poll type toggle ----
var typeTextBtn = document.getElementById("type-text");
var typeReactionBtn = document.getElementById("type-reaction");
var textOptionsSection = document.getElementById("text-options-section");
var reactionOptionsSection = document.getElementById(
  "reaction-options-section",
);
var currentPollType = "text";

function setPollType(newType) {
  currentPollType = newType;
  typeTextBtn.classList.toggle("active", newType === "text");
  typeReactionBtn.classList.toggle("active", newType === "reaction");
  textOptionsSection.classList.toggle("hidden", newType !== "text");
  reactionOptionsSection.classList.toggle("hidden", newType !== "reaction");
  t.sizeTo("#app");
}

typeTextBtn.addEventListener("click", function () {
  setPollType("text");
});
typeReactionBtn.addEventListener("click", function () {
  setPollType("reaction");
});

// ---- Reaction option rows ----
var REACTION_EMOJIS = [
  "👍",
  "❤️",
  "🔥",
  "🚀",
  "🎉",
  "💡",
  "👀",
  "💯",
  "👁️",
  "✨",
  "⚡",
  "🤩",
  "🎯",
  "🙌",
  "🥳",
  "🤔",
  "👊",
  "🌱",
];
var reactionOptionsContainer = document.getElementById(
  "reaction-options-container",
);
var quickReactionBank = document.getElementById("quick-reaction-bank");

REACTION_EMOJIS.forEach(function (emoji) {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "reaction-emoji-btn";
  btn.textContent = emoji;
  btn.addEventListener("click", function () {
    addReactionOptionRow(emoji);
  });
  quickReactionBank.appendChild(btn);
});

function addReactionOptionRow(emoji) {
  var row = document.createElement("div");
  row.className = "reaction-option-row";

  var tile = document.createElement("div");
  tile.className = "reaction-emoji-tile";
  tile.textContent = emoji;

  var input = document.createElement("input");
  input.type = "text";
  input.className = "poll-input reaction-label-input";
  input.placeholder = "Label (e.g. Yes / Approve)";

  var trashBtn = document.createElement("button");
  trashBtn.type = "button";
  trashBtn.className = "trash-btn";
  trashBtn.innerHTML = "&#128465;";
  trashBtn.addEventListener("click", function () {
    row.remove();
    t.sizeTo("#app");
  });

  row.appendChild(tile);
  row.appendChild(input);
  row.appendChild(trashBtn);
  reactionOptionsContainer.appendChild(row);
  input.focus();
  t.sizeTo("#app");
}

document
  .getElementById("add-reaction-btn")
  .addEventListener("click", function () {
    addReactionOptionRow("➕");
  });

// ---- Save poll to the card ----
var addPollBtn = document.getElementById("add-poll-btn");

addPollBtn.addEventListener("click", function () {
  var question = document.getElementById("poll-question").value.trim();
  var options = [];

  if (currentPollType === "text") {
    var optionInputs = optionsContainer.querySelectorAll(".poll-input");
    optionInputs.forEach(function (input) {
      var val = input.value.trim();
      if (val) options.push(val);
    });
  } else {
    var reactionRows = reactionOptionsContainer.querySelectorAll(
      ".reaction-option-row",
    );
    reactionRows.forEach(function (row) {
      var emoji = row.querySelector(".reaction-emoji-tile").textContent;
      var label = row.querySelector(".reaction-label-input").value.trim();
      if (label) options.push({ emoji: emoji, label: label });
    });
  }

  if (!question || options.length < 2) {
    alert("Please enter a question and at least two options.");
    return;
  }

  var pollData = {
    type: currentPollType,
    question: question,
    options: options,
    allowAddOptions: document.getElementById("allow-add-options").checked,
    allowMultipleVotes: document.getElementById("allow-multiple-votes").checked,
    votes: {},
  };

  t.get("card", "shared", "polls")
    .then(function (existingPolls) {
      var polls = existingPolls || [];
      polls.push(pollData);
      return t.set("card", "shared", "polls", polls);
    })
    .then(function () {
      return t.closePopup();
    });
});
