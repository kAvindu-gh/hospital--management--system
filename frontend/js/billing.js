async function loadAppointmentOptions() {
  const response = await apiFetch("/appointments/");
  const select = document.getElementById("appointment_id");
  if (!response.ok) { select.innerHTML = `<option value="">Failed to load appointments</option>`; return; }
  const appointments = await response.json();
  select.innerHTML = appointments.length
    ? appointments.map(a => `<option value="${a.id}">${a.patient_name} - ${a.doctor_name} - ${new Date(a.appointment_date).toLocaleString()}</option>`).join("")
    : `<option value="">No appointments available</option>`;
}

async function loadInvoices() {
  const tbody = document.getElementById("invoices-tbody");
  const response = await apiFetch("/invoices/");
  if (response.status === 403) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">You don't have permission to view billing.</td></tr>`;
    return;
  }
  if (!response.ok) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Failed to load invoices.</td></tr>`; return; }

  const invoices = await response.json();
  if (invoices.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No invoices generated yet.</td></tr>`; return; }

  tbody.innerHTML = invoices.map(inv => `
    <tr>
      <td>${inv.patient_name || "—"}</td>
      <td>${inv.doctor_name || "—"}</td>
      <td>Rs. ${Number(inv.amount).toFixed(2)}</td>
      <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
      <td>${new Date(inv.created_at).toLocaleDateString()}</td>
      <td class="actions">
        ${inv.status === "unpaid" ? `<button class="link-btn" onclick="markPaid(${inv.id})">Mark Paid</button>` : "—"}
      </td>
    </tr>
  `).join("");
}

async function markPaid(id) {
  if (!confirm("Mark this invoice as paid?")) return;
  const response = await apiFetch(`/invoices/${id}/pay`, { method: "PUT" });
  if (response.ok) {
    loadInvoices();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to update invoice.");
  }
}

function openInvoiceModal() {
  document.getElementById("invoice-form").reset();
  document.getElementById("invoice-modal").classList.add("open");
}
function closeInvoiceModal() { document.getElementById("invoice-modal").classList.remove("open"); }

async function handleInvoiceSubmit(event) {
  event.preventDefault();
  const payload = {
    appointment_id: parseInt(document.getElementById("appointment_id").value),
    amount: parseFloat(document.getElementById("amount").value),
  };
  const response = await apiFetch("/invoices/", { method: "POST", body: JSON.stringify(payload) });
  if (response.ok) {
    closeInvoiceModal();
    loadInvoices();
  } else {
    const data = await response.json();
    alert(data.detail || "Failed to generate invoice.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await initLayout("billing.html");
  if (!user) return;
  await loadAppointmentOptions();
  await loadInvoices();
  document.getElementById("invoice-form").addEventListener("submit", handleInvoiceSubmit);
});