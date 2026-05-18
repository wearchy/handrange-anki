const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

const colors = [
  { key: "blueDark", label: "8人（強）", value: "#173763" },
  { key: "red", label: "8人（中）", value: "#bd2828" },
  { key: "yellow", label: "8人（弱）", value: "#f0b83e" },
  { key: "green", label: "6〜7人", value: "#3f8a49" },
  { key: "cyan", label: "4〜5人", value: "#48a8ca" },
  { key: "white", label: "3人", value: "#ffffff" },
  { key: "purple", label: "2人", value: "#9b9b9b" },
  { key: "pink", label: "BBのみBTNのレイズにコール", value: "#f49ad4" },
  { key: "gray", label: "フォールド", value: "#909090" },
];

const storageKey = "handrange-paint-grid-v2";
const resultsKey = "handrange-paint-results-v1";
const defaultColorKey = "gray";
const answerRows = [
  ["blueDark", "blueDark", "red", "red", "red", "green", "green", "green", "green", "green", "green", "green", "green"],
  ["blueDark", "blueDark", "red", "yellow", "green", "green", "white", "white", "white", "white", "white", "white", "white"],
  ["red", "yellow", "blueDark", "yellow", "green", "cyan", "white", "white", "white", "purple", "purple", "purple", "purple"],
  ["yellow", "green", "cyan", "red", "yellow", "cyan", "white", "white", "purple", "pink", "pink", "pink", "pink"],
  ["green", "cyan", "white", "cyan", "red", "green", "cyan", "purple", "pink", "pink", "pink", "pink", "gray"],
  ["cyan", "white", "white", "white", "white", "red", "cyan", "white", "purple", "pink", "gray", "gray", "gray"],
  ["white", "pink", "pink", "pink", "white", "purple", "yellow", "white", "purple", "pink", "gray", "gray", "gray"],
  ["white", "pink", "pink", "gray", "gray", "pink", "pink", "yellow", "white", "purple", "pink", "gray", "gray"],
  ["purple", "pink", "gray", "gray", "gray", "gray", "gray", "gray", "green", "white", "purple", "pink", "gray"],
  ["pink", "pink", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "green", "purple", "pink", "gray"],
  ["pink", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "cyan", "pink", "gray"],
  ["pink", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "cyan", "gray"],
  ["pink", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray", "cyan"],
];
const answerGrid = answerRows.flat();
const palette = document.querySelector("#palette");
const rangeGrid = document.querySelector("#rangeGrid");
const currentSwatch = document.querySelector("#currentSwatch");
const currentLabel = document.querySelector("#currentLabel");
const activeHand = document.querySelector("#activeHand");
const undoButton = document.querySelector("#undoButton");
const clearButton = document.querySelector("#clearButton");
const checkButton = document.querySelector("#checkButton");
const answerStatus = document.querySelector("#answerStatus");
const scoreText = document.querySelector("#scoreText");
const resultHistory = document.querySelector("#resultHistory");

let selectedColor = colors[0];
let activeIndex = 0;
let isPointerPainting = false;
const history = [];

const savedGrid = loadGrid();
let savedResults = loadArray(resultsKey);
const cells = [];

function handName(row, column) {
  if (row === column) return `${ranks[row]}${ranks[column]}`;
  if (row < column) return `${ranks[row]}${ranks[column]}s`;
  return `${ranks[column]}${ranks[row]}o`;
}

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadGrid() {
  return loadArray(storageKey);
}

function saveGrid() {
  localStorage.setItem(storageKey, JSON.stringify(cells.map((cell) => cell.dataset.color || "")));
}

function currentGrid() {
  return cells.map((cell) => cell.dataset.color || defaultColorKey);
}

function colorByKey(key) {
  return colors.find((color) => color.key === key) || colors[0];
}

function applyCellColor(cell, colorKey, remember = true) {
  const previous = cell.dataset.color || "";
  if (previous === colorKey) return;

  if (remember) {
    history.push({ index: Number(cell.dataset.index), previous });
    if (history.length > 120) history.shift();
  }

  const color = colorByKey(colorKey);
  cell.dataset.color = color.key;
  cell.dataset.result = "";
  cell.style.setProperty("--cell-bg", color.value);
  saveGrid();
}

function paintActive() {
  applyCellColor(cells[activeIndex], selectedColor.key);
}

function eraseActive() {
  applyCellColor(cells[activeIndex], defaultColorKey);
}

function setActive(index) {
  cells[activeIndex]?.classList.remove("is-active");
  activeIndex = Math.max(0, Math.min(cells.length - 1, index));
  const cell = cells[activeIndex];
  cell.classList.add("is-active");
  cell.focus({ preventScroll: true });
  activeHand.textContent = cell.dataset.hand;
}

function moveActive(deltaRow, deltaColumn) {
  const row = Math.floor(activeIndex / 13);
  const column = activeIndex % 13;
  const nextRow = Math.max(0, Math.min(12, row + deltaRow));
  const nextColumn = Math.max(0, Math.min(12, column + deltaColumn));
  setActive(nextRow * 13 + nextColumn);
}

function setSelectedColor(color) {
  selectedColor = color;
  document.querySelectorAll(".palette-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.color === color.key);
    button.setAttribute("aria-selected", String(button.dataset.color === color.key));
  });
  currentSwatch.style.setProperty("--swatch", color.value);
  currentSwatch.dataset.key = color.key;
  currentLabel.textContent = color.label;
}

