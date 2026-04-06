const express = require("express");
const fs = require("fs");
const yaml = require("js-yaml");

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

const PORT = process.env.PORT || 3000;

// Улучшенная функция проверки, которая учитывает конкретные даты (specificDates)
function runsToday(train, todayStr) {
  if (train.exceptions && train.exceptions.includes(todayStr)) return false;

  if (train.specificDates && train.specificDates.includes(todayStr)) return true;

  if (train.schedule) {
    for (let period of train.schedule) {
      if (todayStr >= period.from && todayStr <= period.to) {
        const day = parseInt(todayStr.slice(-2));

        if (
          (period.parity === "even" && day % 2 === 0) ||
          (period.parity === "odd" && day % 2 !== 0) ||
          (period.parity === "everyday")
        ) {
          return true;
        } else {
          return false;
        }
      }
    }
  }
  return false;
}

// Функция для загрузки данных из YAML файла
function loadSchedule() {
  try {
    const fileContents = fs.readFileSync('./schedule.yaml', 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error("Ошибка чтения файла schedule.yaml:", e);
    return { trains: [] };
  }
}

// Главная
app.get("/", (req, res) => {
  res.send("🚀 Сервер з розкладом працює (дані завантажуються з YAML)!");
});

// API
app.get("/schedule", (req, res) => {
  const now = new Date();
  // Для тестирования можно задать конкретную дату, например: const todayStr = "2026-04-01";
  const todayStr = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Загружаем поезда из файла при каждом запросе
  const data = loadSchedule();
  const trains = data.trains || [];

  const result = trains.map(train => {
    const [h, m] = train.time.split(":");
    const trainMinutes = parseInt(h) * 60 + parseInt(m);
    const diff = trainMinutes - currentMinutes;

    const isRunning = runsToday(train, todayStr);

    return {
      number: train.number,
      route: train.route,
      time: train.time,
      runsToday: isRunning,
      minutesLeft: diff,
      status: !isRunning
        ? "not_running"
        : diff < 0
        ? "gone"
        : diff < 60
        ? "soon"
        : "later",
      stops: train.stops || [],
      periodicityText: train.periodicityText || "",
      changes: train.changes || []
    };
  });

  res.json({
    station: "Вільногірськ",
    date: todayStr,
    trains: result
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
