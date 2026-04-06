const express = require("express");
const cors = require("cors");
const fs = require("fs");
const yaml = require("js-yaml");

const app = express();
app.use(cors());

const stationName = "Вільногірськ";

// Функція для завантаження даних з YAML файлу
function loadBuses() {
  try {
    const fileContents = fs.readFileSync('./buses.yaml', 'utf8');
    return yaml.load(fileContents) || [];
  } catch (e) {
    console.error("Помилка читання файлу buses.yaml:", e);
    return [];
  }
}

app.get("/", (req, res) => {
  res.send("🚌 Сервер автобусів працює (дані завантажуються з YAML)!");
});

app.get("/api/buses", (req, res) => {
  // Завантажуємо дані при кожному запиті, щоб не потрібно було перезапускати сервер
  const busesData = loadBuses();
  
  res.json({
    station: stationName,
    buses: busesData
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Сервер автобусів запущено на порту ${PORT}`);
});
