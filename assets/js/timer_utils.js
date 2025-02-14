// Function to round down to nearest 15 min mark
// Eg. 1937 -> 1930
function roundDownTo15(hhmm) {
    let hours = Math.floor(hhmm / 100);
    let minutes = hhmm % 100;

    // Round down to the nearest 15-minute mark
    minutes = Math.floor(minutes / 15) * 15;

    return hours * 100 + minutes;
} // roundDownTo15

// Function to add minutes to a timemark, rounded down to nearest 15 min mark
// console.log(timemarkPlusMinutes(1900, 37)); // Output: '1930'
// console.log(timemarkPlusMinutes(2330, 45)); // Output: '0015'
// console.log(timemarkPlusMinutes(1007, 120)); // Output: '1200'
function timemarkPlusMinutes(hhmm, totalMinutes) {
    let hours = Math.floor(hhmm / 100);
    let minutes = hhmm % 100;
  
    // Add totalMinutes
    let newMinutes = minutes + totalMinutes;
    let newHours = hours + Math.floor(newMinutes / 60);
    newMinutes = newMinutes % 60;
  
    // Handle overflow past midnight (optional behavior)
    if (newHours >= 24) newHours = newHours % 24;
  
    let newTime = newHours * 100 + newMinutes;
  
    // Round down to the next 15-minute mark
    return roundDownTo15(newTime).toString().padStart(4, '0');
  } // timemarkPlusMinutes


// Function to divide total minutes by 15
// Eg. 60 -> 4
function divideBy15Mins(totalMinutes) {
    return Math.floor(totalMinutes / 15);
} // divideMinsBy15

// Function to list 15 min timemarks from hhmm
// Eg. 1900, 10 -> [1900, 1915, 1930, 1945, 2000, 2015, 2030, 2045, 2100, 2115]
function list15MinTimemarksFromHHMM(hhmm, howManyTimes = 10) {
    
    var count = howManyTimes;
    
    let hours = Math.floor(hhmm / 100);
    let minutes = hhmm % 100;

    // Round down to the nearest 15-minute mark
    minutes = Math.floor(minutes / 15) * 15;

    let intervals = [];
    for (let i = 0; i < count; i++) {
        let newMinutes = minutes + i * 15;
        let newHours = hours + Math.floor(newMinutes / 60);
        newMinutes = newMinutes % 60;

        if (newHours >= 24) break; // Stop if we pass midnight

        let formattedTime = (newHours * 100 + newMinutes).toString().padStart(4, '0');
        formattedTime = parseInt(formattedTime);
        intervals.push(formattedTime);
    }

    return intervals;
} // list15MinTimemarksFromHHMM

export { roundDownTo15, timemarkPlusMinutes, divideBy15Mins, list15MinTimemarksFromHHMM };