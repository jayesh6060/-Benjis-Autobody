// Benji's Autobody - Interactive App Logic & Persistent Booking Storage

// Disable automatic browser scroll restoration & clear URL hash on refresh so page always starts at top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

if (window.location.hash) {
  history.replaceState(null, null, window.location.pathname + window.location.search);
}

window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('pageshow', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
  }
  // Key for local persistent storage
  const STORAGE_KEY = 'benjis_autobody_estimate_bookings';

  // Helper functions for persistent storage
  const getStoredBookings = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error loading stored bookings:', err);
      return [];
    }
  };

  const saveBookingToStorage = (booking) => {
    const current = getStoredBookings();
    current.unshift(booking); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    updateAdminBadgeCount();
  };

  const deleteBookingFromStorage = (id) => {
    const current = getStoredBookings().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    updateAdminBadgeCount();
    renderAdminTable();
  };

  const clearAllBookingsFromStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    updateAdminBadgeCount();
    renderAdminTable();
  };

  const updateAdminBadgeCount = () => {
    const countEl = document.getElementById('adminBookingCount');
    if (countEl) {
      countEl.textContent = getStoredBookings().length;
    }
  };

  // Elements
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  
  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtn = document.getElementById('openBookingBtn');
  const heroScheduleBtn = document.getElementById('heroScheduleBtn');
  const aboutBookBtn = document.getElementById('aboutBookBtn');
  const exploreServicesBtn = document.getElementById('exploreServicesBtn');
  const whoWeAreBtn = document.getElementById('whoWeAreBtn');
  const contactScheduleBtn = document.getElementById('contactScheduleBtn');
  const closeBookingModal = document.getElementById('closeBookingModal');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  const bookingForm = document.getElementById('bookingForm');
  const bookingFormStep = document.getElementById('bookingFormStep');
  const bookingSuccessStep = document.getElementById('bookingSuccessStep');
  const serviceSelect = document.getElementById('serviceSelect');
  const preferredDate = document.getElementById('preferredDate');

  // Admin Modal Elements
  const adminModal = document.getElementById('adminModal');
  const openAdminModalBtn = document.getElementById('openAdminModalBtn');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const adminBookingsTbody = document.getElementById('adminBookingsTbody');
  const noBookingsMsg = document.getElementById('noBookingsMsg');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearAllBookingsBtn = document.getElementById('clearAllBookingsBtn');

  // Set minimum date to today
  if (preferredDate) {
    const today = new Date().toISOString().split('T')[0];
    preferredDate.min = today;
    preferredDate.value = today;
  }

  // Initial Admin Badge Count
  updateAdminBadgeCount();

  // 1. Top Announcement Bar Scroll Hide/Show Logic
  const topAnnouncement = document.getElementById('topAnnouncement');
  const SCROLL_HIDE_THRESHOLD = 250; // ~2 to 3 scroll flicks down

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    // After scrolling down 2 to 3 times (past 250px), hide top announcement bar
    if (currentScrollY > SCROLL_HIDE_THRESHOLD) {
      topAnnouncement?.classList.add('hide-top-bar');
    } else {
      // Reappear when back near top of page
      topAnnouncement?.classList.remove('hide-top-bar');
    }
  });

  // 2. Smooth Scroll Anchor Handler (prevents setting URL hash that causes browser auto-scroll on refresh)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 3. Mobile Menu Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // 3. Customer Booking Modal Functions
  const openModal = (serviceName = '') => {
    if (serviceName && serviceSelect) {
      serviceSelect.value = serviceName;
    }
    bookingFormStep.classList.remove('hidden');
    bookingSuccessStep.classList.add('hidden');
    bookingModal.classList.add('active');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    bookingModal.classList.remove('active');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  [openBookingBtn, heroScheduleBtn, aboutBookBtn, exploreServicesBtn, contactScheduleBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => openModal());
    }
  });

  if (whoWeAreBtn) {
    whoWeAreBtn.addEventListener('click', () => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const serviceName = card.getAttribute('data-service');
      openModal(serviceName);
    });
  });

  if (closeBookingModal) closeBookingModal.addEventListener('click', closeModal);
  if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal();
  });

  // 4. Booking Form Submission & Storage
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const service = serviceSelect.value;
      const date = preferredDate.value;
      const time = document.getElementById('preferredTime').value;
      const vehicleMake = document.getElementById('vehicleMake').value;
      const phone = document.getElementById('customerPhone').value;
      const name = document.getElementById('customerName').value;
      const notes = document.getElementById('additionalNotes').value || 'N/A';

      // Generate unique Reference ID
      const refId = 'EST-' + Math.floor(10000 + Math.random() * 90000);
      const timestamp = new Date().toLocaleString();

      // Construct booking record
      const bookingRecord = {
        id: refId,
        timestamp: timestamp,
        name: name,
        phone: phone,
        service: service,
        vehicleMake: vehicleMake,
        date: date,
        time: time,
        notes: notes
      };

      // Store in localStorage persistently
      saveBookingToStorage(bookingRecord);

      // Update success confirmation details
      document.getElementById('confRefId').textContent = refId;
      document.getElementById('confName').textContent = name;
      document.getElementById('confService').textContent = service;
      document.getElementById('confDate').textContent = date;
      document.getElementById('confTime').textContent = time;

      // Construct formatted WhatsApp text for Benji (+1 929 569-9042)
      const BENJIS_WHATSAPP_NUM = '19295699042';
      const waText = `🚗 *NEW ESTIMATE REQUEST - BENJIS AUTOBODY*\n` +
        `----------------------------------------\n` +
        `📋 *Ref ID:* ${refId}\n` +
        `👤 *Name:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `🛠️ *Service Required:* ${service}\n` +
        `🏎️ *Vehicle:* ${vehicleMake}\n` +
        `📅 *Appt Date:* ${date}\n` +
        `🕒 *Preferred Time:* ${time}\n` +
        `📝 *Damage Notes:* ${notes}\n` +
        `----------------------------------------\n` +
        `Sent via Benji's Autobody Website`;

      const waUrl = `https://wa.me/${BENJIS_WHATSAPP_NUM}?text=${encodeURIComponent(waText)}`;

      const whatsappSendLink = document.getElementById('whatsappSendLink');
      if (whatsappSendLink) {
        whatsappSendLink.href = waUrl;
      }

      // Automatically trigger WhatsApp opening
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 500);

      // Transition modal to success step
      bookingFormStep.classList.add('hidden');
      bookingSuccessStep.classList.remove('hidden');
      bookingForm.reset();
    });
  }

  // 5. Admin Portal Modal Functions
  const renderAdminTable = () => {
    const bookings = getStoredBookings();
    if (!adminBookingsTbody) return;

    adminBookingsTbody.innerHTML = '';

    if (bookings.length === 0) {
      document.getElementById('adminBookingsTable')?.classList.add('hidden');
      noBookingsMsg?.classList.remove('hidden');
      return;
    }

    document.getElementById('adminBookingsTable')?.classList.remove('hidden');
    noBookingsMsg?.classList.add('hidden');

    bookings.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="font-family: monospace; color: #09090b;">${b.id}</strong></td>
        <td><span style="font-size: 0.8rem; color: #71717a;">${b.timestamp}</span></td>
        <td><strong>${escapeHtml(b.name)}</strong></td>
        <td><a href="tel:${escapeHtml(b.phone)}" style="color: #09090b; font-weight: 700; text-decoration: none;">${escapeHtml(b.phone)}</a></td>
        <td><span class="badge-tag">${escapeHtml(b.service)}</span></td>
        <td>${escapeHtml(b.vehicleMake)}</td>
        <td><strong>${escapeHtml(b.date)}</strong> @ ${escapeHtml(b.time)}</td>
        <td><span style="font-size: 0.82rem; color: #71717a;" title="${escapeHtml(b.notes)}">${truncateText(escapeHtml(b.notes), 30)}</span></td>
        <td>
          <button class="btn-delete-item" data-id="${b.id}" aria-label="Delete Booking">
            🗑️ Delete
          </button>
        </td>
      `;
      adminBookingsTbody.appendChild(tr);
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete stored estimate ${id}?`)) {
          deleteBookingFromStorage(id);
        }
      });
    });
  };

  const openAdminModal = () => {
    renderAdminTable();
    adminModal.classList.add('active');
    adminModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeAdminModalFn = () => {
    adminModal.classList.remove('active');
    adminModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (openAdminModalBtn) {
    openAdminModalBtn.addEventListener('click', openAdminModal);
  }

  if (closeAdminModal) {
    closeAdminModal.addEventListener('click', closeAdminModalFn);
  }

  adminModal?.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModalFn();
  });

  // Export Bookings to CSV / Excel File
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const bookings = getStoredBookings();
      if (bookings.length === 0) {
        alert('No bookings available to export.');
        return;
      }

      const headers = ['Ref ID', 'Timestamp', 'Customer Name', 'Phone', 'Service', 'Vehicle', 'Appointment Date', 'Time', 'Notes'];
      const rows = bookings.map(b => [
        `"${b.id}"`,
        `"${b.timestamp}"`,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${b.phone.replace(/"/g, '""')}"`,
        `"${b.service.replace(/"/g, '""')}"`,
        `"${b.vehicleMake.replace(/"/g, '""')}"`,
        `"${b.date}"`,
        `"${b.time}"`,
        `"${b.notes.replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `benjis_estimates_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Clear All Bookings
  if (clearAllBookingsBtn) {
    clearAllBookingsBtn.addEventListener('click', () => {
      if (getStoredBookings().length === 0) {
        alert('No stored bookings to clear.');
        return;
      }
      if (confirm('Are you sure you want to PERMANENTLY CLEAR ALL stored estimate bookings?')) {
        clearAllBookingsFromStorage();
      }
    });
  }

  // -------------------------------------------------------------
  // Customer Reviews Persistent Storage & Modal Logic
  // -------------------------------------------------------------
  const REVIEWS_STORAGE_KEY = 'benjis_autobody_customer_reviews';

  const getStoredReviews = () => {
    try {
      const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error loading stored reviews:', err);
      return [];
    }
  };

  const saveReviewToStorage = (review) => {
    const current = getStoredReviews();
    current.unshift(review);
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(current));
  };

  const renderStoredReviews = () => {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid) return;

    const storedReviews = getStoredReviews();
    storedReviews.forEach(rev => {
      const card = document.createElement('div');
      card.className = 'testimonial-card featured';
      
      const initials = rev.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

      card.innerHTML = `
        <div class="review-card-header">
          <div class="review-stars">
            ★★★★★
            <span class="rating-num">${escapeHtml(rev.rating)}</span>
          </div>
          <span class="verified-badge">${escapeHtml(rev.tag)}</span>
        </div>
        <blockquote class="review-quote">
          "${escapeHtml(rev.quote)}"
        </blockquote>
        <div class="review-author">
          <div class="author-avatar">${escapeHtml(initials)}</div>
          <div class="author-info">
            <strong>${escapeHtml(rev.name)}</strong>
            <span>${escapeHtml(rev.location)}</span>
          </div>
        </div>
      `;
      // Prepend so user's new review appears at top of grid
      testimonialsGrid.prepend(card);
    });
  };

  // Render stored reviews on page load
  renderStoredReviews();

  // Review Modal Elements
  const reviewModal = document.getElementById('reviewModal');
  const openReviewModalBtn = document.getElementById('openReviewModalBtn');
  const closeReviewModal = document.getElementById('closeReviewModal');
  const reviewForm = document.getElementById('reviewForm');
  const reviewFormStep = document.getElementById('reviewFormStep');
  const reviewSuccessStep = document.getElementById('reviewSuccessStep');
  const closeReviewSuccessBtn = document.getElementById('closeReviewSuccessBtn');

  const openReviewModalFn = () => {
    if (reviewFormStep) reviewFormStep.classList.remove('hidden');
    if (reviewSuccessStep) reviewSuccessStep.classList.add('hidden');
    reviewModal?.classList.add('active');
    reviewModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeReviewModalFn = () => {
    reviewModal?.classList.remove('active');
    reviewModal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    reviewForm?.reset();
  };

  if (openReviewModalBtn) {
    openReviewModalBtn.addEventListener('click', openReviewModalFn);
  }

  if (closeReviewModal) {
    closeReviewModal.addEventListener('click', closeReviewModalFn);
  }

  if (closeReviewSuccessBtn) {
    closeReviewSuccessBtn.addEventListener('click', closeReviewModalFn);
  }

  reviewModal?.addEventListener('click', (e) => {
    if (e.target === reviewModal) closeReviewModalFn();
  });

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const reviewerName = document.getElementById('reviewerName')?.value.trim();
      const reviewerLocation = document.getElementById('reviewerLocation')?.value.trim();
      const reviewRating = document.getElementById('reviewRating')?.value;
      const reviewTag = document.getElementById('reviewTag')?.value;
      const reviewText = document.getElementById('reviewText')?.value.trim();

      if (!reviewerName || !reviewerLocation || !reviewText) return;

      const newReview = {
        id: 'REV-' + Date.now(),
        name: reviewerName,
        location: reviewerLocation,
        rating: reviewRating,
        tag: reviewTag,
        quote: reviewText,
        timestamp: new Date().toLocaleDateString()
      };

      // Save to localStorage
      saveReviewToStorage(newReview);

      // Render new review dynamically into page grid
      const testimonialsGrid = document.getElementById('testimonialsGrid');
      if (testimonialsGrid) {
        const card = document.createElement('div');
        card.className = 'testimonial-card featured';
        const initials = newReview.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

        card.innerHTML = `
          <div class="review-card-header">
            <div class="review-stars">
              ★★★★★
              <span class="rating-num">${escapeHtml(newReview.rating)}</span>
            </div>
            <span class="verified-badge">${escapeHtml(newReview.tag)}</span>
          </div>
          <blockquote class="review-quote">
            "${escapeHtml(newReview.quote)}"
          </blockquote>
          <div class="review-author">
            <div class="author-avatar">${escapeHtml(initials)}</div>
            <div class="author-info">
              <strong>${escapeHtml(newReview.name)}</strong>
              <span>${escapeHtml(newReview.location)}</span>
            </div>
          </div>
        `;
        testimonialsGrid.prepend(card);
      }

      // Toggle modal steps
      if (reviewFormStep) reviewFormStep.classList.add('hidden');
      if (reviewSuccessStep) reviewSuccessStep.classList.remove('hidden');
    });
  }

  // Utility Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncateText(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }

  // Toast alerts for Legal Links
  ['legalAccess', 'legalPrivacy', 'legalTerms'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`${el.textContent} - Benji's Autobody.\nFor inquiries, call +1 (929) 569-9042.`);
      });
    }
  });
});
