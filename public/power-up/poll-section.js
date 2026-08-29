/* global  */

var APP_KEY = "3199792bc734a614dee83502ceeeb6ff";
var APP_NAME = "Card Polls & Reactions";

var t = window.TrelloPowerUp.iframe({
  appKey: APP_KEY,
  appName: APP_NAME,
});

function renderPoll(poll) {
  document.getElementById("poll-question").textContent = poll.question;

  var optionsEl = document.getElementById("poll-options");
  optionsEl.innerHTML = "";

  poll.options.forEach(function (optionText) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = optionText;
    // Voting logic (recording a member's vote in poll.votes) is a
    // separate feature — wire this up once that's ready.
    optionsEl.appendChild(btn);
  });

  t.sizeTo("body");
}

document.getElementById("manage-btn").addEventListener("click", function () {
  t.popup({
    title: "Add a Poll",
    url: "./poll-popup.html",
    height: 300,
  });
});

t.render(function () {
  return t.get("card", "shared", "poll").then(function (poll) {
    if (poll) {
      renderPoll(poll);
    }
  });
});
