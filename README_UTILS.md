# Time Engine Documentation

## Overview

The Time Engine is a JavaScript utility module that provides time manipulation functions specifically designed for game mechanics that operate on 15-minute intervals. All functions work with a 24-hour time format represented as 4-digit integers (HHMM).

## Time Format

All functions use the **HHMM format** as integers:
- `1900` = 7:00 PM
- `0830` = 8:30 AM  
- `2345` = 11:45 PM
- `0000` = 12:00 AM (midnight)

## API Reference

### `roundDownTo15(hhmm)`

Rounds down any time to the nearest 15-minute mark.

**Parameters:**
- `hhmm` (number): Time in HHMM format

**Returns:**
- (number): Time rounded down to nearest 15-minute interval

**Examples:**
```javascript
roundDownTo15(1937); // Returns 1930
roundDownTo15(1007); // Returns 1000
roundDownTo15(2359); // Returns 2345
```

---

### `timemarkPlusMinutes(hhmm, totalMinutes)`

Adds minutes to a given time and rounds the result down to the nearest 15-minute mark. Handles day overflow automatically.

**Parameters:**
- `hhmm` (number): Starting time in HHMM format
- `totalMinutes` (number): Minutes to add

**Returns:**
- (string): New time as a 4-digit zero-padded string

**Examples:**
```javascript
timemarkPlusMinutes(1900, 37);  // Returns '1930'
timemarkPlusMinutes(2330, 45);  // Returns '0015' (next day)
timemarkPlusMinutes(1007, 120); // Returns '1200' (2 hours later)
```

**Note:** This function returns a string with zero-padding, unlike other functions that return numbers.

---

### `divideBy15Mins(totalMinutes)`

Converts total minutes into 15-minute intervals by dividing by 15 and rounding down.

**Parameters:**
- `totalMinutes` (number): Total minutes to convert

**Returns:**
- (number): Number of 15-minute intervals

**Examples:**
```javascript
divideBy15Mins(60);  // Returns 4 (60 minutes = 4 × 15-minute intervals)
divideBy15Mins(37);  // Returns 2 (37 minutes = 2 × 15-minute intervals + remainder)
divideBy15Mins(15);  // Returns 1
```

---

### `list15MinTimemarksFromHHMM(hhmm, howManyTimes = 10)`

Generates a list of consecutive 15-minute time intervals starting from a given time.

**Parameters:**
- `hhmm` (number): Starting time in HHMM format
- `howManyTimes` (number, optional): Number of intervals to generate (default: 10)

**Returns:**
- (Array<number>): Array of time intervals in HHMM format

**Examples:**
```javascript
list15MinTimemarksFromHHMM(1900, 5);
// Returns [1900, 1915, 1930, 1945, 2000]

list15MinTimemarksFromHHMM(2330, 3);
// Returns [2330, 2345] (stops at midnight)
```

**Note:** The function automatically stops generating intervals if midnight (24:00) is reached.

## Usage

### Importing

```javascript
import { 
  roundDownTo15, 
  timemarkPlusMinutes, 
  divideBy15Mins, 
  list15MinTimemarksFromHHMM 
} from './timer_utils.js';
```

### Common Use Cases

#### Scheduling Game Events
```javascript
const gameStartTime = 1900; // 7:00 PM
const eventDuration = 45; // 45 minutes

// Calculate when the event ends
const eventEndTime = timemarkPlusMinutes(gameStartTime, eventDuration);
console.log(`Event ends at: ${eventEndTime}`); // "1930"
```

#### Creating Time Slots
```javascript
const startTime = 0800; // 8:00 AM
const numberOfSlots = 8;

const timeSlots = list15MinTimemarksFromHHMM(startTime, numberOfSlots);
// [800, 815, 830, 845, 900, 915, 930, 945]
```

#### Converting Duration to Game Intervals
```javascript
const totalGameMinutes = 120; // 2 hours
const gameIntervals = divideBy15Mins(totalGameMinutes);
console.log(`${totalGameMinutes} minutes = ${gameIntervals} game intervals`);
// "120 minutes = 8 game intervals"
```

## Technical Details

### Time Arithmetic
- All calculations handle 60-minute hour boundaries automatically
- Day overflow is supported (times past 23:59 wrap to next day)
- All rounding operations round **down** to maintain consistency

### Limitations
- Times are assumed to be valid (0000-2359)
- No validation is performed on input parameters
- `list15MinTimemarksFromHHMM` stops at midnight and won't continue to next day
- Negative time additions are not explicitly handled

