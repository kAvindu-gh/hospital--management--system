const NAV_ITEMS = {
  admin: [
    { href: "index.html", label: "Dashboard" },
    { href: "patients.html", label: "Patients" },
    { href: "doctors.html", label: "Doctors" },
    { href: "appointments.html", label: "Appointments" },
    { href: "billing.html", label: "Billing" },
  ],
  receptionist: [
    { href: "index.html", label: "Dashboard" },
    { href: "patients.html", label: "Patients" },
    { href: "appointments.html", label: "Appointments" },
    { href: "billing.html", label: "Billing" },
  ],
  doctor: [
    { href: "index.html", label: "Dashboard" },
    { href: "my-appointments.html", label: "My Appointments" },
  ],
};

const ROLE_EMOJIS = {
  admin: "👑",
  receptionist: "🧑‍💼",
  doctor: "🩺",
};

function formatUserChip(user) {
  const emoji = ROLE_EMOJIS[user.role] || "👤";
  return `${emoji} ${user.username} (${user.role})`;
}

async function initLayout(activePage) {
  if (!getToken()) { window.location.href = "login.html"; return null; }

  const response = await apiFetch("/auth/me");
  if (!response.ok) { clearToken(); window.location.href = "login.html"; return null; }
  const user = await response.json();

  const navContainer = document.getElementById("sidebar-nav");
  const items = NAV_ITEMS[user.role] || [];
  navContainer.innerHTML = items
    .map(item => `<a href="${item.href}" class="${item.href === activePage ? "active" : ""}">${item.label}</a>`)
    .join("");

  document.getElementById("user-chip-text").textContent = formatUserChip(user);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  return user;
}