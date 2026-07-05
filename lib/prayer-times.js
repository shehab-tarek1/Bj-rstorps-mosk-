import yearlyPrayerData from "./prayers-backend.js";

const MONTHS = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December"
];

export function getSwedenDate() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Europe/Stockholm"
    })
  );
}

export function getTodayPrayerTimes() {
  const now = getSwedenDate();

  const month = MONTHS[now.getMonth()];
  const day = String(now.getDate());

  const monthData = yearlyPrayerData.months[month];

  if (!monthData) return null;

  return monthData.find((p) => p.Dat === day) || null;
}

export function getPrayerSchedule() {
  const today = getTodayPrayerTimes();

  if (!today) return [];

  return [
    {
      id: "fajr",
      name: "الفجر",
      time: today.Fajr
    },
    {
      id: "dhuhr",
      name: "الظهر",
      time: today.Dhohr
    },
    {
      id: "asr",
      name: "العصر",
      time: today.Asr
    },
    {
      id: "maghrib",
      name: "المغرب",
      time: today.Magrib
    },
    {
      id: "isha",
      name: "العشاء",
      time: today.Isha
    }
  ];
}

export function getMinutesNow() {
  const now = getSwedenDate();

  return now.getHours() * 60 + now.getMinutes();
}

export function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}