/* ==========================================================================
   Sara Ahmed | portfolio scripts
   Sections: 1. Config  2. Navigation  3. Project filter  4. Copy email
             5. Contact form  6. Footer year
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- 1. Config ---------- */
  const CONFIG = {
    contactEmail: 'sora.ahmed.data@email.com',
    // Optional: paste a form-service endpoint (e.g. Formspree) to send messages
    // straight from the page. When empty, the form opens the visitor's email app.
    formEndpoint: '',
  };

  const TEXT = {
    mailOpened: 'Your email app will open with the message ready to send.',
    sending: 'Sending...',
    send: 'Send Message',
    sent: 'Your message has been sent. Thank you for reaching out.',
    failed: 'Unable to send your message. Please try again or email ',
    copied: 'Email address copied',
    showing: (n) => `Showing ${n} projects`,
    subject: (name) => `Message from ${name} via portfolio`,
  };

  /* ---------- 2. Navigation ---------- */
  const navCollapse = document.getElementById('primaryNav');

  if (navCollapse && window.bootstrap) {
    // Highlight the link of the section currently in view
    new bootstrap.ScrollSpy(document.body, {
      target: '#primaryNav',
      rootMargin: '-25% 0px -60% 0px',
    });

    // Close the mobile menu after choosing a link
    navCollapse.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (navCollapse.classList.contains('show')) {
          bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
        }
      });
    });
  }

  /* ---------- 3. Project filter ---------- */
  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectItems = document.querySelectorAll('[data-category]');
  const projectGrid = document.getElementById('projectGrid');
  const filterStatus = document.getElementById('filterStatus');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visible = 0;

      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

      projectItems.forEach((item) => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.hidden = !show;
        if (show) visible += 1;
      });

      // Hide the grid wrapper when every card inside it is filtered out
      if (projectGrid) {
        projectGrid.hidden = !projectGrid.querySelector('[data-category]:not([hidden])');
      }

      if (filterStatus) filterStatus.textContent = TEXT.showing(visible);
    });
  });

  /* ---------- 4. Copy email ---------- */
  const copyBtn = document.getElementById('copyEmail');
  const copyStatus = document.getElementById('copyStatus');

  if (copyBtn) {
    const iconCopy = copyBtn.querySelector('.icon-copy');
    const iconDone = copyBtn.querySelector('.icon-done');

    const fallbackCopy = (text) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      return ok;
    };

    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(CONFIG.contactEmail);
        ok = true;
      } catch (e) {
        ok = fallbackCopy(CONFIG.contactEmail);
      }
      if (!ok) return;

      iconCopy.classList.add('d-none');
      iconDone.classList.remove('d-none');
      if (copyStatus) copyStatus.textContent = TEXT.copied;
      setTimeout(() => {
        iconDone.classList.add('d-none');
        iconCopy.classList.remove('d-none');
      }, 2000);
    });
  }

  /* ---------- 5. Contact form ---------- */
  const form = document.getElementById('contactForm');

  if (form) {
    const submitBtn = document.getElementById('submitBtn');
    const submitLabel = document.getElementById('submitLabel');
    const statusEl = document.getElementById('formStatus');
    const fields = {
      name: form.elements.name,
      email: form.elements.email,
      message: form.elements.message,
    };

    const rules = {
      name: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: (v) => v.trim().length >= 10,
    };

    const setStatus = (text, type) => {
      statusEl.className = 'form-status' + (type ? ` form-status--${type}` : '');
      statusEl.textContent = text;
    };

    const validateField = (key) => {
      const field = fields[key];
      const valid = rules[key](field.value);
      field.classList.toggle('is-invalid', !valid);
      field.setAttribute('aria-invalid', String(!valid));
      return valid;
    };

    // Re-check a field as the visitor fixes it
    Object.keys(fields).forEach((key) => {
      fields[key].addEventListener('input', () => {
        if (fields[key].classList.contains('is-invalid')) validateField(key);
      });
      fields[key].addEventListener('blur', () => {
        if (fields[key].value !== '') validateField(key);
      });
    });

    const openMailClient = ({ name, email, message }) => {
      const subject = encodeURIComponent(TEXT.subject(name));
      const body = encodeURIComponent(`${message}\n\n${name} (${email})`);
      window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('', '');

      const results = Object.keys(fields).map((key) => [key, validateField(key)]);
      const firstInvalid = results.find(([, ok]) => !ok);
      if (firstInvalid) {
        fields[firstInvalid[0]].focus();
        return;
      }

      const data = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        message: fields.message.value.trim(),
      };

      // No endpoint configured: hand off to the visitor's email app
      if (!CONFIG.formEndpoint) {
        openMailClient(data);
        setStatus(TEXT.mailOpened, 'success');
        return;
      }

      submitBtn.disabled = true;
      submitLabel.textContent = TEXT.sending;

      try {
        const response = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        form.reset();
        Object.values(fields).forEach((f) => f.removeAttribute('aria-invalid'));
        setStatus(TEXT.sent, 'success');
      } catch (error) {
        statusEl.className = 'form-status form-status--error';
        statusEl.textContent = '';
        statusEl.append(
          TEXT.failed,
          Object.assign(document.createElement('a'), {
            href: `mailto:${CONFIG.contactEmail}`,
            textContent: CONFIG.contactEmail,
          }),
          '.'
        );
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = TEXT.send;
      }
    });
  }

  /* ---------- 6. Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
