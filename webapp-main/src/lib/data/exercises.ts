/**
 * Comprehensive list of exercises for the Gym Session logger
 * Based on market-leading apps and user request.
 */

export interface ExerciseDefinition {
    id: string; // Unique identifier (e.g., "barbell_squat")
    name: string;
    category: 'Climbing Antagonists' | 'Legs (Compound)' | 'Legs (Isolation)' | 'Push (Chest)' | 'Push (Shoulders)' | 'Pull (Back)' | 'Arms (Biceps)' | 'Arms (Triceps)' | 'Core' | 'Other';
    targetMuscles: string[]; // Primary muscles
    instructions: string[]; // Steps
    images?: string[]; // Paths to animation frames
}

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
    // Climbing Antagonists
    {
        id: 'reverse_wrist_curl',
        name: 'Reverse Wrist Curl',
        category: 'Climbing Antagonists',
        targetMuscles: ['Forearm Extensors'],
        instructions: [
            'Sit with forearm on thigh, palm facing down holding a dumbbell.',
            'Extend your wrist upward (knuckles to ceiling).',
            'Slowly lower back down.'
        ]
    },
    {
        id: 'finger_extensions',
        name: 'Finger Extensions',
        category: 'Climbing Antagonists',
        targetMuscles: ['Finger Extensors'],
        instructions: [
            'Place a resistance band around the tips of your fingers.',
            'Spread your fingers apart against the resistance.',
            'Slowly return to a closed hand position.'
        ]
    },
    {
        id: 'rice_bucket_iron_fist',
        name: 'Rice Bucket: Iron Fist',
        category: 'Climbing Antagonists',
        targetMuscles: ['Forearm', 'Grip'],
        instructions: [
            'Plunge hands deep into a bucket of rice.',
            'Squeeze rice forcefully into a fist.',
            'Release and repeat rhythmically.'
        ]
    },
    {
        id: 'rice_bucket_extensors',
        name: 'Rice Bucket: Extensors',
        category: 'Climbing Antagonists',
        targetMuscles: ['Finger Extensors'],
        instructions: [
            'Bury closed fists into the rice.',
            'Forcefully open fingers against the resistance (splaying them out).',
            'Close fist and repeat.'
        ]
    },
    {
        id: 'wall_angels',
        name: 'Wall Angels',
        category: 'Climbing Antagonists',
        targetMuscles: ['Rotator Cuff', 'Posture'],
        instructions: [
            'Stand with back flat against a wall, arms in a "W" shape.',
            'Slide arms upward to a "Y", keeping elbows/wrists touching the wall.',
            'Slide back down to "W".'
        ]
    },
    {
        id: 'face_pull',
        name: 'Face Pull',
        category: 'Climbing Antagonists',
        targetMuscles: ['Rear Delts', 'Rotator Cuff'],
        instructions: [
            'Set a cable to face height with a rope attachment.',
            'Pull rope to forehead, separating hands and driving elbows back.',
            'Externally rotate shoulders at the peak.'
        ]
    },
    {
        id: 'i_y_t_raises',
        name: 'I-Y-T Raises',
        category: 'Climbing Antagonists',
        targetMuscles: ['Rear Delts', 'Traps'],
        instructions: [
            'Lie prone on an incline bench or use TRX straps.',
            'Raise arms to form an "I", then a "Y", then a "T" shape.',
            'Focus on scapular retraction.'
        ]
    },
    {
        id: 'push_up',
        name: 'Push-Up',
        category: 'Climbing Antagonists',
        targetMuscles: ['Chest', 'Triceps', 'Core'],
        instructions: [
            'Plank position, hands shoulder-width.',
            'Lower chest to floor, elbows tucked at 45 degrees.',
            'Press back up. Note: Pushing opposes the pulling motion of climbing.'
        ]
    },
    // Legs (Compound)
    {
        id: 'bodyweight_squat',
        name: 'Bodyweight Squat',
        category: 'Legs (Compound)',
        targetMuscles: ['Quads', 'Glutes', 'Core'],
        instructions: [
            'Stand with feet shoulder-width apart.',
            'Hinge hips back and bend knees to lower until thighs are parallel to floor.',
            'Drive through feet to stand, keeping chest up.'
        ]
    },
    {
        id: 'barbell_squat',
        name: 'Barbell Squat',
        category: 'Legs (Compound)',
        targetMuscles: ['Quads', 'Glutes', 'Core'],
        instructions: [
            'Place bar on upper back. Feet shoulder-width.',
            'Hinge hips back and bend knees to lower until thighs are parallel to floor.',
            'Drive through feet to stand.'
        ],
        images: ['/exercises/barbell_squat_1.png', '/exercises/barbell_squat_2.png']
    },
    {
        id: 'goblet_squat',
        name: 'Goblet Squat',
        category: 'Legs (Compound)',
        targetMuscles: ['Quads', 'Core'],
        instructions: [
            'Hold a dumbbell or kettlebell against your chest.',
            'Squat down, keeping your chest tall.',
            'Ensure elbows track inside the knees.'
        ]
    },
    {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'Legs (Compound)',
        targetMuscles: ['Hamstrings', 'Glutes', 'Back'],
        instructions: [
            'Stand with bar over mid-foot. Hinge at hips to grip bar.',
            'Flatten back, drive hips forward and push floor away to stand up.',
            'Lower with control.'
        ]
    },
    {
        id: 'romanian_deadlift',
        name: 'Romanian Deadlift (RDL)',
        category: 'Legs (Compound)',
        targetMuscles: ['Hamstrings'],
        instructions: [
            'Start standing with weight.',
            'Hinge hips back with a slight knee bend.',
            'Lower weight until a hamstring stretch is felt, then drive hips forward.'
        ]
    },
    // Legs (Isolation)
    {
        id: 'walking_lunge',
        name: 'Walking Lunge',
        category: 'Legs (Isolation)',
        targetMuscles: ['Quads', 'Glutes'],
        instructions: [
            'Step forward, lowering rear knee toward the ground.',
            'Drive off the front foot to step through to the next lunge.'
        ]
    },
    {
        id: 'leg_press',
        name: 'Leg Press',
        category: 'Legs (Isolation)',
        targetMuscles: ['Quads', 'Glutes'],
        instructions: [
            'Sit in machine, feet on platform.',
            'Lower weight until knees are at 90 degrees.',
            'Press weight up without locking knees.'
        ]
    },
    {
        id: 'calf_raise',
        name: 'Calf Raise',
        category: 'Legs (Isolation)',
        targetMuscles: ['Calves'],
        instructions: [
            'Stand with balls of feet on a step/platform.',
            'Lower heels for a deep stretch.',
            'Raise up onto toes fully.'
        ]
    },
    // Push (Chest)
    {
        id: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        category: 'Push (Chest)',
        targetMuscles: ['Chest', 'Triceps'],
        instructions: [
            'Lie on bench, eyes under bar. Unrack with straight arms.',
            'Lower bar to mid-chest.',
            'Press bar back up.'
        ]
    },
    {
        id: 'incline_dumbbell_press',
        name: 'Incline Dumbbell Press',
        category: 'Push (Chest)',
        targetMuscles: ['Upper Chest'],
        instructions: [
            'Set bench to 30-45 degrees.',
            'Press dumbbells overhead, converging slightly at the top.',
            'Lower for a deep stretch at the bottom.'
        ]
    },
    // Push (Shoulders)
    {
        id: 'overhead_press',
        name: 'Overhead Press',
        category: 'Push (Shoulders)',
        targetMuscles: ['Shoulders', 'Triceps'],
        instructions: [
            'Stand with bar on front delts.',
            'Press bar vertically until arms locked out.',
            'Lower slowly to collarbone.'
        ]
    },
    {
        id: 'dumbbell_lateral_raise',
        name: 'Dumbbell Lateral Raise',
        category: 'Push (Shoulders)',
        targetMuscles: ['Side Delts'],
        instructions: [
            'Stand with dumbbells at sides, palms facing in.',
            'Raise arms outward until parallel to floor, keeping a slight bend in elbows.',
            'Lower with control.'
        ]
    },
    {
        id: 'arnold_press',
        name: 'Arnold Press',
        category: 'Push (Shoulders)',
        targetMuscles: ['Front Delts', 'Side Delts'],
        instructions: [
            'Hold DBs in front of shoulders, palms facing you.',
            'Press up while rotating palms to face away.',
            'Reverse rotation on the way down.'
        ]
    },
    // Pull (Back)
    {
        id: 'pull_up',
        name: 'Pull-Up',
        category: 'Pull (Back)',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: [
            'Grip bar wider than shoulders.',
            'Pull chest up toward the bar, driving elbows down.',
            'Lower until arms are fully extended.'
        ]
    },
    {
        id: 'bent_over_row',
        name: 'Bent Over Row',
        category: 'Pull (Back)',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: [
            'Hinge at hips so torso is near parallel to floor.',
            'Pull weight toward your hip pocket.',
            'Squeeze back muscles and lower slowly.'
        ]
    },
    {
        id: 'lat_pulldown',
        name: 'Lat Pulldown',
        category: 'Pull (Back)',
        targetMuscles: ['Lats'],
        instructions: [
            'Sit in machine, secure knees under pad.',
            'Pull bar down to upper chest, leading with elbows.',
            'Control the ascent.'
        ]
    },
    {
        id: 'single_arm_db_row',
        name: 'Single-Arm DB Row',
        category: 'Pull (Back)',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: [
            'Place hand and knee on a bench for support.',
            'Pull dumbbell to hip pocket in a sawing motion.',
            'Lower to full stretch.'
        ]
    },
    // Arms (Biceps)
    {
        id: 'dumbbell_bicep_curl',
        name: 'Dumbbell Bicep Curl',
        category: 'Arms (Biceps)',
        targetMuscles: ['Biceps'],
        instructions: [
            'Stand holding dumbbells, palms facing forward (supinated).',
            'Curl weight toward shoulders, keeping elbows pinned to sides.',
            'Lower fully with control.'
        ]
    },
    {
        id: 'hammer_curl',
        name: 'Hammer Curl',
        category: 'Arms (Biceps)',
        targetMuscles: ['Brachialis', 'Forearm'],
        instructions: [
            'Hold DBs with palms facing each other (neutral grip).',
            'Curl up toward shoulders. Excellent for climbers grip strength.'
        ]
    },
    // Arms (Triceps)
    {
        id: 'tricep_pushdown',
        name: 'Tricep Pushdown',
        category: 'Arms (Triceps)',
        targetMuscles: ['Triceps'],
        instructions: [
            'Attach rope/bar to high cable pulley.',
            'Pin elbows to sides.',
            'Extend arm fully down and squeeze triceps.'
        ]
    },
    {
        id: 'skullcrusher',
        name: 'Skullcrusher',
        category: 'Arms (Triceps)',
        targetMuscles: ['Triceps'],
        instructions: [
            'Lie on bench, holding EZ bar or DBs over chest.',
            'Bend elbows to lower weight to forehead/behind head.',
            'Extend arms back to start.'
        ]
    },
    // Core
    {
        id: 'sit_up',
        name: 'Sit-Up',
        category: 'Core',
        targetMuscles: ['Abs'],
        instructions: [
            'Lie on back, knees bent, feet flat.',
            'Lift torso all the way up to a sitting position.',
            'Lower back down slowly.'
        ]
    },
    {
        id: 'crunch',
        name: 'Crunch',
        category: 'Core',
        targetMuscles: ['Upper Abs'],
        instructions: [
            'Lie on back, knees bent. Hands behind head.',
            'Lift only head and shoulders off the floor, squeezing abs.',
            'Lower back down without relaxing fully.'
        ]
    },
    {
        id: 'plank',
        name: 'Plank',
        category: 'Core',
        targetMuscles: ['Core Stability'],
        instructions: [
            'Support body on forearms and toes.',
            'Maintain a straight line from head to heels.',
            'Hold for time, bracing core tight.'
        ]
    },
    {
        id: 'russian_twist',
        name: 'Russian Twist',
        category: 'Core',
        targetMuscles: ['Obliques'],
        instructions: [
            'Sit on floor, feet elevated, leaning back slightly.',
            'Rotate torso side to side, touching hands/weight to floor.'
        ]
    },
    {
        id: 'hanging_leg_raise',
        name: 'Hanging Leg Raise',
        category: 'Core',
        targetMuscles: ['Lower Abs'],
        instructions: [
            'Hang from a pull-up bar.',
            'Raise legs (straight or bent) until hips curl up.',
            'Control the descent to avoid swinging.'
        ]
    }
];
