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

// ---- Save poll to the card ----
var addPollBtn = document.getElementById("add-poll-btn");

addPollBtn.addEventListener("click", function () {
  var question = document.getElementById("poll-question").value.trim();
  var optionInputs = optionsContainer.querySelectorAll(".poll-input");
  var options = [];
  optionInputs.forEach(function (input) {
    var val = input.value.trim();
    if (val) options.push(val);
  });

  if (!question || options.length < 2) {
    alert("Please enter a question and at least two options.");
    return;
  }

  var pollData = {
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
