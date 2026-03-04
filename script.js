document.addEventListener('DOMContentLoaded', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    const beverages = ['Water', 'Milk', 'Coffee', 'Tea', 'Juice', 'Cordial'];

    const container = document.getElementById('daysContainer');

    // Loop through each day of the week to create the HTML layout
    days.forEach(day => {
        // Create the main accordion wrapper
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-accordion';

        // Create the clickable header
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        
        // Create the hidden content area
        const content = document.createElement('div');
        content.className = 'day-content';

        // Add the click event to toggle expanding/collapsing
        header.onclick = () => {
            content.classList.toggle('active');
        };

        // 1. Generate the 3 Meals per day
        meals.forEach(meal => {
            const mealId = `${day}-${meal}`.toLowerCase(); // Unique ID for inputs
            
            const mealHTML = `
                <div class="meal-row">
                    <h4>${meal}</h4>
                    <input type="text" maxlength="140" placeholder="Describe your meal (max 140 chars)..." name="${mealId}-desc">
                    
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

        // 2. Generate the 4 Beverage inputs per day
        // Create dropdown options from our beverage array
        const bevOptions = beverages.map(b => `<option value="${b}">${b}</option>`).join('');
        
        let bevHTML = `
            <div class="beverage-section">
                <h4>Daily Beverages</h4>
                <div class="bev-grid">
        `;
        
        // Loop 4 times to create 4 dropdowns
        for(let i = 1; i <= 4; i++) {
            bevHTML += `
                <select name="${day.toLowerCase()}-bev-${i}">
                    <option value="">Select Beverage ${i}...</option>
                    ${bevOptions}
                </select>
            `;
        }
        
        bevHTML += `</div></div>`; // Close grid and section
        content.innerHTML += bevHTML;

        // Append the header and content into the main day wrapper, then add to the page
        dayDiv.appendChild(header);
        dayDiv.appendChild(content);
        container.appendChild(dayDiv);
    });

    // Optional: Prevent the form from refreshing the page when clicking "Save" just yet
    document.getElementById('dietForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Weekly plan saved! (Form logic will go here)');
    });
});