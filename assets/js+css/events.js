let ScheduledEvents = {
    getTasksAtHHMM: (() =>{
        var that = new signals.Signal();
        that.add((hhmm) => {
            console.log("getTasksAtHHMM", hhmm);
            const $revealScheduledTasks = $("#reveal-scheduled-tasks");
            const rules = $revealScheduledTasks.html();
            $revealScheduledTasks.html(rules + (()=>{
                return `
                li[data-scheduled="${hhmm}"] {
                    opacity: 1 !important;
                }
                `
            })());
        });

        return that;
    })()
    
}

export default ScheduledEvents;