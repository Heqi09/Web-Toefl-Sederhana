let questions = [];
let userAnswers = [];
let currentQuestion = 0;
let score = 0;
let listeningCount = 0;
let structureCount = 0;
let readingCount = 0;
let timeLeft = 1800; 
let timerInterval;
let data = {}; 


function enableProfileEdit() {
  document.getElementById('edit-profile').classList.remove('hidden');
}

function cancelEdit() {
  document.getElementById('edit-profile').classList.add('hidden');
}

function saveProfile() {
  const newName = document.getElementById('edit-name').value.trim();
  const newNIM = document.getElementById('edit-NIM').value.trim();

  if (!newName || !newNIM) {
    alert("Nama dan NIM tidak boleh kosong!");
    return;
  }

  localStorage.setItem("userName", newName);
  localStorage.setItem("userNIM", newNIM);

  document.getElementById('user-name').textContent = newName;
  document.getElementById('user-NIM').textContent = newNIM;

  document.getElementById('edit-profile').classList.add('hidden');
}

document.addEventListener("DOMContentLoaded", () => {
  const storedName = localStorage.getItem("userName") || "Guest";
  const storedNIM = localStorage.getItem("userNIM") || "240411100153";

  if (document.getElementById("test-username")) {
    document.getElementById("test-username").textContent = storedName;
    document.getElementById("test-userNIM").textContent = storedNIM;
  }

  if (document.getElementById("user-name")) {
    document.getElementById("user-name").textContent = storedName;
    document.getElementById("user-NIM").textContent = storedNIM;
  }

  loadTestHistory();

  const section = document.getElementById("question-section");
  if (section) section.classList.add("hidden");
});

fetch("soal.json")
  .then(response => response.json())
  .then(json => {
    data = json; 
    listeningCount = data.listening.length;
    structureCount = data.structure.length;
    readingCount = data.reading.length;

    questions = [...data.listening, ...data.structure, ...data.reading];
    loadQuestion();
    document.getElementById("start-button").disabled = false;
  })
  .catch(error => {
    console.error("Gagal memuat soal:", error);
    document.getElementById("question-text").textContent = "Gagal memuat soal.";
  });

function startTest() {
  const storedName = localStorage.getItem("userName") || "Guest";
  const storedNIM = localStorage.getItem("userNIM") || "guest@example.com";

  document.getElementById("test-username").textContent = storedName;
  document.getElementById("test-userNIM").textContent = storedNIM;

  document.getElementById("test-container").classList.remove("hidden");
  document.getElementById("question-section").classList.remove("hidden");
  document.getElementById("navigation-buttons").classList.remove("hidden");

  currentQuestion = 0;
  startTimer(1800); 
  loadQuestion();
}

function startTimer(duration) {
  clearInterval(timerInterval); 
  timeLeft = duration;
  document.getElementById("time-left").textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      autoNextSection();
    } else {
      timeLeft--;
      document.getElementById("time-left").textContent = formatTime(timeLeft);
    }
  }, 1000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function autoNextSection() {
  saveCurrentAnswer(); 

  if (currentQuestion < listeningCount + structureCount + readingCount - 1) {
    currentQuestion++;

    if (currentQuestion === listeningCount) {

      startTimer(1800);
    } else if (currentQuestion === listeningCount + structureCount) {

      startTimer(1800);
    }

    loadQuestion();
  } else {
    finishTest();
  }
}

