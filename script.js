document.addEventListener('DOMContentLoaded', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    const beverages = ['Water', 'Milk', 'Coffee', 'Tea', 'Juice', 'Cordial'];

    const container = document.getElementById('daysContainer');
    const form = document.getElementById('dietForm');
    const statsContainer = document.getElementById('statsContainer');
    const statsOutput = document.getElementById('statsOutput');
    const refreshBtn = document.getElementById('refreshBtn');

    // 1. Generate the HTML (Same as before)
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

    // 2. Load Saved Data on Startup
    const loadSavedData = () => {
        const savedData = JSON.parse(localStorage.getItem('weeklyDietTracker'));
        if (savedData) {
            Object.keys(savedData).forEach(key => {
                const elements = form.elements[key];
                if (elements) {
                    if (elements.type === 'radio') {
                        // Handle radio buttons
                        const radio = Array.from(form.elements[key]).find(r => r.value === savedData[key]);
                        if (radio) radio.checked = true;
                    } else {
                        // Handle text, range, and select inputs
                        elements.value = savedData[key];
                        // Update range slider text display if applicable
                        if (elements.type === 'range') {
                            elements.nextElementSibling.innerText = savedData[key];
                        }
                    }
                }
            });
            // Automatically generate stats for loaded data
            generateStats(savedData);
        }
    };
    loadSavedData();

    // 3. Refresh Button Logic
    refreshBtn.addEventListener('click', () => {
        form.reset();
        // Reset all range slider span texts back to 3
        document.querySelectorAll('input[type="range"]').forEach(range => {
            range.nextElementSibling.innerText = "3";
        });
        statsContainer.style.display = 'none'; // Hide stats when refreshed
    });

    // 4. Save and Generate Stats Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Gather all form data
        const formData = new FormData(form);
        const dataObj = Object.fromEntries(formData.entries());
        
        // Save to browser LocalStorage
        localStorage.setItem('weeklyDietTracker', JSON.stringify(dataObj));
        
        // Generate the statistics
        generateStats(dataObj);
    });

    function generateStats(data) {
        let healthCounts = { 'Light': 0, 'Medium': 0, 'Heavy': 0 };
        let bevCounts = {};
        let totalRating = 0;
        let ratingCount = 0;

        // Tally up the data
        for (const [key, value] of Object.entries(data)) {
            if (key.includes('-health') && value) {
                healthCounts[value]++;
            }
            if (key.includes('-rating') && value) {
                totalRating += parseInt(value);
                ratingCount++;
            }
            if (key.includes('-bev-') && value) {
                bevCounts[value] = (bevCounts[value] || 0) + 1;
            }
        }

        // Rank Healthiness
        const rankedHealth = Object.entries(healthCounts)
            .sort((a, b) => b[1] - a[1]) // Sort highest to lowest
            .filter(item => item[1] > 0); // Only show ones greater than 0

        // Rank Beverages
        const rankedBevs = Object.entries(bevCounts)
            .sort((a, b) => b[1] - a[1]);

        // Calculate Average Rating
        const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";

        // Build the HTML Output
        let statsHTML = '';

        // Meal Profile Stats
        statsHTML += `<div class="stat-box"><h3>🍽️ Meal Profile Ranking</h3>`;
        if (rankedHealth.length > 0) {
            rankedHealth.forEach((item, index) => {
                statsHTML += `<p class="rank-${index + 1}">#${index + 1} ${item[0]} Meals: ${item[1]}</p>`;
            });
        } else {
            statsHTML += `<p>No meals logged yet.</p>`;
        }
        statsHTML += `</div>`;

        // Beverage Stats
        statsHTML += `<div class="stat-box"><h3>🥤 Top Beverages</h3>`;
        if (rankedBevs.length > 0) {
            rankedBevs.slice(0, 3).forEach((item, index) => { // Show top 3
                statsHTML += `<p class="rank-${index + 1}">#${index + 1} ${item[0]}: ${item[1]} times</p>`;
            });
        } else {
            statsHTML += `<p>No beverages logged yet.</p>`;
        }
        statsHTML += `</div>`;

        // Rating Stats
        statsHTML += `<div class="stat-box"><h3>⭐ Overall Satisfaction</h3>
                      <p>Average Meal Rating: <strong>${avgRating} / 5</strong></p></div>`;

        // Inject and display
        statsOutput.innerHTML = statsHTML;
        statsContainer.style.display = 'block';
        
        // Scroll down to see the stats smoothly
        statsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});
