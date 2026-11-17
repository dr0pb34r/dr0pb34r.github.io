// Keep an old static build from advertising a session that has already finished.
document.querySelectorAll('[data-session-end]').forEach((panel) => {
  const end = Date.parse(panel.dataset.sessionEnd);
  if (Number.isFinite(end) && end <= Date.now()) {
    panel.querySelector('[data-current-session]').hidden = true;
    panel.querySelector('[data-expired-session]').hidden = false;
  }
});
document.querySelectorAll('[data-catalogue-session-end]').forEach((label) => {
  const end = Date.parse(label.dataset.catalogueSessionEnd);
  if (Number.isFinite(end) && end <= Date.now()) label.textContent = 'Next date to be announced';
});
