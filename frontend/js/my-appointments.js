async function loadMyAppointments() {
  const tbody = document.getElementById("my-appointments-tbody");
  const response = await apiFetch("/appointments/me");
  if (!response.ok) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Failed to load your appointments.</td></tr>`; return; }
  const appointments = await response.json();
  if (appointments.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No appointments assigned yet.</td></tr>`; return; }

  tbody.innerHTML = appointments.map(a => `
    <tr>
      <td>${a.patient_name}</td>
      <td>${new Date(a.appointment_date).toLocaleString()}</td>
      <td>${a.reason || "—"}</td>
      <td><span class="status-badge status-${a.status}">${a.status}</span></td>
    </tr>
  `).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await initLayout("my-appointments.html");
  if (!user) return;
  loadMyAppointments();
});