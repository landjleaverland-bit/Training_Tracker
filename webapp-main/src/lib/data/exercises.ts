/**
 * Comprehensive list of exercises for the Gym Session logger
 * Based on market-leading apps and user request.
 */

export interface ExerciseDefinition {
    id: string; // Unique identifier (e.g., "barbell_squat")
    name: string;
    category: 'Pull' | 'Push' | 'Legs' | 'Stabilisers' | 'Core' | 'Mobility';
    subcategory: string;
    targetMuscles: string[]; // Primary muscles
    instructions: string[]; // Steps
    images?: string[]; // Paths to animation frames
}

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
    // --- PULL ---
    // Vertical Pull
    {
        id: 'pull_ups',
        name: 'Pull-Up',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Grip bar wider than shoulders.', 'Pull chest up toward the bar.'],
        images: ['/exercises/pull-ups.webp']
    },
    {
        id: 'weighted_pull_up',
        name: 'Weighted Pull-Up',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Use a dip belt or hold a dumbbell.', 'Perform a pull-up.']
    },
    {
        id: 'lat_pulldown',
        name: 'Lat Pulldown',
        category: 'Pull',
        subcategory: 'Vertical Pull', // Or Machine Pull? Plan said Machine Pull for Lat Pulldown, lets stick to plan
        targetMuscles: ['Lats'],
        instructions: ['Sit in machine.', 'Pull bar down to upper chest.'],
        images: ['/exercises/lat_pulldown.webp']
    },
    { // Correction: Plan listed "Machine Pull" as a subcategory containing Lat Pulldown and Seated Row.
        id: 'lat_pulldown_machine',
        name: 'Lat Pulldown',
        category: 'Pull',
        subcategory: 'Machine Pull',
        targetMuscles: ['Lats'],
        instructions: ['Sit in machine.', 'Pull bar down to upper chest.'],
        images: ['/exercises/lat_pulldown.webp']
    },
    {
        id: 'front_lever_raises',
        name: 'Front Lever Raises',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Core'],
        instructions: ['Hang from bar.', 'Raise body to horizontal using lats.']
    },
    {
        id: 'offset_pull_ups',
        name: 'Offset Pull-Ups',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Hang with one hand higher or using a towel/band.', 'Pull up emphasizing one side.']
    },
    {
        id: 'one_arm_assisted_pull_up',
        name: '1 Arm Assisted Pull-Up',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Use a pulley or band to assist one arm.', 'Perform a one-arm pull-up.']
    },
    // Horizontal Pull
    {
        id: 'bent_over_row',
        name: 'Bent Over Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Hinge at hips.', 'Pull weight to hip pocket.'],
        images: ['/exercises/bent_over_row.webp']
    },
    {
        id: 'single_arm_db_row',
        name: 'Single-Arm DB Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Support on bench.', 'Pull dumbbell to hip.'],
        images: ['/exercises/single_arm_db_row.webp']
    },
    {
        id: 'pendlay_row',
        name: 'Pendlay Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Upper Back'],
        instructions: ['Start each rep from the floor.', 'Explosively pull bar to chest.']
    },
    // Machine Pull
    {
        id: 'seated_row',
        name: 'Seated Row',
        category: 'Pull',
        subcategory: 'Machine Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Sit at machine.', 'Pull handle to torso.']
    },

    // --- PUSH ---
    // Chest & Dips
    {
        id: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Chest', 'Triceps'],
        instructions: ['Lower bar to chest.', 'Press back up.'],
        images: ['/exercises/barbell_bench_press.webp']
    },
    {
        id: 'incline_dumbbell_press',
        name: 'Incline Dumbbell Press',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Upper Chest'],
        instructions: ['Press dumbbells overhead on incline bench.'],
        images: ['/exercises/incline_dumbbell_press.webp']
    },
    {
        id: 'push_up',
        name: 'Push-Up',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Chest', 'Triceps'],
        instructions: ['Plank position.', 'Lower chest to floor.'],
        images: ['/exercises/push_up.webp']
    },
    {
        id: 'narrow_push_up',
        name: 'Narrow Push-Up',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Triceps', 'Chest'],
        instructions: ['Hands close together.', 'Keep elbows tucked.']
    },
    {
        id: 'trx_push_up',
        name: 'TRX Push-Up',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Chest', 'Global Stabilisers'],
        instructions: ['Feet or hands in TRX straps.', 'Perform push-up.']
    },
    {
        id: 'tricep_dips',
        name: 'Tricep Dips',
        category: 'Push',
        subcategory: 'Chest & Dips',
        targetMuscles: ['Triceps', 'Chest'],
        instructions: ['Support body on parallel bars.', 'Lower until elbows at 90 degrees.']
    },
    // Vertical Push
    {
        id: 'overhead_press',
        name: 'Barbell Overhead Press',
        category: 'Push',
        subcategory: 'Vertical Push',
        targetMuscles: ['Shoulders'],
        instructions: ['Press bar vertically overhead.'],
        images: ['/exercises/overhead_press.webp']
    },
    {
        id: 'dumbbell_overhead_press',
        name: 'Dumbbell Overhead Press',
        category: 'Push',
        subcategory: 'Vertical Push',
        targetMuscles: ['Shoulders'],
        instructions: ['Press dumbbells vertically overhead.']
    },
    {
        id: 'arnold_press',
        name: 'Arnold Press',
        category: 'Push',
        subcategory: 'Vertical Push',
        targetMuscles: ['Shoulders'],
        instructions: ['Rotate palms while pressing overhead.'],
        images: ['/exercises/arnold_press.webp']
    },
    {
        id: 'shoulder_press_machine',
        name: 'Shoulder Press Machine',
        category: 'Push',
        subcategory: 'Vertical Push',
        targetMuscles: ['Shoulders'],
        instructions: ['Sit in machine.', 'Press handles overhead.']
    },
    // Isolation
    {
        id: 'dumbbell_flies',
        name: 'Dumbbell Flies',
        category: 'Push',
        subcategory: 'Isolation',
        targetMuscles: ['Chest'],
        instructions: ['Lie on bench.', 'Open arms wide, then bring together.']
    },
    {
        id: 'lateral_raises',
        name: 'Lateral Raises',
        category: 'Push',
        subcategory: 'Isolation',
        targetMuscles: ['Side Delts'],
        instructions: ['Raise arms to sides.'],
        images: ['/exercises/dumbbell_lateral_raise.webp']
    },
    // Triceps
    {
        id: 'dumbbell_kickbacks',
        name: 'Dumbbell Kickbacks',
        category: 'Push',
        subcategory: 'Triceps',
        targetMuscles: ['Triceps'],
        instructions: ['Hinge forward.', 'Extend arm back.']
    },
    {
        id: 'cable_pushdown',
        name: 'Cable Pushdown',
        category: 'Push',
        subcategory: 'Triceps',
        targetMuscles: ['Triceps'],
        instructions: ['Push bar down using triceps.'],
        images: ['/exercises/tricep_pulldown.webp']
    },
    { // Skullcrushers were in original, let's keep them here
        id: 'skullcrusher',
        name: 'Skullcrusher',
        category: 'Push',
        subcategory: 'Triceps',
        targetMuscles: ['Triceps'],
        instructions: ['Lower bar to forehead.', 'Extend arms.'],
        images: ['/exercises/skullcrusher.webp']
    },

    // --- LEGS ---
    // Squat Pattern
    {
        id: 'barbell_squat',
        name: 'Barbell Squat',
        category: 'Legs',
        subcategory: 'Squat Pattern',
        targetMuscles: ['Quads', 'Glutes'],
        instructions: ['Squat with barbell on back.'],
        images: ['/exercises/barbell_squat.webp']
    },
    {
        id: 'leg_press',
        name: 'Leg Press',
        category: 'Legs',
        subcategory: 'Squat Pattern',
        targetMuscles: ['Quads'],
        instructions: ['Press weight on machine.'],
        images: ['/exercises/leg_press.webp']
    },
    {
        id: 'pistol_squats',
        name: 'Pistol Squats',
        category: 'Legs',
        subcategory: 'Squat Pattern',
        targetMuscles: ['Quads', 'Balance'],
        instructions: ['One-legged squat.']
    },
    {
        id: 'goblet_squat',
        name: 'Goblet Squat',
        category: 'Legs',
        subcategory: 'Squat Pattern',
        targetMuscles: ['Quads'],
        instructions: ['Hold weight at chest.', 'Squat.'],
        images: ['/exercises/goblet_squat.webp']
    },
    {
        id: 'leg_extension',
        name: 'Leg Extension',
        category: 'Legs',
        subcategory: 'Squat Pattern', // Or Isolation? Plan grouped it here based on color presumably
        targetMuscles: ['Quads'],
        instructions: ['Extend legs against machine resistance.']
    },
    // Hinge Pattern
    {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'Legs',
        subcategory: 'Hinge Pattern',
        targetMuscles: ['Posterior Chain'],
        instructions: ['Lift bar from floor.'],
        images: ['/exercises/deadlift.webp']
    },
    {
        id: 'rack_pulls',
        name: 'Rack Pulls',
        category: 'Legs',
        subcategory: 'Hinge Pattern',
        targetMuscles: ['Back', 'Glutes'],
        instructions: ['Deadlift from rack height.']
    },
    {
        id: 'leg_curl',
        name: 'Leg Curl',
        category: 'Legs',
        subcategory: 'Hinge Pattern',
        targetMuscles: ['Hamstrings'],
        instructions: ['Curl legs against machine resistance.']
    },
    {
        id: 'walking_lunge',
        name: 'Walking Lunge',
        category: 'Legs',
        subcategory: 'Hinge Pattern',
        targetMuscles: ['Quads', 'Glutes'],
        instructions: ['Step forward and lower hips.'],
        images: ['/exercises/walking_lunge.webp']
    },
    // Calves
    {
        id: 'calf_raises',
        name: 'Calf Raises',
        category: 'Legs',
        subcategory: 'Calves',
        targetMuscles: ['Calves'],
        instructions: ['Raise heels.'],
        images: ['/exercises/calf_raise.webp']
    },
    // Glutes
    {
        id: 'glute_bridges',
        name: 'Glute Bridges',
        category: 'Legs',
        subcategory: 'Glutes',
        targetMuscles: ['Glutes'],
        instructions: ['Lie on back.', 'Lift hips.']
    },

    // --- STABILISERS ---
    // Wrist Extensors
    {
        id: 'reverse_wrist_curl',
        name: 'Reverse Wrist Curl',
        category: 'Stabilisers',
        subcategory: 'Wrist Extensors',
        targetMuscles: ['Forearm Extensors'],
        instructions: ['Curl wrist up with palm down.'],
        images: ['/exercises/reverse_wrist_curl.webp']
    },
    {
        id: 'radial_wrist_tilts',
        name: 'Radial Wrist Tilts',
        category: 'Stabilisers',
        subcategory: 'Wrist Extensors',
        targetMuscles: ['Forearms'],
        instructions: ['Tilt wrist thumb-side up.']
    },
    {
        id: 'wrist_rotations',
        name: 'Wrist Rotations',
        category: 'Stabilisers',
        subcategory: 'Wrist Extensors',
        targetMuscles: ['Forearms'],
        instructions: ['Rotate wrists with weight.']
    },
    // Rear Delts
    {
        id: 'dumbbell_rear_delt_flies',
        name: 'Dumbbell Rear Delt Flies',
        category: 'Stabilisers',
        subcategory: 'Rear Delts',
        targetMuscles: ['Rear Delts'],
        instructions: ['Hinge forward.', 'Raise arms to sides.']
    },
    {
        id: 'cable_face_pulls',
        name: 'Cable Face Pulls',
        category: 'Stabilisers',
        subcategory: 'Rear Delts',
        targetMuscles: ['Rear Delts'],
        instructions: ['Pull rope to face.'],
        images: ['/exercises/face_pull.webp']
    },
    {
        id: 'archer_rows',
        name: 'Archer Rows',
        category: 'Stabilisers',
        subcategory: 'Rear Delts',
        targetMuscles: ['Back', 'Rear Delts'],
        instructions: ['Row with one arm while other stays straight.']
    },
    // Scapular Control
    {
        id: 'one_arm_dumbbell_shrugs',
        name: 'One Arm Dumbbell Shrugs',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Traps'],
        instructions: ['Shrug shoulder up.']
    },
    {
        id: 'prone_overhead_db_press',
        name: 'Prone Overhead Dumbbell Press',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Lower Traps'],
        instructions: ['Lie prone.', 'Press light weights overhead.']
    },
    {
        id: 'incline_bench_db_iyts',
        name: 'Incline Bench Dumbbell IYTs',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Lower Traps', 'Rear Delts'],
        instructions: ['Form I, Y, T shapes with arms.'],
        images: ['/exercises/i-y-t_raises.webp']
    },
    {
        id: 'scapular_holds',
        name: 'Scapular Holds',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Scapula'],
        instructions: ['Hold scapular retraction.']
    },
    {
        id: 'scapular_pull_ups',
        name: 'Scapular Pull-Ups',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Scapula'],
        instructions: ['Hang from bar.', 'Depress and retract scapula without bending elbows.']
    },
    {
        id: 'one_arm_scapular_holds',
        name: '1 Arm Scapular Holds',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Scapula'],
        instructions: ['Hang from one arm.', 'Engage scapula.']
    },
    {
        id: 'one_arm_scapular_pull_ups',
        name: '1 Arm Scapular Pull-Ups',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Scapula'],
        instructions: ['One arm hang.', 'Depress scapula.']
    },
    {
        id: 'trx_iyts',
        name: 'TRX IYTs',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Back'],
        instructions: ['Use TRX to perform I, Y, T raises.']
    },
    // External Rotation
    {
        id: 'dumbbell_overhead_rotations',
        name: 'Dumbbell Overhead Rotations',
        category: 'Stabilisers',
        subcategory: 'External Rotation',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Press overhead.', 'Rotate shoulders.']
    },
    {
        id: 'external_side_lying_rotations',
        name: 'External Side Lying Rotations',
        category: 'Stabilisers',
        subcategory: 'External Rotation',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie on side.', 'Rotate arm up.']
    },
    {
        id: 'prone_bench_rotations',
        name: 'Prone Bench Rotations',
        category: 'Stabilisers',
        subcategory: 'External Rotation',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie prone.', 'Rotate arms.']
    },
    {
        id: 'cable_external_rotations',
        name: 'Cable External Rotations',
        category: 'Stabilisers',
        subcategory: 'External Rotation',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Use cable.', 'Rotate arm away from body.']
    },
    // Internal Rotation / Flexors
    {
        id: 'cable_internal_rotation',
        name: 'Cable Internal Rotation',
        category: 'Stabilisers',
        subcategory: 'Internal Rotation/Flexors',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Use cable.', 'Rotate arm across body.']
    },
    {
        id: 'internal_side_lying_rotations',
        name: 'Internal Side Lying Rotations',
        category: 'Stabilisers',
        subcategory: 'Internal Rotation/Flexors',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie on side.', 'Rotate arm inward.']
    },
    {
        id: 'wrist_curls',
        name: 'Wrist Curls',
        category: 'Stabilisers',
        subcategory: 'Internal Rotation/Flexors',
        targetMuscles: ['Forearm Flexors'],
        instructions: ['Curl wrist up with palm up.']
    },

    // --- CORE ---
    // Leg Raise
    {
        id: 'hanging_l_hold',
        name: 'Hanging L Hold',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Hang from bar.', 'Hold legs horizontal.']
    },
    {
        id: 'supine_leg_raises',
        name: 'Supine Leg Raises',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Lie on back.', 'Raise legs.']
    },
    {
        id: 'hanging_leg_raises',
        name: 'Hanging Leg Raises',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Hang from bar.', 'Raise legs to bar.'],
        images: ['/exercises/hanging_leg_raise.webp']
    },
    {
        id: 'lever_raises_tucked',
        name: 'Lever Raises (tucked)',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Front lever progression tucked.']
    },
    {
        id: 'lever_raises_90',
        name: 'Lever Raises (90)',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Front lever progression to 90 degrees.']
    },
    {
        id: 'lever_raises',
        name: 'Lever Raises',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Full front lever raises.']
    },
    // Flexion
    {
        id: 'crunches',
        name: 'Crunches',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Upper Abs'],
        instructions: ['Crunch up off floor.'],
        images: ['/exercises/crunch.webp']
    },
    {
        id: 'lower_ab_crunches',
        name: 'Lower Ab Crunches',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Lower Abs'],
        instructions: ['Reverse crunch movement.']
    },
    {
        id: 'weighted_crunches',
        name: 'Weighted Crunches',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Abs'],
        instructions: ['Crunch with weight.']
    },
    {
        id: 'dead_bug',
        name: 'Dead Bug',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Core'],
        instructions: ['Opposite arm and leg extension lying on back.']
    },
    {
        id: 'boat_pose',
        name: 'Boat Pose',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Core'],
        instructions: ['Static V hold on floor.']
    },
    {
        id: 'v_sits',
        name: 'V Sits',
        category: 'Core',
        subcategory: 'Flexion',
        targetMuscles: ['Abs'],
        instructions: ['Explosive sit up to V position.']
    },
    // Rotation
    {
        id: 'kettle_bell_twists',
        name: 'Kettle Bell Twists',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Russian twist with KB.'],
        images: ['/exercises/russian_twists.webp']
    },
    {
        id: 'twisting_crunches',
        name: 'Twisting Crunches',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Crunch with rotation.']
    },
    {
        id: 'supine_windscreen_wipers',
        name: 'Supine Windscreen Wipers',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Lie on back.', 'Rotate legs side to side.']
    },
    {
        id: 'hanging_windscreen_wipers',
        name: 'Hanging Windscreen Wipers',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Hang from bar.', 'Rotate legs side to side.']
    },
    {
        id: 'thread_the_needle',
        name: 'Thread the Needle',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques', 'Mobility'],
        instructions: ['Plank position.', 'Reach under body.']
    },
    // Stability
    {
        id: 'plank',
        name: 'Plank',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Hold plank position.'],
        images: ['/exercises/plank.webp']
    },
    {
        id: 'dolphin_plank',
        name: 'Dolphin Plank',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Plank on forearms with hips high.']
    },
    {
        id: 'copenhagen_plank',
        name: 'Copenhagen Plank',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Adductors', 'Core'],
        instructions: ['Side plank with top leg supported.']
    },
    {
        id: 'side_plank',
        name: 'Side Plank',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Obliques'],
        instructions: ['Hold side plank.']
    },
    {
        id: 'prone_dish_hold',
        name: 'Prone Dish Hold',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Posterior Chain'],
        instructions: ['Superman hold.']
    },
    {
        id: 'supine_dish_hold',
        name: 'Supine Dish Hold',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Hollow body hold (lower).']
    },
    {
        id: 'hollow_body_hold',
        name: 'Hollow Body Hold',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Hold hollow body position.']
    },
    {
        id: 'prone_dish_lifts',
        name: 'Prone Dish Lifts',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Posterior Chain'],
        instructions: ['Lifting into superman position reps.']
    },

    // --- MOBILITY ---
    // Upper Body
    { id: 'bicep_stretch', name: 'Bicep Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Biceps'], instructions: ['Stretch biceps.'] },
    { id: 'finger_stretches', name: 'Finger Stretches', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Fingers'], instructions: ['Stretch fingers.'] },
    { id: 'pec_stretch', name: 'Pec Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Chest'], instructions: ['Stretch chest.'] },
    { id: 'lat_stretch', name: 'Lat Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Lats'], instructions: ['Stretch lats.'] },
    { id: 'wrist_stretches', name: 'Wrist Stretches', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Wrists'], instructions: ['Stretch wrists.'] },
    // Torso Chain
    { id: 'pancake_fold', name: 'Pancake Fold', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Hips', 'Back'], instructions: ['Seated straddle fold.'] },
    { id: 'open_books', name: 'Open Books', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Thoracic Spine'], instructions: ['Side lying thoracic rotation.'] },
    { id: 'good_mornings', name: 'Good Mornings', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Hamstrings', 'Back'], instructions: ['Hinge with straight back.'] },
    // Lower Leg
    { id: 'calf_stretch', name: 'Calf Stretch', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Stretch calves.'] },
    { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Calf raise bent over.'] },
    { id: 'one_leg_calf_squats', name: '1 Leg Calf Squats', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves', 'Balance'], instructions: ['Squat on one leg, heel raised.'] },
    { id: 'wall_calf_stretch', name: 'Wall Calf Stretch', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Stretch against wall.'] },
    { id: 'fishermans', name: 'Fishermans', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Ankles'], instructions: ['Kneeling ankle stretch.'] },
    // Hips/Lower Body
    { id: 'barre_lift', name: 'Barre Lift', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lift leg at barre.'] },
    { id: 'fire_hydrants', name: 'Fire Hydrants', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes'], instructions: ['Quadruped hip abduction.'] },
    { id: 'supine_quad_stretch', name: 'Supine Quad Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Quads'], instructions: ['Lie back with bent knee.'] },
    { id: 'long_lunges', name: 'Long Lunges', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hip Flexors'], instructions: ['Deep lunge.'] },
    { id: 'cossack_squats', name: 'Cossack Squats', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips', 'Adductors'], instructions: ['Side lunge.'] },
    { id: 'front_splits', name: 'Front Splits', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hamstrings', 'Hip Flexors'], instructions: ['Split forward/back.'] },
    { id: 'side_splits', name: 'Side Splits', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Adductors'], instructions: ['Straddle split.'] },
    { id: 'front_swings', name: 'Front Swings', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Swing leg forward/back.'] },
    { id: 'side_swings', name: 'Side Swings', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Swing leg side to side.'] },
    { id: 'hamstring_stretch', name: 'Hamstring Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hamstrings'], instructions: ['Stretch hamstring.'] },
    { id: 'butterfly', name: 'Butterfly', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Seated hip opener.'] },
    { id: 'horse_squat', name: 'Horse Squat', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips', 'Quads'], instructions: ['Wide stance squat.'] },
    { id: 'supine_frog', name: 'Supine Frog', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lie on back, knees wide.'] },
    { id: 'prone_frog', name: 'Prone Frog', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lie on front, knees wide.'] },
    { id: 'glute_stretch', name: 'Glute Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes'], instructions: ['Stretch glutes.'] },
    { id: 'childs_pose', name: 'Childs Pose', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Back', 'Hips'], instructions: ['Resting pose.'] },
    { id: 'pigeon_pose', name: 'Pigeon Pose', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes', 'Hips'], instructions: ['Hip opener.'] },

];
