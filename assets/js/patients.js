
const PaitentsModule = (() => {
    console.log("Patients module initialized");
    const init = () => {
        fetch("events/patients/joe.html")
        .then(response => response.text())
        .then(html => {
            console.log(html);
            var patients = document.getElementById("patients");
            patients.innerHTML = html;
            console.log("Patient Joe initialized");
        });
    }

    return {
        init
    }
})();

export default PaitentsModule;