function loadQuestion() {
  if (questions.length === 0) {
    document.getElementById("question-text").textContent = "Soal tidak tersedia.";
    return;
  }

  const question = questions[currentQuestion];
  let jenisSoal = "";
  let nomorDalamJenis = 1;

  if (currentQuestion < listeningCount) {
    jenisSoal = "Listening";
    nomorDalamJenis = currentQuestion + 1;
  } else if (currentQuestion < listeningCount + structureCount) {
    jenisSoal = "Structure";
    nomorDalamJenis = currentQuestion - listeningCount + 1;
  } else {
    jenisSoal = "Reading";
    nomorDalamJenis = currentQuestion - listeningCount - structureCount + 1;
  }

  document.getElementById("question-type-number").textContent = `Soal ${nomorDalamJenis} - ${jenisSoal}`;

  document.querySelectorAll("#question-section audio").forEach(audio => audio.remove());

  document.getElementById("question-text").textContent =
    question.text || "Dengarkan audio dan pilih jawaban yang benar:";

  if (question.audio) {
    const audioElement = document.createElement("audio");
    audioElement.src = question.audio;
    audioElement.controls = true;
    audioElement.setAttribute("id", "listening-audio");
    document.getElementById("question-section").prepend(audioElement);
  }

  const answerList = document.getElementById("answer-options");
  answerList.innerHTML = "";

  question.options.forEach((option, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="radio" name="answer" id="option${index}" value="${option}">
      <label for="option${index}">${option}</label>
    `;
    answerList.appendChild(li);
  });

  const savedAnswer = userAnswers[currentQuestion];
  if (savedAnswer) {
    const selectedInput = document.querySelector(`input[name="answer"][value="${savedAnswer}"]`);
    if (selectedInput) {
      selectedInput.checked = true;
    }
  }
}

function nextQuestion() {
  saveCurrentAnswer();

  const currentQ = questions[currentQuestion];
  if (userAnswers[currentQuestion] === currentQ.correct) {
    score += 10;
  }

  const isLastListening = currentQuestion === listeningCount - 1;
  const isLastStructure = currentQuestion === listeningCount + structureCount - 1;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;

    if (isLastListening) {
      startTimer(1800); 
    } else if (isLastStructure) {
      startTimer(1800); 
    }

    loadQuestion();
  } else {
    finishTest();
  }
}

function saveCurrentAnswer() {
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  userAnswers[currentQuestion] = selectedOption ? selectedOption.value : null;
}

function prevQuestion() {
  saveCurrentAnswer(); 
  if (currentQuestion > 0) {
    currentQuestion--;
    loadQuestion();
  }
}

function finishTest() {
  clearInterval(timerInterval);

  document.getElementById("test-container").classList.add("hidden");
  document.getElementById("score-section").classList.remove("hidden");

  const listeningScore = userAnswers.slice(0, listeningCount)
    .filter((ans, i) => ans === data.listening[i].correct).length;

  const structureScore = userAnswers.slice(listeningCount, listeningCount + structureCount)
    .filter((ans, i) => ans === data.structure[i].correct).length;

  const readingScore = userAnswers.slice(listeningCount + structureCount)
    .filter((ans, i) => ans === data.reading[i].correct).length;

  const scaledScores = convertToTOEFLScore(listeningScore, structureScore, readingScore);

  document.getElementById("score").innerHTML = `
    Listening (Benar): ${listeningScore}<br>
    Structure (Benar): ${structureScore}<br>
    Reading (Benar): ${readingScore}<br><br>
    Skor TOEFL Akhir: <strong>${scaledScores.total}</strong>
  `;

  localStorage.setItem("testScore", scaledScores.total);

  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  riwayat.push({
    tanggal: new Date().toISOString(),
    listening: listeningScore,
    structure: structureScore,
    reading: readingScore,
    total: scaledScores.total
  });
  localStorage.setItem("riwayatTes", JSON.stringify(riwayat));

  window.location.href = "dashboard.html";
}

function convertToTOEFLScore(listeningCorrect, structureCorrect, readingCorrect) {
  const listeningScaled = Math.round((listeningCorrect / 20) * (68 - 31) + 31);
  const structureScaled = Math.round((structureCorrect / 40) * (68 - 31) + 31);
  const readingScaled = Math.round((readingCorrect / 40) * (67 - 31) + 31);

  return {
    listeningScaled,
    structureScaled,
    readingScaled,
    total: Math.round((listeningScaled + structureScaled + readingScaled) * 10 / 3)
  };
}

function printScore() {
  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  const skorTerakhir = riwayat[riwayat.length - 1]; 
  if (skorTerakhir) {
    localStorage.setItem("testScore", skorTerakhir.total);
  }
  window.open("sertifikat.html", "_blank");
}

function loadDashboard() {
  const name = localStorage.getItem("userName") || "Guest";
  const nim = localStorage.getItem("userNIM") || "N/A";
  document.getElementById("user-name").textContent = name;
  document.getElementById("user-NIM").textContent = nim;

  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  const tbody = document.getElementById("test-body");
  tbody.innerHTML = "";

  riwayat.forEach((item, index) => {
    const tanggal = new Date(item.tanggal).toLocaleString("id-ID");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tanggal}</td>
      <td>${item.listening || 0}</td>
      <td>${item.structure || 0}</td>
      <td>${item.reading || 0}</td>
      <td>${item.total || 0}</td>
      <td>
        <button class="btn-cetak" onclick="cetakRiwayat(${index})">Cetak</button>
        <button class="btn-hapus" onclick="hapusRiwayat(${index})">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function hapusRiwayat(index) {
  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  riwayat.splice(index, 1);
  localStorage.setItem("riwayatTes", JSON.stringify(riwayat));
  loadDashboard(); 
}

function cetakRiwayat(index) {
  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  const data = riwayat[index];

  localStorage.setItem("certDate", data.tanggal);
  localStorage.setItem("certListening", data.listening || 0);
  localStorage.setItem("certStructure", data.structure || 0);
  localStorage.setItem("certReading", data.reading || 0);
  localStorage.setItem("certTotal", data.total || 0);

  window.open("sertifikat.html", "_blank");
}

function cetakPDF(index) {
  const riwayat = JSON.parse(localStorage.getItem("riwayatTes")) || [];
  const item = riwayat[index];

  const name = localStorage.getItem("userName") || "Guest";
  const nim = localStorage.getItem("userNIM") || "N/A";
  const tanggal = new Date(item.tanggal).toLocaleString("id-ID");

  const content = `
    Nama: ${name}
    NIM: ${nim}
    Tanggal Tes: ${tanggal}

    Skor Listening: ${item.listening}
    Skor Structure: ${item.structure}
    Skor Reading: ${item.reading}
    Total Skor TOEFL: ${item.total}
  `;

  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TOEFL_${tanggal}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearTestHistory() {
  localStorage.removeItem("riwayatTes");
  loadDashboard(); 
  alert("Riwayat tes berhasil dihapus!");
}

function loadTestHistory() {
  const testHistory = JSON.parse(localStorage.getItem("testHistory")) || [];
  const list = document.getElementById("test-list");
  list.innerHTML = "";

  testHistory.forEach(test => {
    const li = document.createElement("li");
    li.textContent = `Tanggal: ${test.date}, Skor: ${test.score}`;
    list.appendChild(li);
  });
}

function cleanString(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function cleanQuestionData(data) {
  data.forEach(item => {
    item.options = item.options.map(cleanString);
    item.correct = cleanString(item.correct);
  });
  return data;
}

function checkAnswer(userAnswer, correctAnswer) {
  return cleanString(userAnswer) === cleanString(correctAnswer);
}
