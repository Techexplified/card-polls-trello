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
  // Once authorized, this is where you'd render the actual poll builder
  // and fetch/save poll data via t.get()/t.set() or your own backend.
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
