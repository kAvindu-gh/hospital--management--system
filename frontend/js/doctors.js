let departmentsCache = [];

async function loadDepartments() {
  const response = await apiFetch("/departments/");
  departmentsCache = response.ok ? await response.json() : [];

  document.getElementById("department-list").innerHTML = departmentsCache.length
    ? departmentsCache.map(d => `<li>${d.name}</li>`).join("")
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
      <td class="actions"><button class="link-btn danger" onclick="deleteDoctor(${d.id})">Delete</button></td>
    </tr>
  `).join("");
}

async function deleteDoctor(id) {
  if (!confirm("Remove this doctor profile?")) return;
  const response = await apiFetch(`/doctors/${id}`, { method: "DELETE" });
  if (response.ok) loadDoctors();
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
});