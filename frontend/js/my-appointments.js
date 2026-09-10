let currentRecordAppointmentId = null;
let recordExists = false;

async function loadMyAppointments() {
  const tbody = document.getElementById("my-appointments-tbody");
  const response = await apiFetch("/appointments/me");
  if (!response.ok) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Failed to load your appointments.</td></tr>`; return; }
  const appointments = await response.json();
  if (appointments.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No appointments assigned yet.</td></tr>`; return; }

  tbody.innerHTML = appointments.map(a => `
    <tr>
      <td>${a.patient_name}</td>
      <td>${new Date(a.appointment_date).toLocaleString()}</td>
      <td>${a.reason || "—"}</td>
      <td><span class="status-badge status-${a.status}">${a.status}</span></td>
      <td class="actions">
        <button class="link-btn" onclick="openRecordModal(${a.id}, '${a.patient_name.replace(/'/g, "\\'")}')">Diagnosis</button>
      </td>
    </tr>
  `).join("");
}

async function openRecordModal(appointmentId, patientName) {
  currentRecordAppointmentId = appointmentId;
  document.getElementById("record-modal-subtitle").textContent = `For ${patientName}`;

  const response = await apiFetch(`/appointments/${appointmentId}/medical-record`);
  if (response.status === 404) {
    recordExists = false;
    document.getElementById("diagnosis").value = "";
    document.getElementById("prescription").value = "";
    document.getElementById("notes").value = "";
  } else if (response.ok) {
    recordExists = true;
    const record = await response.json();
    document.getElementById("diagnosis").value = record.diagnosis || "";
    document.getElementById("prescription").value = record.prescription || "";
    document.getElementById("notes").value = record.notes || "";
  } else {
    alert("Failed to load medical record.");
    return;
  }

  document.getElementById("record-modal").classList.add("open");
}

function closeRecordModal() {
  document.getElementById("record-modal").classList.remove("open");
}

async function handleRecordSubmit(event) {
  event.preventDefault();

  const payload = {
    diagnosis: document.getElementById("diagnosis").value || null,
    prescription: document.getElementById("prescription").value || null,
    notes: document.getElementById("notes").value || null,
  };

  const response = await apiFetch(`/appointments/${currentRecordAppointmentId}/medical-record`, {
    method: recordExists ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    closeRecordModal();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to save medical record.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await initLayout("my-appointments.html");
  if (!user) return;
  loadMyAppointments();
  document.getElementById("record-form").addEventListener("submit", handleRecordSubmit);
});