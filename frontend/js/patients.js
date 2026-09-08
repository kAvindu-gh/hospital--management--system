let editingPatientId = null;

async function loadPatients(searchTerm = "") {
  const tbody = document.getElementById("patients-tbody");
  const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
  const response = await apiFetch(`/patients/${query}`);

  if (response.status === 403) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">You don't have permission to view patients.</td></tr>`;
    return;
  }
  if (!response.ok) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Failed to load patients.</td></tr>`;
    return;
  }

  const patients = await response.json();
  if (patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No patients found.</td></tr>`;
    return;
  }

  tbody.innerHTML = patients.map(p => `
    <tr>
      <td>${p.full_name}</td>
      <td>${p.date_of_birth || "—"}</td>
      <td>${p.gender || "—"}</td>
      <td>${p.phone || "—"}</td>
      <td>${p.address || "—"}</td>
      <td class="actions">
        <button class="link-btn" onclick="openViewModal(${p.id})">View</button>
        <button class="link-btn" onclick="openEditModal(${p.id})">Edit</button>
        <button class="link-btn danger" onclick="deletePatient(${p.id})">Delete</button>
      </td>
    </tr>
  `).join("");
}

function openAddModal() {
  editingPatientId = null;
  document.getElementById("modal-title").textContent = "Add Patient";
  document.getElementById("patient-form").reset();
  document.getElementById("patient-modal").classList.add("open");
}

async function openEditModal(id) {
  const response = await apiFetch(`/patients/${id}`);
  if (!response.ok) return;
  const patient = await response.json();

  editingPatientId = id;
  document.getElementById("modal-title").textContent = "Edit Patient";
  document.getElementById("full_name").value = patient.full_name || "";
  document.getElementById("date_of_birth").value = patient.date_of_birth || "";
  document.getElementById("gender").value = patient.gender || "";
  document.getElementById("phone").value = patient.phone || "";
  document.getElementById("address").value = patient.address || "";
  document.getElementById("patient-modal").classList.add("open");
}

async function openViewModal(id) {
  const response = await apiFetch(`/patients/${id}`);
  if (!response.ok) return;
  const p = await response.json();

  document.getElementById("view-body").innerHTML = `
    <p><strong>Name:</strong> ${p.full_name}</p>
    <p><strong>Date of Birth:</strong> ${p.date_of_birth || "—"}</p>
    <p><strong>Gender:</strong> ${p.gender || "—"}</p>
    <p><strong>Phone:</strong> ${p.phone || "—"}</p>
    <p><strong>Address:</strong> ${p.address || "—"}</p>
    <p style="margin-top: 1rem; color: #718096; font-size: 0.85rem;">
      Full visit and treatment history will appear here once Appointments and Medical Records are built.
    </p>
  `;
  document.getElementById("view-modal").classList.add("open");
}

function closeModal() { document.getElementById("patient-modal").classList.remove("open"); }
function closeViewModal() { document.getElementById("view-modal").classList.remove("open"); }

async function handlePatientFormSubmit(event) {
  event.preventDefault();

  const payload = {
    full_name: document.getElementById("full_name").value,
    date_of_birth: document.getElementById("date_of_birth").value || null,
    gender: document.getElementById("gender").value || null,
    phone: document.getElementById("phone").value || null,
    address: document.getElementById("address").value || null,
  };

  const isEdit = editingPatientId !== null;
  const response = await apiFetch(isEdit ? `/patients/${editingPatientId}` : "/patients/", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    closeModal();
    loadPatients(document.getElementById("search-box").value);
  } else {
    const data = await response.json();
    alert(data.detail || "Something went wrong.");
  }
}

async function deletePatient(id) {
  if (!confirm("Delete this patient record? This cannot be undone.")) return;
  const response = await apiFetch(`/patients/${id}`, { method: "DELETE" });
  if (response.ok) {
    loadPatients(document.getElementById("search-box").value);
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to delete patient.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  const meResponse = await apiFetch("/auth/me");
  if (!meResponse.ok) { clearToken(); window.location.href = "login.html"; return; }
  const user = await meResponse.json();
  document.getElementById("user-chip-text").textContent = `${user.username} (${user.role})`;

  loadPatients();

  document.getElementById("search-box").addEventListener("input", (e) => loadPatients(e.target.value));
  document.getElementById("patient-form").addEventListener("submit", handlePatientFormSubmit);
});