let departmentsCache = [];
let editingDoctorId = null;

async function loadDepartments() {
  const response = await apiFetch("/departments/");
  departmentsCache = response.ok ? await response.json() : [];

  document.getElementById("department-list").innerHTML = departmentsCache.length
    ? departmentsCache.map(d => `
        <li class="department-item">
          <span>${d.name}</span>
          <button type="button" class="link-btn danger" onclick="deleteDepartment(${d.id})">Remove</button>
        </li>
      `).join("")
    : `<li class="empty-state">No departments yet.</li>`;

  document.getElementById("department_id").innerHTML =
    `<option value="">No department</option>` +
    departmentsCache.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
}

async function loadUnlinkedDoctorUsers() {
  const response = await apiFetch("/users/?role=doctor");
  const users = response.ok ? await response.json() : [];
  document.getElementById("user_id").innerHTML = users.length
    ? users.map(u => `<option value="${u.id}">${u.username} (${u.email})</option>`).join("")
    : `<option value="">No doctor accounts available — register one first</option>`;
}

async function loadDoctors() {
  const response = await apiFetch("/doctors/");
  const tbody = document.getElementById("doctors-tbody");
  if (!response.ok) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Failed to load doctors.</td></tr>`; return; }
  const doctors = await response.json();
  if (doctors.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No doctors added yet.</td></tr>`; return; }

  tbody.innerHTML = doctors.map(d => `
    <tr>
      <td>${d.full_name}</td>
      <td>${d.specialization || "—"}</td>
      <td>${departmentsCache.find(dep => dep.id === d.department_id)?.name || "—"}</td>
      <td class="actions">
        <button class="link-btn" onclick="openDoctorEditModal(${d.id})">Edit</button>
        <button class="link-btn danger" onclick="deleteDoctor(${d.id})">Delete</button>
      </td>
    </tr>
  `).join("");
}

async function openDoctorEditModal(id) {
  const response = await apiFetch(`/doctors/${id}`);
  if (!response.ok) {
    const data = await response.json();
    alert(data.detail || "Failed to load doctor details.");
    return;
  }

  const doctor = await response.json();
  editingDoctorId = id;
  document.getElementById("edit_doctor_full_name").value = doctor.full_name || "";
  document.getElementById("edit_specialization").value = doctor.specialization || "";
  document.getElementById("edit_department_id").innerHTML =
    `<option value="">No department</option>` +
    departmentsCache.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
  document.getElementById("edit_department_id").value = doctor.department_id || "";
  document.getElementById("doctor-modal").classList.add("open");
}

function closeDoctorModal() {
  editingDoctorId = null;
  document.getElementById("doctor-modal").classList.remove("open");
}

async function handleDoctorEditSubmit(event) {
  event.preventDefault();
  if (editingDoctorId === null) return;

  const payload = {
    full_name: document.getElementById("edit_doctor_full_name").value,
    specialization: document.getElementById("edit_specialization").value || null,
    department_id: document.getElementById("edit_department_id").value
      ? parseInt(document.getElementById("edit_department_id").value)
      : null,
  };
  const response = await apiFetch(`/doctors/${editingDoctorId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    closeDoctorModal();
    await loadDoctors();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to update doctor.");
  }
}

async function deleteDoctor(id) {
  if (!confirm("Remove this doctor profile?")) return;
  const response = await apiFetch(`/doctors/${id}`, { method: "DELETE" });
  if (response.ok) {
    await loadDoctors();
    await loadUnlinkedDoctorUsers();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to remove doctor.");
  }
}

async function deleteDepartment(id) {
  if (!confirm("Remove this department?")) return;
  const response = await apiFetch(`/departments/${id}`, { method: "DELETE" });
  if (response.ok) {
    await loadDepartments();
    await loadDoctors();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to remove department.");
  }
}

async function handleDepartmentSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("new_department_name").value;
  const response = await apiFetch("/departments/", { method: "POST", body: JSON.stringify({ name }) });
  if (response.ok) { document.getElementById("department-form").reset(); loadDepartments(); }
  else { const d = await response.json(); alert(d.detail || "Failed to create department."); }
}

async function handleDoctorSubmit(event) {
  event.preventDefault();
  const payload = {
    user_id: parseInt(document.getElementById("user_id").value),
    department_id: document.getElementById("department_id").value ? parseInt(document.getElementById("department_id").value) : null,
    full_name: document.getElementById("doctor_full_name").value,
    specialization: document.getElementById("specialization").value || null,
  };
  const response = await apiFetch("/doctors/", { method: "POST", body: JSON.stringify(payload) });
  if (response.ok) {
    document.getElementById("doctor-form").reset();
    loadDoctors();
    loadUnlinkedDoctorUsers();
  } else {
    const d = await response.json();
    alert(d.detail || "Failed to add doctor.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await initLayout("doctors.html");
  if (!user) return;
  await loadDepartments();
  await loadUnlinkedDoctorUsers();
  await loadDoctors();
  document.getElementById("department-form").addEventListener("submit", handleDepartmentSubmit);
  document.getElementById("doctor-form").addEventListener("submit", handleDoctorSubmit);
  document.getElementById("doctor-edit-form").addEventListener("submit", handleDoctorEditSubmit);
});