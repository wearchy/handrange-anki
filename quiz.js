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

const quizLength = 20;
const historyKey = "handrange-quiz-results-v1";
const answerGrid = answerRows.flat();
const quizHand = document.querySelector("#quizHand");
const quizProgress = document.querySelector("#quizProgress");
const quizScore = document.querySelector("#quizScore");
const quizAnswers = document.querySelector("#quizAnswers");
const quizFeedback = document.querySelector("#quizFeedback");
const nextQuestionButton = document.querySelector("#nextQuestionButton");
const restartQuizButton = document.querySelector("#restartQuizButton");
const quizSummary = document.querySelector("#quizSummary");
const quizSummaryText = document.querySelector("#quizSummaryText");
const reviewList = document.querySelector("#reviewList");
const quizHistory = document.querySelector("#quizHistory");

let questions = [];
let currentIndex = 0;
let correctCount = 0;
let answered = false;
let quizFinished = false;
let answers = [];
let savedHistory = loadHistory();

function handName(row, column) {
  if (row === column) return `${ranks[row]}${ranks[column]}`;
  if (row < column) return `${ranks[row]}${ranks[column]}s`;
  return `${ranks[column]}${ranks[row]}o`;
}

function colorByKey(key) {
  return colors.find((color) => color.key === key) || colors[colors.length - 1];
}

function allHands() {
  return answerGrid.map((colorKey, index) => {
    const row = Math.floor(index / 13);
    const column = index % 13;
    return { hand: handName(row, column), answer: colorKey, index };
  });
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(historyKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(result) {
  savedHistory = [result, ...savedHistory].slice(0, 20);
  localStorage.setItem(historyKey, JSON.stringify(savedHistory));
  renderHistory();
}

function renderHistory() {
  quizHistory.replaceChildren();
  savedHistory.slice(0, 8).forEach((result) => {
    const item = document.createElement("li");
    const date = new Date(result.finishedAt);
    item.innerHTML = `
      <span>${date.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
      <strong>${result.correct}/${quizLength}</strong>
    `;
    quizHistory.append(item);
  });
}

function renderAnswerButtons() {
  quizAnswers.replaceChildren();
  colors.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-answer";
    button.dataset.color = color.key;
    button.innerHTML = `
      <span class="swatch" data-key="${color.key}" style="--swatch: ${color.value}"></span>
      <span>${index + 1}. ${color.label}</span>
    `;
    button.addEventListener("click", () => answerQuestion(color.key));
    quizAnswers.append(button);
  });
}

function renderQuestion() {
  const question = questions[currentIndex];
  answered = false;
  quizHand.textContent = question.hand;
  quizProgress.textContent = `${currentIndex + 1} / ${quizLength}`;
  quizScore.textContent = String(correctCount);
  quizFeedback.textContent = "";
  nextQuestionButton.disabled = true;
  quizSummary.classList.remove("is-visible");
  [...quizAnswers.querySelectorAll(".quiz-answer")].forEach((button) => {
    button.disabled = false;
    button.classList.remove("is-correct", "is-wrong");
  });
}

function answerQuestion(colorKey) {
  if (answered || quizFinished) return;
  answered = true;

  const question = questions[currentIndex];
  const isCorrect = colorKey === question.answer;
  if (isCorrect) correctCount += 1;

  answers.push({ ...question, picked: colorKey, correct: isCorrect });
  [...quizAnswers.querySelectorAll(".quiz-answer")].forEach((button) => {
    button.disabled = true;
    if (button.dataset.color === question.answer) button.classList.add("is-correct");
    if (button.dataset.color === colorKey && !isCorrect) button.classList.add("is-wrong");
  });

  const answerLabel = colorByKey(question.answer).label;
  quizFeedback.textContent = isCorrect ? `正解: ${answerLabel}` : `不正解。正解は ${answerLabel}`;
  quizScore.textContent = String(correctCount);
  nextQuestionButton.disabled = false;

  if (currentIndex === quizLength - 1) {
    nextQuestionButton.textContent = "結果を見る";
  }
}

function nextQuestion() {
  if (!answered || quizFinished) return;
  if (currentIndex < quizLength - 1) {
    currentIndex += 1;
    renderQuestion();
    return;
  }
  finishQuiz();
}

function finishQuiz() {
  if (quizFinished) return;
  quizFinished = true;
  const accuracy = Math.round((correctCount / quizLength) * 1000) / 10;
  quizSummaryText.textContent = `正解率 ${accuracy}%（${correctCount}/${quizLength}）`;
  reviewList.replaceChildren();

  answers.filter((answer) => !answer.correct).forEach((answer) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${answer.hand}</strong>
      <span>回答: ${colorByKey(answer.picked).label} / 正解: ${colorByKey(answer.answer).label}</span>
    `;
    reviewList.append(item);
  });

  if (!reviewList.children.length) {
    const item = document.createElement("li");
    item.innerHTML = "<strong>Perfect</strong><span>全問正解です。</span>";
    reviewList.append(item);
  }

  quizSummary.classList.add("is-visible");
  nextQuestionButton.disabled = true;
  saveHistory({ finishedAt: new Date().toISOString(), correct: correctCount, accuracy });
}

function restartQuiz() {
  questions = shuffle(allHands()).slice(0, quizLength);
  currentIndex = 0;
  correctCount = 0;
  answered = false;
  quizFinished = false;
  answers = [];
  nextQuestionButton.textContent = "次へ";
  renderQuestion();
}

document.addEventListener("keydown", (event) => {
  if (/^[1-9]$/.test(event.key)) {
    answerQuestion(colors[Number(event.key) - 1].key);
    event.preventDefault();
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    nextQuestion();
    event.preventDefault();
  }
});

renderAnswerButtons();
renderHistory();
restartQuiz();
nextQuestionButton.addEventListener("click", nextQuestion);
restartQuizButton.addEventListener("click", restartQuiz);
