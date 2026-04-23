const fs = require('fs');

// 1. Load your current 1000 activities
const rawData = fs.readFileSync('Neev_All_Activities.json', 'utf8');
let activities = JSON.parse(rawData);

// 2. Define the keyword matchers for the Energy Levels
const highEnergyKeywords = ["Gross Motor", "Vestibular", "Proprioception", "Core Strength", "Postural", "Praxis", "Motor Planning"];

const focusedKeywords = ["Fine Motor", "Cognitive", "Numeracy", "Literacy", "Visual-Motor", "Problem Solving", "Pincer", "Manipulation", "Spatial", "Attention", "Memory", "Tool", "Coordination", "Bilateral", "Bimanual", "Figure-Ground", "Stereognosis", "Nature", "Visual Search", "Discrimination"];

const lowEnergyKeywords = ["Sensory", "Speech", "Language", "Social", "Self Help", "Auditory", "Self-Regulation", "Desensitization", "Gustatory", "Olfactory", "Body Scheme", "Joint Attention", "Symbolic", "Rhythm", "Timing", "Object Permanence", "Visual Tracking", "Visual Processing", "Dressing", "Feeding", "Chores", "Imitation", "Oral Motor"];

// Helper function to assign energy and duration based on domain string
function categorizeActivity(domain) {
    let energy_level = "Uncategorized";
    let duration_mins = 5;

    // Convert to lowercase for easier matching
    let domainLower = domain.toLowerCase();

    // Check High Energy
    if (highEnergyKeywords.some(keyword => domainLower.includes(keyword.toLowerCase()))) {
        return { energy_level: "High Energy", duration_mins: 10 };
    }
    // Check Focused
    if (focusedKeywords.some(keyword => domainLower.includes(keyword.toLowerCase()))) {
        return { energy_level: "Focused", duration_mins: 5 };
    }
    // Check Low Energy
    if (lowEnergyKeywords.some(keyword => domainLower.includes(keyword.toLowerCase()))) {
        return { energy_level: "Low Energy", duration_mins: 5 };
    }

    // Fallback just in case
    return { energy_level: "Focused", duration_mins: 5 }; 
}

// 3. Loop through and update every activity
activities = activities.map(activity => {
    const category = categorizeActivity(activity.domain);
    return {
        ...activity,
        energy_level: category.energy_level,
        duration_mins: category.duration_mins
    };
});

// 4. Save the updated database to a new file
fs.writeFileSync('Neev_Database_Final.json', JSON.stringify(activities, null, 2));

console.log("Success! Added 'energy_level' and 'duration_mins' to all 1000 activities.");