### Performance
- All operations are O(1) except `list15MinTimemarksFromHHMM` which is O(n)
- Functions use basic arithmetic operations for optimal performance

## Integration Notes

The Time Engine is designed to work seamlessly with game mechanics that require:
- Consistent 15-minute time intervals
- Real-time scheduling
- Time-based event management
- Patient scheduling (in medical simulation contexts)

For game integration, consider using these utilities alongside your game state management system to maintain synchronized timing across all game components.

---

# App Configuration System

## Overview

The game uses a centralized configuration system in `game/app.config.js` that allows developers to easily adjust time mechanics without diving into individual game modules.

## Quick Start

### Using Presets

The fastest way to change game timing is using presets via URL parameters:

```
game/index.html?preset=DEMO           # 2-minute quick test
game/index.html?preset=QUICK_PRACTICE # 5-minute practice
game/index.html?preset=FULL_SHIFT     # 30-minute full experience
game/index.html?preset=EXTENDED_SHIFT # 45-minute extended shift
```

### Developer Console Access

During development, use the browser console to:

```javascript
// View current configuration
gameConfig.getTimeConfigSummary();

// Switch to a different preset
gameConfig.applyPreset('DEMO');

// View available presets
gameConfig.availablePresets;

// Access raw config
gameConfig.currentConfig;
```

## Configuration Properties

### Core Settings

| Property | Description | Example |
|----------|-------------|---------|
| `GAME_MINUTES_PER_SHIFT` | How long the player actually plays (real minutes) | `10` = 10 minute session |
| `TIME_PER_DAY` | Game minutes in one shift | `720` = 12 hour shift |
| `SHIFT_START` | When the shift begins (HHMM format) | `1900` = 7:00 PM |
| `SHIFT_END` | When the shift ends (HHMM format) | `700` = 7:00 AM |

### Advanced Settings

| Property | Description | Use Case |
|----------|-------------|----------|
| `TOTAL_DAYS` | Number of game days | Multi-day scenarios |
| `GAME_MINUTES_PER_REAL_SECOND` | Time acceleration | Speed adjustments |
| `TASK_INTERVAL_MINUTES` | Task scheduling granularity | 15-minute blocks |

### Calculated Properties (Read-Only)

| Property | Description |
|----------|-------------|
| `CALCULATED_SPEED_FACTOR` | Auto-calculated optimal speed |
| `SHIFT_DURATION_HOURS` | Human-readable duration |

## Creating Custom Presets

Add new presets to the `PRESETS` object in `app.config.js`:

```javascript
PRESETS: {
    MY_CUSTOM_SCENARIO: {
        GAME_MINUTES_PER_SHIFT: 15,
        TIME_PER_DAY: 8 * 60,     // 8 hour shift
        SHIFT_START: 800          // 8:00 AM start
    }
}
```

## Examples

### Scenario 1: Quick Testing
```javascript
// 3-minute real-time test of 2-hour game shift
GAME_MINUTES_PER_SHIFT: 3
TIME_PER_DAY: 2 * 60
SHIFT_START: 1900
```

### Scenario 2: Realistic Training
```javascript
// 45-minute realistic full 12-hour shift
GAME_MINUTES_PER_SHIFT: 45
TIME_PER_DAY: 12 * 60
SHIFT_START: 1900
```

### Scenario 3: Day Shift
```javascript
// 30-minute day shift experience
GAME_MINUTES_PER_SHIFT: 30
TIME_PER_DAY: 12 * 60
SHIFT_START: 700  // 7:00 AM
SHIFT_END: 1900   // 7:00 PM
```

## URL Parameters

The system still supports legacy URL parameters that override config values:

- `?speed-factor=72` - Override calculated speed factor
- `?shift-starts=0800` - Override shift start time
- `?shift-duration=480` - Override shift duration (in game minutes)
- `?preset=DEMO` - Apply a preset configuration

## Migration Guide

If you have existing hardcoded values:

1. Move time constants to `app.config.js`
2. Import and use `appConfig` in your modules
3. Use `appConfig.CALCULATED_SPEED_FACTOR` instead of manual calculations
4. Test with different presets to ensure flexibility

## Best Practices

1. **Use presets** for common scenarios instead of hardcoding
2. **Test with DEMO preset** for quick iterations
3. **Document custom presets** with clear use cases
4. **Use calculated properties** rather than duplicating math
5. **Validate configurations** before deploying to players 