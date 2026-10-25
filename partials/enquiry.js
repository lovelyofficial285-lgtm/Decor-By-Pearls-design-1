    const form = document.getElementById("enquiryForm");
    const btn = document.getElementById("enqBtn");
    const msg = document.getElementById("enqMsg");

    function show(type, text) {
    msg.className = "enq__msg " + type;
    msg.textContent = text;
    }

    function isValid(i) {
    const v = i.value.trim();
    if (!v) return false;
    if (i.name === "phone") return /^\+?[0-9\s-]{8,15}$/.test(v);
    if (i.name === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (i.name === "date") return v >= new Date().toISOString().slice(0, 10);
    return true;
    }

    function validate() {
    let ok = true;
    form.querySelectorAll(".enq__field").forEach((f) => {
        const i = f.querySelector("input, select");
        if (!i) return;
        const valid = isValid(i);
        f.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
    });
    return ok;
    }

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("1. submit clicked");
    msg.className = "enq__msg";

    const valid = validate();
    console.log("2. valid:", valid);
    if (!valid) {
        show("is-bad", "Please fill in all fields correctly.");
        form.querySelector(".is-invalid input, .is-invalid select")?.focus();
        return;
    }
    if (form.website.value) return; // bot trap

    const captcha = form.querySelector('[name="h-captcha-response"]');
    if (!captcha || !captcha.value) {
    show("is-bad", "Please complete the CAPTCHA.");
    return;
}

    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
        const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
        });
        const data = await res.json();
        console.log("4. Web3Forms response:", data);
        if (data.success) {
        show("is-ok", "Thank you! Your enquiry has been sent. We will contact you shortly.");
        form.reset();  
        if (window.hcaptcha) hcaptcha.reset();
        
        } else {
        show("is-bad", "Submission failed. Please try again or call +91-7355051840.");
        }
    } catch (err) {
        console.log("Error:", err);
        show("is-bad", "Network error. Please try again or call +91-7355051840.");
    }
    btn.textContent = "Submit Enquiry";
    btn.disabled = false;
    });