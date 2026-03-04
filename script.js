document.addEventListener('DOMContentLoaded', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    const beverages = ['Water', 'Milk', 'Coffee', 'Tea', 'Juice', 'Cordial'];

    const container = document.getElementById('daysContainer');
    const form = document.getElementById('dietForm');
    const statsContainer = document.getElementById('statsContainer');
    const statsOutput = document.getElementById('statsOutput');
    const refreshBtn = document.getElementById('refreshBtn');
    const historyList = document.getElementById('historyList');

    // State array to hold multiple saved weeks
    let savedHistory = JSON.parse(localStorage.getItem('weeklyDietHistory')) || [];

    // 1. Generate the HTML Layout
    days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-accordion';

        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        
        const content = document.createElement('div');
        content.className = 'day-content';

        header.onclick = () => content.classList.toggle('active');

        meals.forEach(meal => {
            const mealId = `${day}-${meal}`.toLowerCase();
            const mealHTML = `
                <div class="meal-row">
                    <h4>${meal}</h4>
                    <input type="text" maxlength="140" placeholder="Describe your meal..." name="${mealId}-desc">
                    <div class="controls-group">
                        <div class="radio-group">
                            <strong>Healthiness:</strong>
                            <label><input type="radio" name="${mealId}-health" value="Light"> Light</label>
                            <label><input type="radio" name="${mealId}-health" value="Medium"> Medium</label>
                            <label><input type="radio" name="${mealId}-health" value="Heavy"> Heavy</label>
                        </div>
                        <div class="rating-group">
                            <strong>Rating (1-5):</strong>
                            <input type="range" name="${mealId}-rating" min="1" max="5" value="3" oninput="this.nextElementSibling.innerText = this.value">
                            <span>3</span>
                        </div>
                    </div>
                </div>
            `;
            content.innerHTML += mealHTML;
        });

        const bevOptions = beverages.map(b => `<option value="${b}">${b}</option>`).join('');
        let bevHTML = `<div class="beverage-section"><h4>Daily Beverages</h4><div class="bev-grid">`;
        for(let i = 1; i <= 4; i++) {
            bevHTML += `<select name="${day.toLowerCase()}-bev-${i}"><option value="">Select Beverage ${i}...</option>${bevOptions}</select>`;
        }
        bevHTML += `</div></div>`;
        content.innerHTML += bevHTML;

        dayDiv.appendChild(header);
        dayDiv.appendChild(content);
        container.appendChild(dayDiv);
    });

    // 2. Refresh / Hard Clear Button Logic
    refreshBtn.addEventListener('click', () => {
        // Force clear all text inputs
        form.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
        // Force uncheck all radio buttons
        form.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        // Force clear all select dropdowns
        form.querySelectorAll('select').forEach(select => select.value = '');
        // Force reset all range sliders to 3
        form.querySelectorAll('input[type="range"]').forEach(range => {
            range.value = 3;
            range.nextElementSibling.innerText = "3";
        });
        
        statsContainer.style.display = 'none';
        
        // Collapse all open menus for a fresh start
        document.querySelectorAll('.day-content.active').forEach(content => {
            content.classList.remove('active');
        });
    });

    // 3. Save and Analyze Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const dataObj = Object.fromEntries(formData.entries());
        
        // Add a timestamp and unique ID so we can tell saves apart
        dataObj.timestamp = new Date().toLocaleString();
        dataObj.id = Date.now().toString();
        
        // Add to history array and save to local storage
        savedHistory.push(dataObj);
        localStorage.setItem('weeklyDietHistory', JSON.stringify(savedHistory));
        
        generateStats(dataObj);
        renderHistory();
    });

    // 4. Populate Form from a Specific Save
    window.loadPastSave = (id) => {
        const entry = savedHistory.find(item => item.id === id);
        if (!entry) return;

        Object.keys(entry).forEach(key => {
            if(key === 'timestamp' || key === 'id') return; // Skip our metadata

            const elements = form.elements[key];
            if (elements) {
                if (elements.type === 'radio') {
                    const radio = Array.from(form.elements[key]).find(r => r.value === entry[key]);
                    if (radio) radio.checked = true;
                } else {
                    elements.value = entry[key];
                    if (elements.type === 'range') {
                        elements.nextElementSibling.innerText = entry[key];
                    }
                }
            }
        });
        generateStats(entry);
        alert(`Loaded plan from ${entry.timestamp}`);
    };

    // 5. Render History List
    function renderHistory() {
        historyList.innerHTML = ''; // Clear list
        if (savedHistory.length === 0) {
            historyList.innerHTML = '<li>No past submissions found.</li>';
            return;
        }

        // Display newest saves at the top
        const reversedHistory = [...savedHistory].reverse();
        
        reversedHistory.forEach(entry => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span><strong>Saved:</strong> ${entry.timestamp}</span>
                <button type="button" class="load-btn" onclick="loadPastSave('${entry.id}')">Load & Review</button>
            `;
            historyList.appendChild(li);
        });
    }

    // 6. Generate Statistics (Same as before)
    function generateStats(data) {
        let healthCounts = { 'Light': 0, 'Medium': 0, 'Heavy': 0 };
        let bevCounts = {};
        let totalRating = 0;
        let ratingCount = 0;

        for (const [key, value] of Object.entries(data)) {
            if (key.includes('-health') && value) healthCounts[value]++;
            if (key.includes('-rating') && value) {
                totalRating += parseInt(value);
                ratingCount++;
            }
            if (key.includes('-bev-') && value) bevCounts[value] = (bevCounts[value] || 0) + 1;
        }

        const rankedHealth = Object.entries(healthCounts).sort((a, b) => b[1] - a[1]).filter(item => item[1] > 0);
        const rankedBevs = Object.entries(bevCounts).sort((a, b) => b[1] - a[1]);
        const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";

        let statsHTML = `<div class="stat-box"><h3>🍽️ Meal Profile Ranking</h3>`;
        if (rankedHealth.length > 0) {
            rankedHealth.forEach((item, index) => statsHTML += `<p class="rank-${index + 1}">#${index + 1} ${item[0]} Meals: ${item[1]}</p>`);
        } else {
            statsHTML += `<p>No meals logged.</p>`;
        }
        statsHTML += `</div><div class="stat-box"><h3>🥤 Top Beverages</h3>`;
        if (rankedBevs.length > 0) {
            rankedBevs.slice(0, 3).forEach((item, index) => statsHTML += `<p class="rank-${index + 1}">#${index + 1} ${item[0]}: ${item[1]} times</p>`);
        } else {
            statsHTML += `<p>No beverages logged.</p>`;
        }
        statsHTML += `</div><div class="stat-box"><h3>⭐ Overall Satisfaction</h3><p>Average Meal Rating: <strong>${avgRating} / 5</strong></p></div>`;

        statsOutput.innerHTML = statsHTML;
        statsContainer.style.display = 'block';
        statsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Initialize history on page load
    renderHistory();
});
