/* Plain static files. No account, analytics, browser speech synthesis, or build step. */
"use strict";
(async function () {
  const view = document.getElementById("card-view");
  const list = document.getElementById("card-list");
  const search = document.getElementById("card-search");
  const category = document.getElementById("category");
  const palette = [
    ["#2B837B", "#EFF8F6", "#1F655F", "#FFFFFF"],
    ["#DA9C34", "#FFF8E9", "#78520E", "#21323D"],
    ["#558FC3", "#EFF6FC", "#2F608B", "#FFFFFF"],
    ["#3C6E9C", "#EFF4FA", "#2D5479", "#FFFFFF"],
    ["#9378B9", "#F6F1FB", "#644C84", "#FFFFFF"]
  ];
  const spellPalette = ["#8061AC", "#F5F0FB", "#604580", "#FFFFFF"];
  const propPalette = ["#B8893C", "#FCF7ED", "#765217", "#21323D"];
  let data, cards, cardById, currentId = "", player = null, rate = 1;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(className, text, onClick) {
    const node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }
  function fieldLabel(card) {
    return card.kind === "scenario" ? card.field : card.kind === "prop" ? "道具卡" : "咒語卡";
  }
  function applyColor(node, card) {
    const colors = card.kind === "scenario" ? palette[data.fields.indexOf(card.field)] || palette[0] : card.kind === "prop" ? propPalette : spellPalette;
    node.style.setProperty("--field", colors[0]);
    node.style.setProperty("--field-bg", colors[1]);
    node.style.setProperty("--field-ink", colors[2]);
    node.style.setProperty("--field-button-text", colors[3]);
  }
  function publicLabel(card) {
    return card.kind === "scenario" ? card.field : card.name;
  }
  function playIcon(paused) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "currentColor");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", paused ? "M7 3.6v16.8L21 12 7 3.6Z" : "M5 4h5v16H5zm9 0h5v16h-5z");
    svg.append(path);
    return svg;
  }
  function addTranscript(parent, card) {
    const transcript = el("div", "transcript");
    for (const [key, title, className] of [["hakka", "客語・四縣腔", "hakka"], ["pinyin", "客語拼音", "pinyin"], ["mandarin", "華語意思", "mandarin"]]) {
      if (!card[key]) continue;
      const section = el("section", "transcript-part " + className);
      section.append(el("h3", "", title));
      const p = el("p", "", card[key]);
      if (key === "hakka" || key === "pinyin") p.lang = "hak-TW";
      section.append(p);
      transcript.append(section);
    }
    parent.append(transcript);
  }
  function populateAnswer(parent, card) {
    if (card.kind === "scenario") {
      const heading = el("div", "answer-title");
      heading.append(el("span", "", "情境揭曉"), el("h2", "", card.title));
      parent.append(heading);
      const needIndexes = [1, 2].filter(i => card["need" + i] && Array.isArray(card["valid_props" + i]) && card["valid_props" + i].length);
      const hasPairing = needIndexes.includes(1);
      const needs = el("div", "needs");
      for (const i of hasPairing ? needIndexes : []) {
        const need = el("section", "need");
        const head = el("div", "need-head");
        head.append(el("span", "need-num", String(i).padStart(2, "0")), el("h3", "", card["need" + i]));
        const options = el("div", "prop-options");
        options.setAttribute("aria-label", "需求 " + i + " 可用的道具");
        for (const id of card["valid_props" + i] || []) {
          const prop = cardById.get(id);
          const chip = el("span", "prop-option");
          const image = el("img", "prop-image");
          image.src = "assets/props/" + id + ".png";
          image.alt = "";
          image.width = 48;
          image.height = 48;
          image.loading = "lazy";
          image.decoding = "async";
          image.addEventListener("error", () => { image.hidden = true; });
          const label = el("span", "prop-label", prop ? prop.name : id);
          if (prop) label.append(el("code", "", id));
          chip.append(image, label);
          options.append(chip);
        }
        need.append(head, options);
        needs.append(need);
      }
      if (hasPairing) parent.append(needs, el("p", "score-summary", "本題最多 " + needIndexes.length + " 項"), el("p", "scoring-note", "每張道具牌只能分配給一項需求；每項需求最多計一次。"));
      else parent.append(el("p", "unknown-card", "本題道具配對待確認，請先聽語音、練習語句。"));
    } else if (card.kind === "spell") {
      const effect = el("section", "spell-effect");
      effect.append(el("h3", "", "念出口令，使用咒語"), el("p", "", card.effect));
      if (card.limit) effect.append(el("p", "spell-limit", card.limit));
      parent.append(effect);
    }
    addTranscript(parent, card);
  }
  function stopPreviousAudio() {
    if (!player) return;
    const previous = player;
    player = null;
    previous.pause();
    previous.removeAttribute("src");
    previous.load();
  }
  function renderCard(id, updateUrl, focus) {
    stopPreviousAudio();
    currentId = id || "";
    const card = cardById.get(currentId);
    view.replaceChildren();
    if (updateUrl) {
      const url = new URL(location.href);
      if (currentId) url.searchParams.set("card", currentId); else url.searchParams.delete("card");
      history.pushState({}, "", url);
    }
    if (!card) {
      const info = el("div", currentId ? "unknown-card" : "welcome");
      info.append(el("h1", "", currentId ? "找不到這張卡" : "選一張卡，來聽客語"));
      info.append(el("p", "", currentId ? "請確認卡號，或從卡牌清單重新選擇。" : "掃描卡牌 QR code，或從清單選擇卡號。聽完情境、選好道具，再揭曉答案。"));
      view.append(info);
      document.title = "客語桌遊開發案｜四縣腔語音";
      renderList();
      return;
    }
    document.title = card.id + " " + publicLabel(card) + "｜客語桌遊開發案";
    const panel = el("article", "card-panel");
    applyColor(panel, card);
    const meta = el("div", "card-meta");
    meta.append(el("span", "card-id", card.id), el("span", "category-badge", fieldLabel(card)));
    const main = el("div", "player-main");
    const heading = el("h1", "", card.kind === "scenario" ? "聽一聽，選道具" : card.name);
    heading.tabIndex = -1;
    main.append(heading, el("p", "player-prompt", card.kind === "scenario" ? "這個情境，需要哪些道具？" : card.kind === "spell" ? "先聽一遍，再試著念念看。" : "聽聽看，這個道具怎麼說？"));
    const status = el("p", "audio-status", "正在載入音檔…");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const playLabel = el("span", "", "播放客語");
    const play = button("play-button", "", async () => {
      if (player !== audio) return;
      if (!audio.paused) audio.pause();
      else {
        try { await audio.play(); }
        catch (error) {
          if (player !== audio || error.name === "AbortError") return;
          status.textContent = "播放未開始，請再按一次播放。";
          status.classList.add("error");
        }
      }
    });
    play.append(playIcon(true), playLabel);
    play.disabled = true;
    play.setAttribute("aria-label", "播放 " + card.id + " 四縣腔語音");
    main.append(play, status);
    const audio = document.createElement("audio");
    player = audio;
    audio.className = "native-audio";
    audio.controls = true;
    audio.preload = "metadata";
    audio.hidden = true;
    audio.setAttribute("aria-label", card.id + " 語音播放進度");
    audio.playbackRate = rate;
    const tools = el("div", "player-tools");
    tools.hidden = true;
    const replay = button("text-button", "再聽一次", async () => {
      if (player !== audio) return;
      audio.currentTime = 0;
      try { await audio.play(); }
      catch (error) { if (player === audio && error.name !== "AbortError") status.textContent = "請按播放，再聽一次。"; }
    });
    const speedGroup = el("div", "speed-group");
    const speedLabel = el("label", "", "速度");
    speedLabel.htmlFor = "audio-speed";
    const speed = el("select");
    speed.id = "audio-speed";
    for (const [value, name] of [[1, "正常"], [.85, "稍慢"]]) {
      const option = el("option", "", name);
      option.value = String(value);
      option.selected = rate === value;
      speed.append(option);
    }
    speed.addEventListener("change", () => { rate = Number(speed.value); audio.playbackRate = rate; });
    speedGroup.append(speedLabel, speed);
    tools.append(replay, speedGroup);
    main.append(audio, tools);
    const answer = el("div", "answer-area");
    answer.id = "answer";
    // Scenario answers are not added to the visible DOM until the child explicitly reveals them.
    if (card.kind === "scenario") {
      answer.hidden = true;
      let revealed = false;
      const reveal = button("reveal-button", "已選好道具，揭曉", () => {
        if (!revealed) { populateAnswer(answer, card); revealed = true; }
        const open = answer.hidden;
        answer.hidden = !open;
        reveal.setAttribute("aria-expanded", String(open));
        reveal.textContent = open ? "收起答案，再聽一次" : "已選好道具，揭曉";
      });
      reveal.setAttribute("aria-expanded", "false");
      reveal.setAttribute("aria-controls", "answer");
      main.append(reveal, el("p", "reveal-hint", "先選好道具，再看本題需求與語句。"));
    } else populateAnswer(answer, card);
    panel.append(meta, main, answer);
    view.append(panel);
    const findCard = el("a", "back-to-list", "換一張卡");
    findCard.href = "#library-heading";
    view.append(findCard);
    function setPlaying(playing) {
      if (player !== audio) return;
      play.replaceChildren(playIcon(!playing), el("span", "", playing ? "暫停播放" : "播放客語"));
      play.setAttribute("aria-label", (playing ? "暫停 " : "播放 ") + card.id + " 四縣腔語音");
    }
    function ready() {
      if (player !== audio) return;
      play.disabled = false;
      audio.hidden = false;
      tools.hidden = false;
      status.classList.remove("error");
      status.textContent = audio.paused ? "按播放，聽四縣腔。" : "正在播放四縣腔。";
    }
    audio.addEventListener("loadedmetadata", ready);
    audio.addEventListener("canplay", ready);
    audio.addEventListener("play", () => { if (player === audio) { setPlaying(true); status.textContent = "正在播放四縣腔。"; status.classList.remove("error"); } });
    audio.addEventListener("pause", () => { if (player === audio) { setPlaying(false); status.textContent = "已暫停，可繼續播放。"; } });
    audio.addEventListener("ended", () => { if (player === audio) { setPlaying(false); status.textContent = "聽完了！也可以再聽一次。"; } });
    audio.addEventListener("error", () => {
      if (player !== audio) return;
      play.disabled = true;
      setPlaying(false);
      audio.hidden = true;
      tools.hidden = true;
      status.classList.add("error");
      status.textContent = audio.error && audio.error.code === 3 ? "音檔無法播放，請重新整理或換個瀏覽器。" : "音檔尚未上架";
    });
    // Local path only. No Mandarin TTS fallback; absent files stay clearly unavailable.
    const source = typeof card.audio === "string" && /^audio\/[A-Za-z0-9_./-]+\.(wav|mp3|m4a|ogg)$/i.test(card.audio) ? card.audio : "audio/" + card.id + ".wav";
    audio.src = source;
    audio.load();
    renderList();
    if (focus) {
      heading.focus({preventScroll:true});
      if (window.matchMedia("(max-width: 760px)").matches) view.scrollIntoView({block:"start", behavior:"instant"});
    }
  }
  function renderList() {
    const query = search.value.trim().toLocaleLowerCase();
    const selected = category.value;
    const results = cards.filter(card => {
      const matchesCategory = selected === "all" || selected === card.kind || selected === card.field;
      // Scene titles and transcripts must never leak through the card browser or search.
      const visibleText = [card.id, fieldLabel(card), publicLabel(card)].join(" ").toLocaleLowerCase();
      return matchesCategory && (!query || visibleText.includes(query));
    });
    list.replaceChildren();
    for (const card of results) {
      const choice = button("card-choice", "", () => renderCard(card.id, true, true));
      applyColor(choice, card);
      choice.setAttribute("aria-label", card.id + " " + publicLabel(card));
      if (card.id === currentId) choice.setAttribute("aria-current", "true");
      choice.append(el("span", "choice-id", card.id), el("span", "choice-name", publicLabel(card)));
      list.append(choice);
    }
    if (!results.length) list.append(el("p", "no-results", "找不到符合的卡牌，試試卡號或其他分類。"));
    document.getElementById("card-count").textContent = results.length + " 款";
    document.getElementById("search-summary").textContent = "找到 " + results.length + " 款卡牌。";
  }
  try {
    // data.js also supports opening index.html directly, without a local web server.
    data = window.CARD_DATA;
    if (!data) {
      const response = await fetch("data.json");
      if (!response.ok) throw new Error("Card data unavailable");
      data = await response.json();
    }
    if (!data || !Array.isArray(data.cards)) throw new Error("Invalid card data");
    cards = data.cards;
    cardById = new Map(cards.map(card => [card.id, card]));
    for (const [value, title] of [["scenario", "全部地圖卡"], ...data.fields.map(field => [field, field]), ["prop", "道具卡"], ["spell", "咒語卡"]]) {
      const option = el("option", "", title); option.value = value; category.append(option);
    }
    search.addEventListener("input", renderList);
    category.addEventListener("change", renderList);
    window.addEventListener("popstate", () => renderCard((new URL(location.href).searchParams.get("card") || "").trim().toUpperCase(), false, false));
    renderCard((new URL(location.href).searchParams.get("card") || "").trim().toUpperCase(), false, false);
  } catch (error) {
    view.replaceChildren(el("p", "unknown-card", "卡牌資料暫時無法載入，請重新整理。"));
    search.disabled = true;
    category.disabled = true;
  }
})();
