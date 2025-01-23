document.addEventListener("DOMContentLoaded", async () => {
  const salahTimesDiv = document.getElementById("salah-times");
  const loadingDiv = document.getElementById("loading");
  const clockDiv = document.getElementById("clock");
  const themeToggle = document.getElementById("theme-toggle");

  const city = "Warsaw";
  const country = "Poland";
  const notificationIntervals = {};
  const soundIntervals = {};

  const notificationSound = new Audio("sound/notification.mp3");

  const fetchSalahTimes = async () => {
    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=3&school=1`
    );
    const data = await response.json();
    return data.data.timings;
  };

  const updateClock = () => {
    const now = new Date();
    clockDiv.textContent = now.toLocaleTimeString();
  };
  setInterval(updateClock, 1000);

  themeToggle.addEventListener("click", () => {
    document.body.dataset.theme =
      document.body.dataset.theme === "dark" ? "light" : "dark";
    themeToggle.textContent =
      document.body.dataset.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  });

  const startSound = (salah) => {
    stopSound(salah);
    soundIntervals[salah] = setInterval(() => {
      notificationSound.play();
    }, 3000);
  };

  const stopSound = (salah) => {
    if (soundIntervals[salah]) {
      clearInterval(soundIntervals[salah]);
      delete soundIntervals[salah];
    }
  };

  const sendNotification = (salah, time) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(`${salah} Time!`, {
        body: `It's time for ${salah} at ${time}.`,
        actions: [
          { action: "ok", title: "OK" },
          { action: "snooze5", title: "Snooze 5 mins" },
          { action: "snooze10", title: "Snooze 10 mins" },
          { action: "snooze15", title: "Snooze 15 mins" },
        ],
      });

      startSound(salah);

      notification.onclick = (event) => {
        switch (event.action) {
          case "snooze5":
            stopSound(salah);
            clearInterval(notificationIntervals[salah]);
            setTimeout(() => sendNotification(salah, time), 5 * 60 * 1000);
            break;
          case "snooze10":
            stopSound(salah);
            clearInterval(notificationIntervals[salah]);
            setTimeout(() => sendNotification(salah, time), 10 * 60 * 1000);
            break;
          case "snooze15":
            stopSound(salah);
            clearInterval(notificationIntervals[salah]);
            setTimeout(() => sendNotification(salah, time), 15 * 60 * 1000);
            break;
          default:
            clearInterval(notificationIntervals[salah]);
            stopSound(salah);
        }
      };
    }
  };

  const scheduleReminders = (timings) => {
    Object.entries(timings).forEach(([salah, time]) => {
      const [hours, minutes] = time.split(":").map(Number);
      const salahDate = new Date();
      salahDate.setHours(hours, minutes, 0);

      const timeUntilSalah = salahDate - new Date();
      if (timeUntilSalah > 0) {
        setTimeout(() => {
          notificationIntervals[salah] = setInterval(() => {
            sendNotification(salah, time);
          }, 60 * 1000);
        }, timeUntilSalah);
      }
    });
  };

  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission !== "granted") {
        alert("Please enable notifications for reminders to work.");
      }
    });
  }

  try {
    const timings = await fetchSalahTimes();
    const mainSalahTimes = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const filteredTimings = Object.entries(timings).filter(([key]) =>
      mainSalahTimes.includes(key)
    );

    salahTimesDiv.innerHTML = "";
    filteredTimings.forEach(([salah, time]) => {
      const salahElement = document.createElement("div");
      salahElement.textContent = `${salah}: ${time}`;
      salahTimesDiv.appendChild(salahElement);
    });loadingDiv.classList.add("hidden");
    salahTimesDiv.classList.remove("hidden");

    scheduleReminders(Object.fromEntries(filteredTimings));
  } catch (error) {
    console.error("Error fetching Salah times:", error);
    loadingDiv.textContent = "Failed to load Salah times.";
  }
});