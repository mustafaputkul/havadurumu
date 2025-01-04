const apiKey = "API ANAHTARINIZ";
const defaultCity = "Istanbul";

const weatherDescriptions = {
    "clear sky": "Açık Hava",
    "few clouds": "Bulutlu",
    "scattered clouds": "Dağınık Bulutlu",
    "light intensity shower rain": "Hafif Sağanak Yağmur",
    "broken clouds": "Parçalı Bulutlu",
    "shower rain": "Sağanak Yağmur",
    "overcast clouds": "Kapalı Bulutlu",
    "rain": "Yağmur",
    "thunderstorm": "Gök Gürültülü Fırtına",
    "snow": "Kar",
    "mist": "Sis",
    "haz": "Sis",
};

function translateWeatherDescription(description) {
    return weatherDescriptions[description.toLowerCase()] || description;
}

document.addEventListener("DOMContentLoaded", () => {
    fetchWeatherData(defaultCity);
    setDateAndDay();
    document.getElementById("search-location").addEventListener("click", () => {
        const city = document.getElementById("city-input").value.trim();
        if (city) {
            fetchWeatherData(city);
            document.getElementById("city-input").value = "";
        } else {
            alert("Lütfen bir şehir adı girin.");
        }
    });
});

function setDateAndDay() {
    const today = new Date();
    const dayName = today.toLocaleDateString('tr-TR', { weekday: 'long' });
    const formattedDate = today.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    document.getElementById("day-name").textContent = dayName;
    document.getElementById("date").textContent = formattedDate;
}

async function fetchWeatherData(city) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        if (currentWeatherResponse.ok && forecastResponse.ok) {
            updateWeatherUI(currentWeatherData);
            updateForecastUI(forecastData);
        } else {
            alert(`Hata: ${currentWeatherData.message || forecastData.message}`);
        }
    } catch (error) {
        console.error("Hava durumu verisi alınamadı:", error);
    }
}

function updateWeatherUI(data) {
    const { name, sys, main, weather, wind } = data;
    document.getElementById("location").textContent = `${name}, ${sys.country}`;
    document.getElementById("temperature").textContent = `${Math.round(main.temp)}°C`;

    const description = translateWeatherDescription(weather[0].description);
    document.getElementById("weather-description").textContent = description;

    const weatherIcon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    document.getElementById("weather-icon").setAttribute("src", weatherIcon);
    document.getElementById("humidity").textContent = `${main.humidity} %`;
    document.getElementById("precipitation").textContent = main.rain ? `${main.rain["1h"] || 0} mm` : "0 mm";
    document.getElementById("wind-speed").textContent = `${Math.round(wind.speed)} km/h`;
}

function updateForecastUI(data) {
    const forecastList = document.getElementById("forecast-list");
    forecastList.innerHTML = "";

    const dailyForecasts = data.list.filter((item) => item.dt_txt.includes("12:00:00"));
    dailyForecasts.forEach((forecast) => {
        const { main, weather, dt_txt } = forecast;
        const date = new Date(dt_txt);
        const dayName = date.toLocaleDateString("tr-TR", { weekday: "short" });

        const li = document.createElement("li");
        li.innerHTML = `
            <i class="bx" style="background-image: url('https://openweathermap.org/img/wn/${weather[0].icon}@2x.png'); background-size: cover;"></i>
            <span>${dayName}</span>
            <span class="day-temp">${Math.round(main.temp)}°C</span>
        `;
        forecastList.appendChild(li);
    });
}

let precipitationText = "Yağış yok";
if (data.weather[0].description.toLowerCase().includes("rain")) {
    precipitationText = "Yağmur bekleniyor ancak yağış miktarı ölçülemiyor";
}

if (data.rain && (data.rain["1h"] || data.rain["3h"])) {
    precipitationText = `${data.rain["1h"] || data.rain["3h"]} mm`;
}

document.getElementById("precipitation").textContent = precipitationText;

async function fetchWeatherData(city) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        if (currentWeatherResponse.ok && forecastResponse.ok) {
            updateWeatherUI(currentWeatherData);
            updateForecastUI(forecastData);

            // Hava kalitesi ve UV indeksi verisi al ve UI'yi güncelle
            const { coord } = currentWeatherData;
            fetchAirQualityData(coord.lat, coord.lon);
            fetchUVIndexData(coord.lat, coord.lon);
        } else {
            alert(`Hata: ${currentWeatherData.message || forecastData.message}`);
        }
    } catch (error) {
        console.error("Hava durumu verisi alınamadı:", error);
    }
}

async function fetchAirQualityData(lat, lon) {
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(airQualityUrl);
        const data = await response.json();

        if (response.ok) {
            const aqi = data.list[0].main.aqi;
            const airQualityDescriptions = ["İyi", "Orta", "Hassas", "Kötü", "Çok Kötü"];
            document.getElementById("air-quality").textContent = airQualityDescriptions[aqi - 1];
        } else {
            console.error("Hava kalitesi verisi alınamadı:", data);
        }
    } catch (error) {
        console.error("Hava kalitesi API hatası:", error);
    }
}

async function fetchUVIndexData(lat, lon) {
    const uvIndexUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(uvIndexUrl);
        const data = await response.json();

        if (response.ok) {
            const uvi = data.current.uvi;
            document.getElementById("uv-index").textContent = uvi.toFixed(1);
        } else {
            console.error("UV indeksi verisi alınamadı:", data);
        }
    } catch (error) {
        console.error("UV indeksi API hatası:", error);
    }
}

