/* global  */

var APP_KEY = "3199792bc734a614dee83502ceeeb6ff";
var APP_NAME = "Card Polls & Reactions";

var t = window.TrelloPowerUp.iframe({
  appKey: APP_KEY,
  appName: APP_NAME,
});

function renderPolls(polls) {
  var container = document.getElementById("polls-container");
  container.innerHTML = "";

  polls.forEach(function (poll) {
    var block = document.createElement("div");
    block.className = "poll-block";

    var questionEl = document.createElement("div");
    questionEl.className = "question";
    questionEl.textContent = poll.question;
    block.appendChild(questionEl);

    var optionsEl = document.createElement("div");
    optionsEl.className = "options";

    poll.options.forEach(function (optionText) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = optionText;
      // Voting logic (recording a member's vote in poll.votes) is a
      // separate feature — wire this up once that's ready.
      optionsEl.appendChild(btn);
    });

    block.appendChild(optionsEl);
    container.appendChild(block);
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
  return t
    .get("card", "shared", "polls")
    .then(function (polls) {
      if (polls && polls.length) {
        renderPolls(polls);
      } else {
        document.getElementById("polls-container").textContent =
          "No polls yet.";
      }
    })
    .catch(function (err) {
      console.error("Failed to load polls:", err);
      document.getElementById("polls-container").textContent =
        "Error loading polls — check console.";
    });
});
