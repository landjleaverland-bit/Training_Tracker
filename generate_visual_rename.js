const fs = require('fs');
const path = require('path');

// Manually constructed mapping based on visual inspection
// File Index (unnamed (X)) -> Exercise Name
const manualMapping = {
    // Start with offset -3 (File 3 -> Item 0)
    3: "Front Lever Raises",
    4: "Offset Pull-ups",
    5: "1 Arm Assisted Pull-Up",
    6: "Pendlay Rows",
    7: "Seated Row",
    8: "Narrow Push-ups",
    9: "TRX Push-ups",
    10: "Shoulder Press Machine",
    11: "Dumbbell Flies",
    12: "Tricep Dips",
    13: "Pistol Squats",
    14: "Leg Extension",
    15: "Rack Pulls",
    16: "Leg Curl",
    17: "Glute Bridges",
    18: "Radial Wrist Tilts",
    19: "Wrist Rotations",
    20: "Archer Rows",
    21: "One Arm Dumbbell Shrugs",
    22: "Prone Overhead Dumbbell Press",
    23: "Scapular Holds",
    24: "Scapular Pull-ups",
    25: "Dumbbell Overhead Rotations",
    26: "External Side Lying Rotations",
    27: "Prone Bench Rotations",
    28: "Cable External Rotations",
    29: "Cable Internal Rotation",
    30: "Internal Side Lying Rotations",
    31: "Wrist Curls",
    32: "Hanging L Hold",
    33: "Supine Leg Raises",
    34: "Lever Raises (tucked)", // Handling the combined item 31/32/33

    // Jump to Item 34 "Lower Ab Crunches" at File 35 (Offset -1)
    35: "Lower Ab Crunches",
    36: "Weighted Crunches",
    37: "Dead Bug",
    38: "Boat Pose",
    39: "V Sits",
    40: "Kettle Bell Twists",
    41: "Twisting Crunches",
    42: "Supine Windscreen Wipers", // Assuming split
    43: "Hanging Windscreen Wipers",
    44: "Thread the Needle",
    45: "Dolphin Plank",
    46: "Copenhagen Plank",
    // "Side Plank" (Item 46) skipped? Or at 47?
    // Visual check said 47 is Prone Dish.
    // So Side Plank might be missing.

    // Jump to Item 47 "Prone Dish Hold" at File 47 (Offset 0)
    47: "Prone Dish Hold",
    48: "Supine Dish Hold", // Visual check: Hollow body looking
    49: "Hollow Body Hold",
    50: "Prone Dish Lifts",
    51: "Bicep Stretch",
    52: "Finger Stretches",
    53: "Pec Stretch",
    54: "Lat Stretch",
    55: "Wrist Stetches",
    56: "Pancake Fold",
    57: "Open Books",
    58: "Good Mornings",
    59: "Calf Stretch",
    60: "Donkey Calf Raise",
    61: "1 Leg Calf Squats",
    62: "Wall Calf Stretch",
    63: "Fishermans",
    64: "Barre Lift",
    65: "Fire Hydrants",
    66: "Supine Quad Stretch",
    67: "Cossack Squats", // Visual verified! Item 67.
    68: "Front Splits", // Visual verified. Item 68.
    69: "Front Splits_2", // Visual: Splits again. Extra.

    // Resume at Item 69 "Side Splits" at File 70? (Offset -1)
    70: "Side Splits",
    71: "Front Swings",
    72: "Side Swings",
    73: "Hamstring Stretch",
    74: "Butterfly",
    75: "Horse Squat",
    76: "Prone Frog", // Visual Verified File 76 is Prone Frog
    77: "Glute Stretch", // Visual Verified File 77 is Glute Stretch
    78: "Childs Pose", // Visual Verified File 78 is Childs Pose
    79: "Pigeon Pose", // Visual Verified File 79 is Pigeon Pose
    80: "Pigeon Pose_2", // Visual Verified File 80 is Pigeon Pose variation
    81: "Seated_Figure_4", // Visual Verified File 81 is Seated Figure 4
};

// Files not in the map will be marked.

console.log("#!/bin/bash");
console.log("mkdir -p backup");
console.log("cp * backup/ 2>/dev/null || true");

Object.keys(manualMapping).forEach(key => {
    let filename = `unnamed (${key}).jpg`;
    let newName = manualMapping[key].replace(/ /g, "_").replace(/\//g, "-").replace(/[()]/g, "") + ".jpg";
    console.log(`mv "${filename}" "${newName}"`);
});

// Handle the Stragglers (80, 81, 82 and unnamed 0, 1, 2)
// I'll leave them for manual rename or map them if I consistently ID them.
// "Pigeon Pose" is likely File 80.
console.log(`mv "unnamed (80).jpg" "Pigeon_Pose.jpg"`);

// Suggest renaming users to investigate remaining
console.log(`echo "Renaming complete. Check 'unnamed' files manually."`);
