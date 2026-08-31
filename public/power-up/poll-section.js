/* global  */

var APP_KEY = "3199792bc734a614dee83502ceeeb6ff";
var APP_NAME = "Card Polls & Reactions";

var t = window.TrelloPowerUp.iframe({
  appKey: APP_KEY,
  appName: APP_NAME,
});

var currentPolls = [];
var memberId = null;
var memberInitials = "?";

function computeStats(poll) {
  var counts = poll.options.map(function () {
    return 0;
  });
  var votes = poll.votes || {};

  Object.keys(votes).forEach(function (mId) {
    var vote = votes[mId];
    var indices = Array.isArray(vote) ? vote : [vote];
    indices.forEach(function (idx) {
      if (typeof counts[idx] === "number") counts[idx]++;
    });
  });

  var voterCount = Object.keys(votes).length;
  var percentages = poll.options.map(function (_, idx) {
    return voterCount === 0 ? 0 : Math.round((counts[idx] / voterCount) * 100);
  });

  return { counts: counts, percentages: percentages, voterCount: voterCount };
}

function recordVote(pollIndex, optionIndex) {
  var poll = currentPolls[pollIndex];
  var votes = poll.votes || {};

  if (poll.allowMultipleVotes) {
    var current = Array.isArray(votes[memberId]) ? votes[memberId].slice() : [];
    var pos = current.indexOf(optionIndex);
    if (pos === -1) current.push(optionIndex);
    else current.splice(pos, 1);
    votes[memberId] = current;
  } else {
    votes[memberId] = optionIndex;
  }

  poll.votes = votes;
  saveAndRender();
}

function changeVote(pollIndex) {
  var poll = currentPolls[pollIndex];
  var votes = poll.votes || {};
  delete votes[memberId];
  poll.votes = votes;
  saveAndRender();
}

function saveAndRender() {
  t.set("card", "shared", "polls", currentPolls).then(renderPolls);
}

function renderPolls() {
  var container = document.getElementById("polls-container");
  container.innerHTML = "";

  currentPolls.forEach(function (poll, pollIndex) {
    var block = document.createElement("div");
    block.className = "poll-block";

    var questionEl = document.createElement("div");
    questionEl.className = "question";
    questionEl.textContent = poll.question;
    block.appendChild(questionEl);

    var votes = poll.votes || {};
    var myVote = votes[memberId];
    var hasVoted = poll.allowMultipleVotes
      ? Array.isArray(myVote) && myVote.length > 0
      : myVote !== undefined && myVote !== null;

    var optionsEl = document.createElement("div");
    optionsEl.className = "options";

    if (hasVoted) {
      var stats = computeStats(poll);
      var myIndices = poll.allowMultipleVotes ? myVote : [myVote];

      poll.options.forEach(function (optionText, idx) {
        var row = document.createElement("div");
        row.className =
          "result-row" + (myIndices.indexOf(idx) !== -1 ? " voted" : "");

        var fill = document.createElement("div");
        fill.className = "result-fill";
        fill.style.width = stats.percentages[idx] + "%";
        row.appendChild(fill);

        var label = document.createElement("span");
        label.className = "result-label";
        label.textContent = stats.percentages[idx] + "%  " + optionText;
        row.appendChild(label);

        if (myIndices.indexOf(idx) !== -1) {
          var avatar = document.createElement("span");
          avatar.className = "avatar";
          avatar.textContent = memberInitials;
          row.appendChild(avatar);
        }

        optionsEl.appendChild(row);
      });

      block.appendChild(optionsEl);

      var footer = document.createElement("div");
      footer.className = "poll-footer";

      var countLabel = document.createElement("span");
      countLabel.textContent =
        stats.voterCount + (stats.voterCount === 1 ? " vote" : " votes");
      footer.appendChild(countLabel);

      var changeBtn = document.createElement("button");
      changeBtn.type = "button";
      changeBtn.className = "link-btn";
      changeBtn.textContent = "Change vote";
      changeBtn.addEventListener("click", function () {
        changeVote(pollIndex);
      });
      footer.appendChild(changeBtn);

      block.appendChild(footer);
    } else {
      poll.options.forEach(function (optionText, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = optionText;
        btn.addEventListener("click", function () {
          recordVote(pollIndex, idx);
        });
        optionsEl.appendChild(btn);
      });
      block.appendChild(optionsEl);
    }

    container.appendChild(block);
  });

  if (currentPolls.length === 0) {
    container.textContent = "No polls yet.";
  }

  t.sizeTo("body");
}

document.getElementById("manage-btn").addEventListener("click", function () {
  t.popup({
    title: "Polls - Manage",
    items: [
      {
        text: "Add a new poll",
        callback: function (t) {
          return t.popup({
            title: "Add a Poll",
            url: t.signUrl("./poll-popup.html"),
            height: 300,
          });
        },
      },
      {
        text: "Delete a poll",
        callback: function (t) {
          return t.get("card", "shared", "polls").then(function (polls) {
            polls = polls || [];

            if (polls.length === 0) {
              return t.popup({
                title: "Delete a Poll",
                items: [
                  { text: "No polls to delete", callback: function () {} },
                ],
              });
            }

            var deleteItems = polls.map(function (poll, idx) {
              return {
                text: poll.question,
                callback: function (t) {
                  var updated = polls.slice();
                  updated.splice(idx, 1);
                  return t
                    .set("card", "shared", "polls", updated)
                    .then(function () {
                      return t.closePopup();
                    });
                },
              };
            });

            return t.popup({
              title: "Delete a Poll",
              items: deleteItems,
            });
          });
        },
      },
    ],
  });
});

t.render(function () {
  return Promise.all([
    t.member("id"),
    t.member("initials"),
    t.get("card", "shared", "polls"),
  ])
    .then(function (results) {
      memberId = results[0].id;
      memberInitials = results[1].initials || "?";
      currentPolls = results[2] || [];
      renderPolls();
    })
    .catch(function (err) {
      console.error("Failed to load polls:", err);
      document.getElementById("polls-container").textContent =
        "Error loading polls — check console.";
    });
});
