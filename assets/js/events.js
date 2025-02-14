let ScheduledEvents = {
    getTasksAtHHMM: (() =>{
        var that = new signals.Signal();
        that.add((hhmm) => {
            console.log("getTasksAtHHMM", hhmm);
        });

        return that;
    })()
    
}

export default ScheduledEvents;