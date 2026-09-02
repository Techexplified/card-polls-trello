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
var pendingSelections = {}; // pollIndex -> array of selected option indices, not yet submitted

function getOptionDisplay(option) {
  if (option && typeof option === "object" && option.emoji) {
    return option.emoji + "  " + option.label;
  }
  return option;
}

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

  var voterCount = Object.keys(votes).length; // distinct people, used for % of respondents
  var totalSelections = counts.reduce(function (sum, c) {
    return sum + c;
  }, 0);
  var percentages = poll.options.map(function (_, idx) {
    return voterCount === 0 ? 0 : Math.round((counts[idx] / voterCount) * 100);
  });

  return {
    counts: counts,
    percentages: percentages,
    voterCount: voterCount,
    totalSelections: totalSelections,
  };
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
  delete pendingSelections[pollIndex];
  saveAndRender();
}

function saveAndRender() {
  t.set("card", "shared", "polls", currentPolls).then(renderPolls);
}

function addOptionToPoll(pollIndex, optionText) {
  currentPolls[pollIndex].options.push(optionText);
  saveAndRender();
}

function createAddOptionRow(block, pollIndex) {
  var wrapper = document.createElement("div");

  function showLink() {
    wrapper.innerHTML = "";
    var link = document.createElement("button");
    link.type = "button";
    link.className = "add-option-link";
    link.textContent = "Add another option";
    link.addEventListener("click", showInput);
    wrapper.appendChild(link);
    t.sizeTo("body");
  }

  function showInput() {
    wrapper.innerHTML = "";
    var row = document.createElement("div");
    row.className = "add-option-row";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "poll-input add-option-input";
    input.placeholder = "Add another option";

    var confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "confirm-btn";
    confirmBtn.innerHTML = "&#10003;";
    confirmBtn.addEventListener("click", function () {
      var val = input.value.trim();
      if (val) addOptionToPoll(pollIndex, val);
    });

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel-btn";
    cancelBtn.innerHTML = "&#10005;";
    cancelBtn.addEventListener("click", showLink);

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") confirmBtn.click();
      if (e.key === "Escape") showLink();
    });

    row.appendChild(input);
    row.appendChild(confirmBtn);
    row.appendChild(cancelBtn);
    wrapper.appendChild(row);
    input.focus();
    t.sizeTo("body");
  }

  showLink();
  block.appendChild(wrapper);
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
        label.textContent =
          stats.percentages[idx] + "%  " + getOptionDisplay(optionText);
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
        stats.totalSelections +
        (stats.totalSelections === 1 ? " vote" : " votes");
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
    } else if (poll.allowMultipleVotes) {
      if (!pendingSelections[pollIndex]) pendingSelections[pollIndex] = [];
      var selected = pendingSelections[pollIndex];

      poll.options.forEach(function (optionText, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "option-btn" + (selected.indexOf(idx) !== -1 ? " selected" : "");
        btn.textContent = getOptionDisplay(optionText);
        btn.addEventListener("click", function () {
          var pos = selected.indexOf(idx);
          if (pos === -1) selected.push(idx);
          else selected.splice(pos, 1);
          renderPolls();
        });
        optionsEl.appendChild(btn);
      });
      block.appendChild(optionsEl);

      var submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.className =
        "submit-vote-btn" + (selected.length > 0 ? " enabled" : "");
      submitBtn.textContent = "Submit vote";
      submitBtn.disabled = selected.length === 0;
      submitBtn.addEventListener("click", function () {
        var votes = poll.votes || {};
        votes[memberId] = selected.slice();
        poll.votes = votes;
        delete pendingSelections[pollIndex];
        saveAndRender();
      });
      block.appendChild(submitBtn);

      if (poll.allowAddOptions) {
        createAddOptionRow(block, pollIndex);
      }
    } else {
      poll.options.forEach(function (optionText, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = getOptionDisplay(optionText);
        btn.addEventListener("click", function () {
          recordVote(pollIndex, idx);
        });
        optionsEl.appendChild(btn);
      });
      block.appendChild(optionsEl);

      if (poll.allowAddOptions) {
        createAddOptionRow(block, pollIndex);
      }
    }

    container.appendChild(block);
  });

  if (currentPolls.length === 0) {
    container.textContent = "No polls yet.";
  }

  t.sizeTo("body");
}

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
