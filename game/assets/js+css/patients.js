
const PaitentsModule = (() => {
    console.log("Patients module initialized");

    // Must be async await so we can synchronously block patient loading until ready to load tasks
    const init = async() => {
        let response = await fetch("events/patients/joe.html");
        let html = await response.text()
        console.log(html);
        var patients = document.getElementById("patients");
        patients.innerHTML = html;
        console.log("Patient Joe initialized");
        return html;
    }

    return {
        init
    }
})();

export default PaitentsModule;