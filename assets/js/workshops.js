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
  const saleEnd = Date.parse(label.dataset.catalogueSalesEnd);
  if ((Number.isFinite(end) && end <= Date.now()) || (Number.isFinite(saleEnd) && saleEnd <= Date.now())) label.textContent = label.dataset.waitlistNotice || 'waitlist open';
});

document.querySelectorAll('[data-provider-sessions]').forEach((sessions) => {
  sessions.querySelectorAll('[data-provider-event-end]').forEach((event) => {
    const end = Date.parse(event.dataset.providerEventEnd);
    const saleEnd = Date.parse(event.dataset.providerSalesEnd);
    if ((Number.isFinite(end) && end <= Date.now()) || (Number.isFinite(saleEnd) && saleEnd <= Date.now())) event.hidden = true;
  });
  if (!sessions.querySelector('[data-provider-event-end]:not([hidden])')) {
    sessions.hidden = true;
    sessions.parentElement.querySelector('[data-provider-finished]').hidden = false;
  }
});

// Kit loads its forms asynchronously. Keep preference choices optional and
// require an explicit postcard interest before the newsletter can be submitted.
function enhanceSignupForms() {
  document.querySelectorAll('.course-waitlist form:not([data-preferences-ready])').forEach((form) => {
    const fields = [
      ['preferred delivery (optional)', ['in person', 'online', 'no preference']],
      ['preferred day (optional)', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'no preference']]
    ];
    fields.forEach(([placeholder, choices], index) => {
      const input = Array.from(form.querySelectorAll('input')).find((field) => field.placeholder === placeholder);
      if (!input) return;
      if (input.hasAttribute('list')) return;
      const list = document.createElement('datalist');
      list.id = `preference-${form.dataset.uid || form.id}-${index}`;
      choices.forEach((choice) => {
        const option = document.createElement('option');
        option.value = choice;
        list.append(option);
      });
      input.setAttribute('list', list.id);
      form.append(list);
    });
    if (fields.every(([placeholder]) => Array.from(form.querySelectorAll('input')).some((field) => field.placeholder === placeholder))) {
      form.dataset.preferencesReady = 'true';
    }
  });
  document.querySelectorAll('[data-newsletter-signup] form:not([data-interests-ready])').forEach((form) => {
    const interests = Array.from(form.querySelectorAll('input[type="checkbox"][name="tags[]"]'));
    if (!interests.length) return;
    const validateInterests = () => interests[0].setCustomValidity(
      interests.some((interest) => interest.checked) ? '' : 'choose at least one kind of postcard.'
    );
    interests.forEach((interest) => interest.addEventListener('change', validateInterests));
    validateInterests();
    form.dataset.interestsReady = 'true';
  });
}

enhanceSignupForms();
new MutationObserver(enhanceSignupForms).observe(document.body, { childList: true, subtree: true });