function createPalette() {
  colors.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-option";
    button.dataset.color = color.key;
    button.setAttribute("role", "option");
    button.innerHTML = `
      <span class="swatch" data-key="${color.key}" style="--swatch: ${color.value}"></span>
      <span class="palette-label">${color.label}</span>
      <span class="palette-key">${index + 1}</span>
    `;
    button.addEventListener("click", () => {
      setSelectedColor(color);
      cells[activeIndex]?.focus({ preventScroll: true });
    });
    palette.append(button);
  });
}

function createGrid() {
  ranks.forEach((_, row) => {
    ranks.forEach((__, column) => {
      const index = row * 13 + column;
      const hand = handName(row, column);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(index);
      cell.dataset.hand = hand;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", hand);
      const label = document.createElement("span");
      label.className = "cell-label";
      label.textContent = hand;
      cell.append(label);
      cell.addEventListener("click", () => {
        setActive(index);
        paintActive();
      });
      cell.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        isPointerPainting = true;
        setActive(index);
        paintActive();
      });
      cell.addEventListener("pointerenter", () => {
        if (!isPointerPainting) return;
        setActive(index);
        paintActive();
      });
      cell.addEventListener("focus", () => {
        setActive(index);
      });
      cells.push(cell);
      rangeGrid.append(cell);
      applyCellColor(cell, savedGrid[index] || defaultColorKey, false);
    });
  });

  document.addEventListener("pointerup", () => {
    isPointerPainting = false;
  });
}

function undo() {
  const last = history.pop();
  if (!last) return;
  applyCellColor(cells[last.index], last.previous || defaultColorKey, false);
}

function clearGrid() {
  history.push(...cells.map((cell, index) => ({ index, previous: cell.dataset.color || defaultColorKey })));
  cells.forEach((cell) => applyCellColor(cell, defaultColorKey, false));
  saveGrid();
}

function updateAnswerStatus() {
  answerStatus.textContent = "固定";
}

function renderResults() {
  resultHistory.replaceChildren();
  savedResults.slice(0, 8).forEach((result) => {
    const item = document.createElement("li");
    const date = new Date(result.checkedAt);
    item.innerHTML = `
      <span>${date.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
      <strong>${result.accuracy}%</strong>
    `;
    resultHistory.append(item);
  });
}

function checkAnswer() {
  const grid = currentGrid();
  const correct = grid.reduce((count, color, index) => {
    const isCorrect = color === answerGrid[index];
    cells[index].dataset.result = isCorrect ? "correct" : "wrong";
    return count + Number(isCorrect);
  }, 0);
  const accuracy = Math.round((correct / cells.length) * 1000) / 10;
  const result = {
    checkedAt: new Date().toISOString(),
    correct,
    total: cells.length,
    accuracy,
  };

  savedResults = [result, ...savedResults].slice(0, 30);
  localStorage.setItem(resultsKey, JSON.stringify(savedResults));
  scoreText.textContent = `正解率 ${accuracy}%（${correct}/${cells.length}）を保存しました。`;
  renderResults();
}

document.addEventListener("keydown", (event) => {
  if (document.activeElement?.closest(".actions, .quiz-actions")) return;

  if (/^[1-9]$/.test(event.key)) {
    setSelectedColor(colors[Number(event.key) - 1]);
    event.preventDefault();
    return;
  }

  const actions = {
    ArrowUp: () => moveActive(-1, 0),
    ArrowDown: () => moveActive(1, 0),
    ArrowLeft: () => moveActive(0, -1),
    ArrowRight: () => moveActive(0, 1),
    " ": paintActive,
    Spacebar: paintActive,
    e: eraseActive,
    E: eraseActive,
    Backspace: eraseActive,
  };

  const action = actions[event.key];
  if (!action) return;
  action();
  event.preventDefault();
});

undoButton.addEventListener("click", undo);
clearButton.addEventListener("click", clearGrid);
checkButton.addEventListener("click", checkAnswer);

createPalette();
createGrid();
setSelectedColor(selectedColor);
setActive(0);
updateAnswerStatus();
renderResults();
