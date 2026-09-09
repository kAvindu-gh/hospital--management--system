async function handleRegister(event) {
  event.preventDefault();
  const errorBox = document.getElementById("error-message");
  errorBox.style.display = "none";

  const payload = {
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
  };

  const response = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) });

  if (response.ok) {
    window.location.href = "login.html";
  } else {
    const data = await response.json();
    errorBox.textContent = data.detail || "Registration failed";
    errorBox.style.display = "block";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const errorBox = document.getElementById("error-message");
  errorBox.style.display = "none";

  const payload = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
  };

  const response = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) });

  if (response.ok) {
    const data = await response.json();
    saveToken(data.access_token);
    window.location.href = "index.html";
  } else {
    const data = await response.json();
    errorBox.textContent = data.detail || "Login failed";
    errorBox.style.display = "block";
  }
}

function handleLogout() {
  if (!confirm("Do you want to logout?")) return;
  clearToken();
  window.location.href = "login.html";
}