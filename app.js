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
  let notificationAllowed = false;

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        notificationAllowed = true;
      } else {
        alert("Notifications are required for reminders to work.");
      }
    } else {
      alert("Notifications are not supported on this browser.");
    }
  };

  const showNotificationPermissionPrompt = () => {
    const allowNotificationsDiv = document.createElement("div");
    allowNotificationsDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #fff;
      padding: 10px 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    allowNotificationsDiv.innerHTML = `
      <p style="margin: 0; font-size: 14px;">Do you allow notifications for Salah reminders?</p>
      <button id="allow-notifications" style="margin: 10px 5px; padding: 5px 10px;">Allow</button>
      <button id="deny-notifications" style="margin: 10px 5px; padding: 5px 10px;">Deny</button>
    `;
    document.body.appendChild(allowNotificationsDiv);

    const allowButton = document.getElementById("allow-notifications");
    const denyButton = document.getElementById("deny-notifications");

    allowButton.addEventListener("click", async () => {
      await requestNotificationPermission();
      document.body.removeChild(allowNotificationsDiv);
    });

    denyButton.addEventListener("click", () => {
      alert("You can enable notifications later in your browser settings.");
      document.body.removeChild(allowNotificationsDiv);
    });
  };

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

  // Handle theme toggle
  const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    themeToggle.textContent =
      theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  };

  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const newTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save to localStorage
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
      if (timeUntilSalah > 0 && notificationAllowed) {
        setTimeout(() => {
          const notification = new Notification(`${salah} Time!`, {
            body: `It's time for ${salah} at ${time}.`,
          });
          notificationSound.play();
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
    });
    loadingDiv.classList.add("hidden");
    salahTimesDiv.classList.remove("hidden");

    scheduleReminders(Object.fromEntries(filteredTimings));
  } catch (error) {
    console.error("Error fetching Salah times:", error);
    loadingDiv.textContent = "Failed to load Salah times.";
  }

  showNotificationPermissionPrompt();
});
