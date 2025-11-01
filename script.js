async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("user_id", data.user.id);
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("error-message").innerText = data.message;
        }
    } catch (error) {
        console.error("Error:", error);
    }
}