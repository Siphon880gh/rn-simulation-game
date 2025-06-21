const appConfig = {
    // === GAME DURATION SETTINGS ===
    TOTAL_DAYS: 1,                    // Number of days in the game
    GAME_MINUTES_PER_SHIFT: 10,       // Duration of one shift in real minutes (how long player plays)
    TIME_PER_DAY: 12 * 60,            // Game minutes per day (12 hours = 720 minutes)
    
    // === SHIFT TIMING ===
    SHIFT_START: 1900,                // When shift starts (24-hour format: 1900 = 7:00 PM)
    SHIFT_END: 700,                   // When shift ends (24-hour format: 0700 = 7:00 AM next day)
    
    // === GAME SPEED CONTROL ===
    GAME_MINUTES_PER_REAL_SECOND: 1,  // How fast game time progresses (1 = normal speed)
    
    // === TASK SCHEDULING ===
    TASK_INTERVAL_MINUTES: 15,        // Time intervals for scheduling tasks (15 min blocks)
    
    // === PRESET CONFIGURATIONS ===
    PRESETS: {
        // Quick testing scenarios
        DEMO: {
            GAME_MINUTES_PER_SHIFT: 2,
            TIME_PER_DAY: 60,
            SHIFT_START: 1900
        },
        QUICK_PRACTICE: {
            GAME_MINUTES_PER_SHIFT: 5,
            TIME_PER_DAY: 4 * 60,
            SHIFT_START: 1900
        },
        FULL_SHIFT: {
            GAME_MINUTES_PER_SHIFT: 30,
            TIME_PER_DAY: 12 * 60,
            SHIFT_START: 1900
        },
        EXTENDED_SHIFT: {
            GAME_MINUTES_PER_SHIFT: 45,
            TIME_PER_DAY: 16 * 60,
            SHIFT_START: 1500  // 3:00 PM start
        }
    },
    
    // === CALCULATED PROPERTIES (DO NOT EDIT) ===
    get CALCULATED_SPEED_FACTOR() {
        // Auto-calculate optimal speed factor based on shift duration
        return Math.round(this.TIME_PER_DAY / this.GAME_MINUTES_PER_SHIFT);
    },
    
    get SHIFT_DURATION_HOURS() {
        // Human-readable shift duration
        return this.TIME_PER_DAY / 60;
    }
}

export default appConfig;