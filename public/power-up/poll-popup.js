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
