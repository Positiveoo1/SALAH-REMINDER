document.addEventListener("DOMContentLoaded", async () => {
    const salahTimesDiv = document.getElementById("salah-times");
    const loadingDiv = document.getElementById("loading");
    const clockDiv = document.getElementById("clock");
    const themeToggle = document.getElementById("theme-toggle");
  
    const city = "Warsaw";
    const country = "Poland";
  
    // Fetch Salah times with Hanafi and MWL settings
    const fetchSalahTimes = async () => {
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=3&school=1`
      );
      const data = await response.json();
      return data.data.timings;
    };
  
    // Update clock every second
    const updateClock = () => {
      const now = new Date();
      clockDiv.textContent = now.toLocaleTimeString();
    };
    setInterval(updateClock, 1000);
  
    // Handle theme toggle
    themeToggle.addEventListener("click", () => {
      document.body.dataset.theme =
        document.body.dataset.theme === "dark" ? "light" : "dark";
      themeToggle.textContent =
        document.body.dataset.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
  
    try {
      const timings = await fetchSalahTimes();
      const mainSalahTimes = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const filteredTimings = Object.entries(timings).filter(([key]) =>
        mainSalahTimes.includes(key)
      );
  
      // Display Salah times
      salahTimesDiv.innerHTML = "";
      filteredTimings.forEach(([salah, time]) => {
        const salahElement = document.createElement("div");
        salahElement.textContent = `${salah}: ${time}`;
        salahTimesDiv.appendChild(salahElement);
      });
  
      loadingDiv.classList.add("hidden");
      salahTimesDiv.classList.remove("hidden");
    } catch (error) {
      console.error("Error fetching Salah times:", error);
      loadingDiv.textContent = "Failed to load Salah times.";
    }
  });
  