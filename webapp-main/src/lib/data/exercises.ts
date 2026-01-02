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
        id: 'weighted_pull_ups',
        name: 'Weighted Pull-Up',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Grip bar wider than shoulders.', 'Pull chest up toward the bar.'],
        images: ['/exercises/weighted_pull_ups.webp']
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
    {
        id: 'one_arm_assisted_pull_up',
        name: '1 Arm Assisted Pull-Up',
        category: 'Pull',
        subcategory: 'Vertical Pull',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Use a pulley or band to assist one arm.', 'Perform a one-arm pull-up.'],
        images: ['/exercises/1_Arm_Assisted_Pull-Up.webp']
    },
    // Horizontal Pull
    {
        id: 'bent_over_row',
        name: 'Barbell Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Hinge at hips.', 'Pull weight to hip pocket.'],
        images: ['/exercises/bent_over_row.webp']
    },
    {
        id: 'single_arm_db_row',
        name: 'Dumbbell Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Support on bench.', 'Pull dumbbell to hip.'],
        images: ['/exercises/single_arm_db_row.webp']
    },
    // Lock-offs
    {
        id: 'one_arm_negatives',
        name: 'One Arm Negatives',
        category: 'Pull',
        subcategory: 'Lock-offs',
        targetMuscles: ['Lats', 'Biceps', 'Forearms'],
        instructions: ['Jump or assist up to the top position.', 'Lower yourself as slowly as possible with one arm.']
    },
    {
        id: 'full_lock_offs',
        name: 'Full Lock-offs',
        category: 'Pull',
        subcategory: 'Lock-offs',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Hold the top position of a pull-up.', 'Maintain chin above the bar for time.']
    },
    {
        id: '90_degree_lock_offs',
        name: '90 Lock-offs',
        category: 'Pull',
        subcategory: 'Lock-offs',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Hold a pull-up position with elbows at 90 degrees.', 'Keep core tight and hold for time.']
    },
    {
        id: '120_degree_lock_offs',
        name: '120 Lock-offs',
        category: 'Pull',
        subcategory: 'Lock-offs',
        targetMuscles: ['Lats', 'Biceps'],
        instructions: ['Hold a pull-up position with elbows at 120 degrees (slightly bent).', 'Maintain tension for time.']
    },
    // Curls
    {
        id: 'bicep_curls',
        name: 'Bicep Curls',
        category: 'Pull',
        subcategory: 'Curls',
        targetMuscles: ['Biceps'],
        instructions: ['Hold dumbbells at sides.', 'Curl weights toward shoulders.', 'Lower with control.']
    },
    {
        id: 'hammer_curls',
        name: 'Hammer Curls',
        category: 'Pull',
        subcategory: 'Curls',
        targetMuscles: ['Biceps', 'Forearms'],
        instructions: ['Hold dumbbells with neutral grip (palms facing in).', 'Curl weights toward shoulders.', 'Lower with control.']
    },
    {
        id: 'barbell_curls',
        name: 'Barbell Curls',
        category: 'Pull',
        subcategory: 'Curls',
        targetMuscles: ['Biceps'],
        instructions: ['Hold barbell with underhand grip.', 'Curl bar toward chest.', 'Lower with control.']
    },
    // Shoulders
    {
        id: 'front_raises',
        name: 'Front Raises',
        category: 'Pull', // Often categorized as Push or accessory
        subcategory: 'Shoulders',
        targetMuscles: ['Front Delts'],
        instructions: ['Hold weights in front of thighs.', 'Raise arms straight in front to shoulder height.']
    },
    {
        id: 'kettlebell_swings',
        name: 'Kettlebell Swings',
        category: 'Pull', // Hinge movement
        subcategory: 'Shoulders',
        targetMuscles: ['Glutes', 'Hamstrings', 'Lower Back'],
        instructions: ['Hinge at hips holding kettlebell.', 'Snap hips forward to swing weight up.']
    },
    {
        id: 'muscle_ups',
        name: 'Muscle Ups',
        category: 'Pull', // Compound pull + push
        subcategory: 'Shoulders',
        targetMuscles: ['Lats', 'Triceps', 'Chest'],
        instructions: ['Explosive pull-up.', 'Transition wrists over bar.', 'Press out at top.']
    },
    // Machine Pull
    {
        id: 'seated_row',
        name: 'Seated Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Sit at machine.', 'Pull handle to torso.'],
        images: ['/exercises/Seated_Row.webp']
    },
    {
        id: 'supine_trx_row',
        name: 'Supine TRX Row',
        category: 'Pull',
        subcategory: 'Horizontal Pull',
        targetMuscles: ['Lats', 'Rhomboids'],
        instructions: ['Feet in TRX straps.', 'Pull handle to torso.']
    },

    // --- PUSH ---
    // Chest & Dips
    {
        id: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Chest', 'Triceps'],
        instructions: ['Lower bar to chest.', 'Press back up.'],
        images: ['/exercises/barbell_bench_press.webp']
    },
    {
        id: 'dumbbell_bench_press',
        name: 'Dumbbell Chest Press',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Upper Chest'],
        instructions: ['Press dumbbells whilst lying on bench.'],
        images: ['/exercises/dumbbell_bench_press.webp']
    },
    {
        id: 'dumbbell_bench_press',
        name: 'Dumbbell Chest Press',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Upper Chest'],
        instructions: ['Press dumbbells whilst lying on bench.'],
        images: ['/exercises/dumbbell_bench_press.webp']
    },
    {
        id: 'chest_press',
        name: 'Chest Press Machine',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Chest', 'Triceps'],
        instructions: ['From seated position, push handles overhead.'],
    },
    {
        id: 'push_up',
        name: 'Push-Up',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Triceps', 'Chest'],
        instructions: ['Hands wide, lower to floor.', 'Press back up.'],
        images: ['/exercises/push_up.webp']
    },
    {
        id: 'narrow_push_up',
        name: 'Narrow Push-Up',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Triceps', 'Chest'],
        instructions: ['Hands close together.', 'Keep elbows tucked.']
    },
    {
        id: 'trx_push_up',
        name: 'TRX Push-Up',
        category: 'Push',
        subcategory: 'Horizontal Push',
        targetMuscles: ['Chest', 'Global Stabilisers'],
        instructions: ['Feet or hands in TRX straps.', 'Perform push-up.']
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
        instructions: ['Sit in machine.', 'Press handles overhead.'],
        images: ['/exercises/Shoulder_Press_Machine.webp']
    },
    // Shoulders
    {
        id: 'dumbbell_flies',
        name: 'Dumbbell Flies',
        category: 'Push',
        subcategory: 'Shoulders',
        targetMuscles: ['Chest'],
        instructions: ['Lie on bench.', 'Open arms wide, then bring together.'],
        images: ['/exercises/Dumbbell_Flies.webp']
    },
    {
        id: 'lateral_raises',
        name: 'Lateral Raises',
        category: 'Push',
        subcategory: 'Shoulders',
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
    {
        id: 'tricep_dips',
        name: 'Tricep Dips',
        category: 'Push',
        subcategory: 'Triceps',
        targetMuscles: ['Triceps'],
        instructions: ['Support body on parallel bars.', 'Lower until elbows at 90 degrees.'],
        images: ['/exercises/Tricep_Dips.webp']
    },
    // --- LEGS ---
    // Squats
    {
        id: 'barbell_squat',
        name: 'Barbell Squat',
        category: 'Legs',
        subcategory: 'Squats',
        targetMuscles: ['Quads', 'Glutes'],
        instructions: ['Squat with barbell on back.'],
        images: ['/exercises/barbell_squat.webp']
    },
    {
        id: 'leg_press',
        name: 'Leg Press',
        category: 'Legs',
        subcategory: 'Squats',
        targetMuscles: ['Quads'],
        instructions: ['Press weight on machine.'],
        images: ['/exercises/leg_press.webp']
    },
    {
        id: 'pistol_squats',
        name: 'Pistol Squats',
        category: 'Legs',
        subcategory: 'Squats',
        targetMuscles: ['Quads', 'Balance'],
        instructions: ['One-legged squat.'],
        images: ['/exercises/Pistol_Squats.webp']
    },
    {
        id: 'goblet_squat',
        name: 'Goblet Squat',
        category: 'Legs',
        subcategory: 'Squats',
        targetMuscles: ['Quads'],
        instructions: ['Hold weight at chest.', 'Squat.'],
        images: ['/exercises/goblet_squat.webp']
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
        instructions: ['Deadlift from rack height.'],
        images: ['/exercises/Rack_Pulls.webp']
    },
    {
        id: 'barbell_good_mornings',
        name: 'BarbellGood Mornings',
        category: 'Legs',
        subcategory: 'Hinge Pattern',
        targetMuscles: ['Back', 'Hamstrings'],
        instructions: ['Deadlift from rack height.'],
    },
    // Isolation
    {
        id: 'leg_extension',
        name: 'Leg Extension',
        category: 'Legs',
        subcategory: 'Isolation',
        targetMuscles: ['Quads'],
        instructions: ['Extend legs against machine resistance.'],
        images: ['/exercises/Leg_Extension.webp']
    },
    {
        id: 'leg_curl',
        name: 'Leg Curl',
        category: 'Legs',
        subcategory: 'Isolation',
        targetMuscles: ['Hamstrings'],
        instructions: ['Curl legs against machine resistance.'],
        images: ['/exercises/Leg_Curl.webp']
    },
    {
        id: 'walking_lunge',
        name: 'Walking Lunge',
        category: 'Legs',
        subcategory: 'Isolation',
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
        instructions: ['Lie on back.', 'Lift hips.'],
        images: ['/exercises/Glute_Bridges.webp']
    },

    // --- STABILISERS ---
    // Wrists
    {
        id: 'reverse_wrist_curl',
        name: 'Reverse Wrist Curl',
        category: 'Stabilisers',
        subcategory: 'Wrists',
        targetMuscles: ['Forearm Extensors'],
        instructions: ['Curl wrist up with palm down.'],
        images: ['/exercises/reverse_wrist_curl.webp']
    },
    {
        id: 'radial_wrist_tilts',
        name: 'Radial Wrist Tilts',
        category: 'Stabilisers',
        subcategory: 'Wrists',
        targetMuscles: ['Forearms'],
        instructions: ['Tilt wrist thumb-side up.'],
        images: ['/exercises/Radial_Wrist_Tilts.webp']
    },
    {
        id: 'wrist_rotations',
        name: 'Wrist Rotations',
        category: 'Stabilisers',
        subcategory: 'Wrists',
        targetMuscles: ['Forearms'],
        instructions: ['Rotate wrists with weight.'],
        images: ['/exercises/Wrist_Rotations.webp']
    },
    {
        id: 'wrist_curls',
        name: 'Wrist Curls',
        category: 'Stabilisers',
        subcategory: 'Wrists',
        targetMuscles: ['Forearm Flexors'],
        instructions: ['Curl wrist up with palm up.'],
        images: ['/exercises/Wrist_Curls.webp']
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
        instructions: ['Row with one arm while other stays straight.'],
        images: ['/exercises/Archer_Rows.webp']
    },
    // Scapular Control
    {
        id: 'one_arm_dumbbell_shrugs',
        name: 'One Arm Dumbbell Shrugs',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Traps'],
        instructions: ['Shrug shoulder up.'],
        images: ['/exercises/One_Arm_Dumbbell_Shrugs.webp']
    },
    {
        id: 'prone_overhead_db_press',
        name: 'Prone Overhead Dumbbell Press',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Lower Traps'],
        instructions: ['Lie prone.', 'Press light weights overhead.'],
        images: ['/exercises/Prone_Overhead_Dumbbell_Press.webp']
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
        instructions: ['Hold scapular retraction.'],
        images: ['/exercises/Scapular_Holds.webp']
    },
    {
        id: 'scapular_pull_ups',
        name: 'Scapular Pull-Ups',
        category: 'Stabilisers',
        subcategory: 'Scapular Control',
        targetMuscles: ['Scapula'],
        instructions: ['Hang from bar.', 'Depress and retract scapula without bending elbows.'],
        images: ['/exercises/Scapular_Pull-ups.webp']
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
    // Rotator Cuff
    {
        id: 'dumbbell_overhead_rotations',
        name: 'Dumbbell Overhead Rotations',
        category: 'Stabilisers',
        subcategory: 'Rotator Cuff',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Press overhead.', 'Rotate shoulders.'],
        images: ['/exercises/Dumbbell_Overhead_Rotations.webp']
    },
    {
        id: 'external_side_lying_rotations',
        name: 'External Side Lying Rotations',
        category: 'Stabilisers',
        subcategory: 'Rotator Cuff',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie on side.', 'Rotate arm up.'],
        images: ['/exercises/External_Side_Lying_Rotations.webp']
    },
    {
        id: 'prone_bench_rotations',
        name: 'Prone Bench Rotations',
        category: 'Stabilisers',
        subcategory: 'Rotator Cuff',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie prone.', 'Rotate arms.'],
        images: ['/exercises/Prone_Bench_Rotations.webp']
    },
    {
        id: 'cable_external_rotations',
        name: 'Cable External Rotations',
        category: 'Stabilisers',
        subcategory: 'Rotator Cuff',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Use cable.', 'Rotate arm away from body.'],
        images: ['/exercises/Cable_External_Rotations.webp']
    },
    {
        id: 'cable_internal_rotation',
        name: 'Cable Internal Rotation',
        category: 'Stabilisers',
        subcategory: 'Rotator Cuff',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Use cable.', 'Rotate arm across body.'],
        images: ['/exercises/Cable_Internal_Rotation.webp']
    },
    {
        id: 'internal_side_lying_rotations',
        name: 'Internal Side Lying Rotations',
        category: 'Stabilisers',
        subcategory: 'Internal Rotation/Flexors',
        targetMuscles: ['Rotator Cuff'],
        instructions: ['Lie on side.', 'Rotate arm inward.'],
        images: ['/exercises/Internal_Side_Lying_Rotations.webp']
    },

    // --- CORE ---
    // Leg Raise
    {
        id: 'hanging_l_hold',
        name: 'Hanging L Hold',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Hang from bar.', 'Hold legs horizontal.'],
        images: ['/exercises/Hanging_L_Hold.webp']
    },
    {
        id: 'supine_leg_raises',
        name: 'Supine Leg Raises',
        category: 'Core',
        subcategory: 'Leg Raise',
        targetMuscles: ['Abs'],
        instructions: ['Lie on back.', 'Raise legs.'],
        images: ['/exercises/Supine_Leg_Raises.webp']
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
        instructions: ['Front lever progression tucked.'],
        images: ['/exercises/Lever_Raises_tucked.webp']
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
    // Crunches
    {
        id: 'crunches',
        name: 'Crunches',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Upper Abs'],
        instructions: ['Crunch up off floor.'],
        images: ['/exercises/crunch.webp']
    },
    {
        id: 'lower_ab_crunches',
        name: 'Lower Ab Crunches',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Lower Abs'],
        instructions: ['Reverse crunch movement.'],
        images: ['/exercises/Lower_Ab_Crunches.webp']
    },
    {
        id: 'weighted_crunches',
        name: 'Weighted Crunches',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Abs'],
        instructions: ['Crunch with weight.'],
        images: ['/exercises/Weighted_Crunches.webp']
    },
    {
        id: 'dead_bug',
        name: 'Dead Bug',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Core'],
        instructions: ['Opposite arm and leg extension lying on back.'],
        images: ['/exercises/Dead_Bug.webp']
    },
    {
        id: 'boat_pose',
        name: 'Boat Pose',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Core'],
        instructions: ['Static V hold on floor.'],
        images: ['/exercises/Boat_Pose.webp']
    },
    {
        id: 'v_sits',
        name: 'V Sits',
        category: 'Core',
        subcategory: 'Crunches',
        targetMuscles: ['Abs'],
        instructions: ['Explosive sit up to V position.'],
        images: ['/exercises/V_Sits.webp']
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
        instructions: ['Crunch with rotation.'],
        images: ['/exercises/Twisting_Crunches.webp']
    },
    {
        id: 'supine_windscreen_wipers',
        name: 'Supine Windscreen Wipers',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Lie on back.', 'Rotate legs side to side.'],
        images: ['/exercises/Supine_Windscreen_Wipers.webp']
    },
    {
        id: 'hanging_windscreen_wipers',
        name: 'Hanging Windscreen Wipers',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques'],
        instructions: ['Hang from bar.', 'Rotate legs side to side.'],
        images: ['/exercises/Hanging_Windscreen_Wipers.webp']
    },
    {
        id: 'thread_the_needle',
        name: 'Thread the Needle',
        category: 'Core',
        subcategory: 'Rotation',
        targetMuscles: ['Obliques', 'Mobility'],
        instructions: ['Plank position.', 'Reach under body.'],
        images: ['/exercises/Thread_the_Needle.webp']
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
        instructions: ['Plank on forearms with hips high.'],
        images: ['/exercises/Dolphin_Plank.webp']
    },
    {
        id: 'copenhagen_plank',
        name: 'Copenhagen Plank',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Adductors', 'Core'],
        instructions: ['Side plank with top leg supported.'],
        images: ['/exercises/Copenhagen_Plank.webp']
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
        instructions: ['Superman hold.'],
        images: ['/exercises/Prone_Dish_Hold.webp']
    },
    {
        id: 'supine_dish_hold',
        name: 'Supine Dish Hold',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Hollow body hold (lower).'],
        images: ['/exercises/Supine_Dish_Hold.webp']
    },
    {
        id: 'hollow_body_hold',
        name: 'Hollow Body Hold',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Core'],
        instructions: ['Hold hollow body position.'],
        images: ['/exercises/Hollow_Body_Hold.webp']
    },
    {
        id: 'prone_dish_lifts',
        name: 'Prone Dish Lifts',
        category: 'Core',
        subcategory: 'Stability',
        targetMuscles: ['Posterior Chain'],
        instructions: ['Lifting into superman position reps.'],
        images: ['/exercises/Prone_Dish_Lifts.webp']
    },

    // --- MOBILITY ---
    // Upper Body
    { id: 'bicep_stretch', name: 'Bicep Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Biceps'], instructions: ['Stretch biceps.'], images: ['/exercises/Bicep_Stretch.webp'] },
    { id: 'finger_stretches', name: 'Finger Stretches', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Fingers'], instructions: ['Stretch fingers.'], images: ['/exercises/Finger_Stretches.webp'] },
    { id: 'pec_stretch', name: 'Pec Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Chest'], instructions: ['Stretch chest.'], images: ['/exercises/Pec_Stretch.webp'] },
    { id: 'lat_stretch', name: 'Lat Stretch', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Lats'], instructions: ['Stretch lats.'], images: ['/exercises/Lat_Stretch.webp'] },
    { id: 'wrist_stretches', name: 'Wrist Stretches', category: 'Mobility', subcategory: 'Upper Body', targetMuscles: ['Wrists'], instructions: ['Stretch wrists.'] },
    // Torso Chain
    { id: 'pancake_fold', name: 'Pancake Fold', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Hips', 'Back'], instructions: ['Seated straddle fold.'], images: ['/exercises/Pancake_Fold.webp'] },
    { id: 'open_books', name: 'Open Books', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Thoracic Spine'], instructions: ['Side lying thoracic rotation.'], images: ['/exercises/Open_Books.webp'] },
    { id: 'good_mornings', name: 'Good Mornings', category: 'Mobility', subcategory: 'Torso Chain', targetMuscles: ['Hamstrings', 'Back'], instructions: ['Hinge with straight back.'], images: ['/exercises/Good_Mornings.webp'] },
    // Lower Leg
    { id: 'calf_stretch', name: 'Calf Stretch', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Stretch calves.'], images: ['/exercises/Calf_Stretch.webp'] },
    { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Calf raise bent over.'], images: ['/exercises/Donkey_Calf_Raise.webp'] },
    { id: 'one_leg_calf_squats', name: '1 Leg Calf Squats', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves', 'Balance'], instructions: ['Squat on one leg, heel raised.'], images: ['/exercises/1_Leg_Calf_Squats.webp'] },
    { id: 'wall_calf_stretch', name: 'Wall Calf Stretch', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Calves'], instructions: ['Stretch against wall.'], images: ['/exercises/Wall_Calf_Stretch.webp'] },
    { id: 'fishermans', name: 'Fishermans', category: 'Mobility', subcategory: 'Lower Leg', targetMuscles: ['Ankles'], instructions: ['Kneeling ankle stretch.'], images: ['/exercises/Fishermans.webp'] },
    // Hips/Lower Body
    { id: 'barre_lift', name: 'Barre Lift', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lift leg at barre.'], images: ['/exercises/Barre_Lift.webp'] },
    { id: 'fire_hydrants', name: 'Fire Hydrants', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes'], instructions: ['Quadruped hip abduction.'], images: ['/exercises/Fire_Hydrants.webp'] },
    { id: 'supine_quad_stretch', name: 'Supine Quad Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Quads'], instructions: ['Lie back with bent knee.'], images: ['/exercises/Supine_Quad_Stretch.webp'] },
    { id: 'long_lunges', name: 'Long Lunges', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hip Flexors'], instructions: ['Deep lunge.'] },
    { id: 'cossack_squats', name: 'Cossack Squats', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips', 'Adductors'], instructions: ['Side lunge.'], images: ['/exercises/Cossack_Squats.webp'] },
    { id: 'front_splits', name: 'Front Splits', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hamstrings', 'Hip Flexors'], instructions: ['Split forward/back.'], images: ['/exercises/Front_Splits.webp'] },
    { id: 'side_splits', name: 'Side Splits', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Adductors'], instructions: ['Straddle split.'], images: ['/exercises/Side_Splits.webp'] },
    { id: 'front_swings', name: 'Front Swings', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Swing leg forward/back.'], images: ['/exercises/Front_Swings.webp'] },
    { id: 'side_swings', name: 'Side Swings', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Swing leg side to side.'], images: ['/exercises/Side_Swings.webp'] },
    { id: 'hamstring_stretch', name: 'Hamstring Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hamstrings'], instructions: ['Stretch hamstring.'], images: ['/exercises/Hamstring_Stretch.webp'] },
    { id: 'butterfly', name: 'Butterfly', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Seated hip opener.'], images: ['/exercises/Butterfly.webp'] },
    { id: 'horse_squat', name: 'Horse Squat', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips', 'Quads'], instructions: ['Wide stance squat.'], images: ['/exercises/Horse_Squat.webp'] },
    { id: 'supine_frog', name: 'Supine Frog', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lie on back, knees wide.'] },
    { id: 'prone_frog', name: 'Prone Frog', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Hips'], instructions: ['Lie on front, knees wide.'], images: ['/exercises/Prone_Frog.webp'] },
    { id: 'glute_stretch', name: 'Glute Stretch', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes'], instructions: ['Stretch glutes.'], images: ['/exercises/Glute_Stretch.webp'] },
    { id: 'childs_pose', name: 'Childs Pose', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Back', 'Hips'], instructions: ['Resting pose.'], images: ['/exercises/Childs_Pose.webp'] },
    { id: 'pigeon_pose', name: 'Pigeon Pose', category: 'Mobility', subcategory: 'Hips/Lower Body', targetMuscles: ['Glutes', 'Hips'], instructions: ['Hip opener.'], images: ['/exercises/Pigeon_Pose.webp'] },

];
