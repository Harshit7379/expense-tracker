const API_BASE_URL = "http://localhost:8080";
const TOKEN_KEY = "expenseTrackerToken";

const authState = {
    token: localStorage.getItem(TOKEN_KEY) || ""
};

const authElements = {};

document.addEventListener("DOMContentLoaded", initAuth);

function initAuth() {
    authElements.authSection = document.getElementById("authSection");
    authElements.dashboardSection = document.getElementById("dashboardSection");
    authElements.logoutBtn = document.getElementById("logoutBtn");
    authElements.registerForm = document.getElementById("registerForm");
    authElements.loginForm = document.getElementById("loginForm");
    authElements.authMessage = document.getElementById("authMessage");
    authElements.loadingOverlay = document.getElementById("loadingOverlay");

    authElements.registerForm.addEventListener("submit", registerUser);
    authElements.loginForm.addEventListener("submit", loginUser);
    authElements.logoutBtn.addEventListener("click", logoutUser);

    if (authState.token) {
        showDashboard();
        window.initExpenseDashboard();
    } else {
        showAuth();
    }
}

async function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !email || !password) {
        showMessage(authElements.authMessage, "Please fill all register fields.", "error");
        return;
    }

    try {
        setLoading(true);
        await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password })
        });

        document.getElementById("loginEmail").value = email;
        document.getElementById("loginPassword").value = password;
        authElements.registerForm.reset();
        showMessage(authElements.authMessage, "Registration successful. Click Login to continue.", "success");
    } catch (error) {
        showMessage(authElements.authMessage, readableError(error, "Registration failed."), "error");
    } finally {
        setLoading(false);
    }
}

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        showMessage(authElements.authMessage, "Please enter email and password.", "error");
        return;
    }

    try {
        setLoading(true);
        const token = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (typeof token !== "string" || !token.includes(".")) {
            throw new Error(token || "Invalid login.");
        }

        authState.token = token;
        localStorage.setItem(TOKEN_KEY, token);
        authElements.loginForm.reset();
        showMessage(authElements.authMessage, "Login successful.", "success");
        showDashboard();
        window.initExpenseDashboard();
    } catch (error) {
        showMessage(authElements.authMessage, readableError(error, "Invalid login."), "error");
    } finally {
        setLoading(false);
    }
}

function logoutUser() {
    authState.token = "";
    localStorage.removeItem(TOKEN_KEY);
    if (window.resetExpenseDashboard) {
        window.resetExpenseDashboard();
    }
    showAuth();
    showMessage(authElements.authMessage, "Logged out successfully.", "success");
}

function showDashboard() {
    authElements.authSection.classList.add("hidden");
    authElements.dashboardSection.classList.remove("hidden");
    authElements.logoutBtn.classList.remove("hidden");
}

function showAuth() {
    authElements.authSection.classList.remove("hidden");
    authElements.dashboardSection.classList.add("hidden");
    authElements.logoutBtn.classList.add("hidden");
}

function getAuthToken() {
    return authState.token;
}

function requireAuthToken() {
    if (!authState.token) {
        showAuth();
        throw new Error("Please login first.");
    }
    return authState.token;
}

async function apiRequest(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });
    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(responseText || `API failed with status ${response.status}`);
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return responseText;
    }
}

function setLoading(isLoading) {
    authElements.loadingOverlay.classList.toggle("hidden", !isLoading);
}

function showMessage(element, message, type) {
    element.textContent = message || "";
    element.className = `message ${type || ""}`;
}

function readableError(error, fallback) {
    const message = error && error.message ? error.message : fallback;
    if (message.includes("User Not Found")) return "User not found. Please register first.";
    if (message.includes("Invalid Password")) return "Invalid login. Please check your password.";
    if (message.includes("Email already registered")) return "Email already registered. Please login or use another email.";
    return message || fallback;
}
