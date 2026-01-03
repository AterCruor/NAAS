const reasonEl = document.getElementById("reason");
const metaEl = document.getElementById("meta");
const statusEl = document.getElementById("status");
const newButton = document.getElementById("new-reason");
const copyButton = document.getElementById("copy-reason");
const shareButton = document.getElementById("share-reason");
const sharePageButton = document.getElementById("share-page");
const typeSelect = document.getElementById("filter-type");
const toneSelect = document.getElementById("filter-tone");
const topicSelect = document.getElementById("filter-topic");
const tagInput = document.getElementById("filter-tag");
const clearFiltersButton = document.getElementById("clear-filters");

let reasons = [];
let reasonById = {};
let currentId = "";

const setStatus = (message) => {
  statusEl.textContent = message;
};

const clearStatus = () => {
  statusEl.textContent = "";
};

const getFilteredReasons = () => {
  const type = typeSelect.value;
  const tone = toneSelect.value;
  const topic = topicSelect.value;
  const tag = tagInput.value.trim().toLowerCase();

  return reasons.filter((entry) => {
    if (type && entry.type !== type) {
      return false;
    }
    if (tone && entry.tone !== tone) {
      return false;
    }
    if (topic && entry.topic !== topic) {
      return false;
    }
    if (tag && !entry.tags.some((t) => t.toLowerCase() === tag)) {
      return false;
    }
    return true;
  });
};

const updateMeta = () => {
  const filtered = getFilteredReasons();
  if (filtered.length === reasons.length) {
    metaEl.textContent = `${reasons.length} reasons ready.`;
    return;
  }
  metaEl.textContent = `${reasons.length} reasons ready. ${filtered.length} match filters.`;
};

const pickReason = () => {
  if (!reasons.length) {
    reasonEl.textContent = "No reasons loaded yet.";
    return;
  }

  const candidates = getFilteredReasons();
  if (!candidates.length) {
    currentId = "";
    reasonEl.textContent = "No reasons match those filters.";
    return;
  }

  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  currentId = entry.id || "";
  reasonEl.textContent = entry.reason;
};

const applyReasonFromId = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || !reasonById[id]) {
    return false;
  }

  currentId = id;
  reasonEl.textContent = reasonById[id].reason;
  return true;
};

const loadReasons = async () => {
  try {
    const reasonsResponse = await fetch("reasons.json");
    if (!reasonsResponse.ok) {
      throw new Error("Failed to load reasons.");
    }
    reasons = await reasonsResponse.json();
    reasonById = reasons.reduce((acc, entry) => {
      acc[entry.id] = entry;
      return acc;
    }, {});
    updateFilters();
    updateMeta();
    if (!applyReasonFromId()) {
      pickReason();
    }
  } catch (error) {
    reasons = [
      {
        id: "fallback-1",
        reason: "Nope. The reasons are hiding. Try again later.",
        type: "general",
        tone: "neutral",
        topic: "general",
        tags: [],
      },
      {
        id: "fallback-2",
        reason: "Not now. The reasons went out for a coffee.",
        type: "general",
        tone: "neutral",
        topic: "general",
        tags: [],
      },
    ];
    reasonById = {};
    updateFilters();
    metaEl.textContent = "Offline fallback mode.";
    pickReason();
  }
};

const copyReason = async () => {
  try {
    await navigator.clipboard.writeText(reasonEl.textContent.trim());
    copyButton.textContent = "Copied!";
    setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1200);
  } catch (error) {
    copyButton.textContent = "Copy";
  }
};

const shareReason = async () => {
  clearStatus();
  const reason = reasonEl.textContent.trim();
  if (!reason) {
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "No-as-a-Service",
        text: reason,
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Share canceled");
        return;
      }
      // Fall back to copy when share is unsupported or fails.
    }
  }

  try {
    await navigator.clipboard.writeText(reason);
    shareButton.textContent = "Copied!";
    setTimeout(() => {
      shareButton.textContent = "Share";
    }, 1200);
  } catch (error) {
    setStatus("Copy failed");
  }
};

const sharePage = async () => {
  clearStatus();
  const reason = reasonEl.textContent.trim();
  if (!reason) {
    return;
  }

  const url = currentId
    ? `${window.location.origin}${window.location.pathname}?id=${currentId}`
    : window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "No-as-a-Service",
        url,
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Share canceled");
        return;
      }
      // Fall back to copy when share is unsupported or fails.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    sharePageButton.textContent = "Copied!";
    setTimeout(() => {
      sharePageButton.textContent = "Share Page";
    }, 1200);
  } catch (error) {
    setStatus("Copy failed");
  }
};

newButton.addEventListener("click", () => {
  clearStatus();
  pickReason();
});
copyButton.addEventListener("click", () => {
  clearStatus();
  copyReason();
});
shareButton.addEventListener("click", shareReason);
sharePageButton.addEventListener("click", sharePage);
typeSelect.addEventListener("change", () => {
  clearStatus();
  updateMeta();
  pickReason();
});
toneSelect.addEventListener("change", () => {
  clearStatus();
  updateMeta();
  pickReason();
});
topicSelect.addEventListener("change", () => {
  clearStatus();
  updateMeta();
  pickReason();
});
tagInput.addEventListener("input", () => {
  clearStatus();
  updateMeta();
  pickReason();
});
clearFiltersButton.addEventListener("click", () => {
  typeSelect.value = "";
  toneSelect.value = "";
  topicSelect.value = "";
  tagInput.value = "";
  clearStatus();
  updateMeta();
  pickReason();
});

const updateFilters = () => {
  const unique = (key) =>
    Array.from(new Set(reasons.map((entry) => entry[key]).filter(Boolean))).sort();

  const setOptions = (select, options) => {
    select.innerHTML = "";
    const anyOption = document.createElement("option");
    anyOption.value = "";
    anyOption.textContent = "Any";
    select.appendChild(anyOption);
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  };

  setOptions(typeSelect, unique("type"));
  setOptions(toneSelect, unique("tone"));
  setOptions(topicSelect, unique("topic"));
};

loadReasons();
