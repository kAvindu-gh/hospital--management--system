let reschedulingAppointmentId = null;

async function loadDropdownData() {
  const [patientsRes, doctorsRes] = await Promise.all([apiFetch("/patients/"), apiFetch("/doctors/")]);
  const patients = patientsRes.ok ? await patientsRes.json() : [];
  const doctors = doctorsRes.ok ? await doctorsRes.json() : [];

  document.getElementById("patient_id").innerHTML = patients.map(p => `<option value="${p.id}">${p.full_name}</option>`).join("");
  document.getElementById("doctor_id").innerHTML = doctors.map(d => `<option value="${d.id}">${d.full_name}</option>`).join("");
}

async function loadAppointments(statusFilter = "") {
  const tbody = document.getElementById("appointments-tbody");
  const query = statusFilter ? `?status=${statusFilter}` : "";
  const response = await apiFetch(`/appointments/${query}`);
  if (!response.ok) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Failed to load appointments.</td></tr>`; return; }

  const appointments = await response.json();
  if (appointments.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No appointments found.</td></tr>`; return; }

  tbody.innerHTML = appointments.map(a => `
    <tr>
      <td>${a.patient_name}</td>
      <td>${a.doctor_name}</td>
      <td>${new Date(a.appointment_date).toLocaleString()}</td>
      <td>${a.reason || "—"}</td>
      <td><span class="status-badge status-${a.status}">${a.status}</span></td>
      <td class="actions">
        ${a.status === "scheduled" ? `
          <button class="link-btn" onclick="openRescheduleModal(${a.id}, '${a.appointment_date}')">Reschedule</button>
          <button class="link-btn" onclick="markStatus(${a.id}, 'completed')">Complete</button>
          <button class="link-btn danger" onclick="markStatus(${a.id}, 'cancelled')">Cancel</button>
        ` : ""}
      </td>
    </tr>
  `).join("");
}

function toDateTimeLocalValue(value) {
  const date = new Date(value);
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function openRescheduleModal(id, appointmentDate) {
  reschedulingAppointmentId = id;
  document.getElementById("reschedule_date").value = toDateTimeLocalValue(appointmentDate);
  document.getElementById("reschedule-modal").classList.add("open");
}

function closeRescheduleModal() {
  reschedulingAppointmentId = null;
  document.getElementById("reschedule-modal").classList.remove("open");
}

async function handleRescheduleSubmit(event) {
  event.preventDefault();
  if (reschedulingAppointmentId === null) return;

  const response = await apiFetch(`/appointments/${reschedulingAppointmentId}`, {
    method: "PUT",
    body: JSON.stringify({ appointment_date: document.getElementById("reschedule_date").value }),
  });

  if (response.ok) {
    closeRescheduleModal();
    await loadAppointments(document.getElementById("status-filter").value);
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to reschedule appointment.");
  }
}

async function markStatus(id, status) {
  const response = await apiFetch(`/appointments/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
  if (response.ok) loadAppointments(document.getElementById("status-filter").value);
  else { const d = await response.json(); alert(d.detail || "Failed to update appointment."); }
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const payload = {
    patient_id: parseInt(document.getElementById("patient_id").value),
    doctor_id: parseInt(document.getElementById("doctor_id").value),
    appointment_date: document.getElementById("appointment_date").value,
    reason: document.getElementById("reason").value || null,
  };
  const response = await apiFetch("/appointments/", { method: "POST", body: JSON.stringify(payload) });
  if (response.ok) {
    closeModal();
    document.getElementById("booking-form").reset();
    loadAppointments(document.getElementById("status-filter").value);
  } else {
    const d = await response.json();
    alert(d.detail || "Failed to book appointment.");
  }
}

function openBookingModal() { document.getElementById("booking-modal").classList.add("open"); }
function closeModal() { document.getElementById("booking-modal").classList.remove("open"); }

document.addEventListener("DOMContentLoaded", async () => {
  const user = await initLayout("appointments.html");
  if (!user) return;
  await loadDropdownData();
  loadAppointments();
  document.getElementById("booking-form").addEventListener("submit", handleBookingSubmit);
  document.getElementById("reschedule-form").addEventListener("submit", handleRescheduleSubmit);
  document.getElementById("status-filter").addEventListener("change", (e) => loadAppointments(e.target.value));
});