import React, { useState } from 'react';

export function RegistrationPage({
  events,
  registrations,
  onAddRegistration,
  onCancelRegistration,
  getRemainingSeats
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const seatsLeft = selectedEvent ? getRemainingSeats(selectedEvent.id) : 0;

  // Calculate total payable over all registrations (sum of feePayable)
  const totalPayable = registrations.reduce((sum, reg) => sum + reg.feePayable, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Rule: If name or email is empty, show "Name and email are required"
    if (!trimmedName || !trimmedEmail) {
      setErrorMessage("Name and email are required");
      return;
    }

    if (!selectedEvent) {
      setErrorMessage("Please select a valid event");
      return;
    }

    // Rule: The event has no seats left, message "Event is full"
    const currentSeats = getRemainingSeats(selectedEvent.id);
    if (currentSeats <= 0) {
      setErrorMessage("Event is full");
      return;
    }

    // Rule: The same email already has 3 registrations, message "Limit of 3 registrations reached"
    const existingCountForEmail = registrations.filter(
      (r) => r.studentEmail.toLowerCase() === trimmedEmail.toLowerCase()
    ).length;

    if (existingCountForEmail >= 3) {
      setErrorMessage("Limit of 3 registrations reached");
      return;
    }

    // Rule: An email ending in @charusat.edu.in pays 80% of the fee; every other email pays the full fee.
    const isCharusat = trimmedEmail.toLowerCase().endsWith('@charusat.edu.in');
    const feePayable = isCharusat ? selectedEvent.fee * 0.8 : selectedEvent.fee;

    const newRegistration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentName: trimmedName,
      studentEmail: trimmedEmail,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      feePayable: feePayable
    };

    onAddRegistration(newRegistration);
    setName('');
    setEmail('');
    setSuccessMessage(`Registration successful for ${trimmedName}!`);
  };

  return (
    <div className="registration-container">
      <div className="registration-grid">
        {/* Registration Form Card */}
        <div className="card registration-card">
          <div className="card-header">
            <h2>Event Registration</h2>
            <p className="card-subtitle">Register for campus events with student privileges</p>
          </div>

          {errorMessage && (
            <div className="alert alert--error" role="alert" id="error-message">
              <span className="alert-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert--success" role="status" id="success-message">
              <span className="alert-icon">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="registration-form">
            <div className="form-group">
              <label htmlFor="student-name">Student Name *</label>
              <input
                id="student-name"
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-email">Email Address *</label>
              <input
                id="student-email"
                type="email"
                className="form-input"
                placeholder="e.g. 24dce025@charusat.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="field-hint">
                Emails ending in <strong>@charusat.edu.in</strong> receive an automatic 20% discount (pays 80%).
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="select-event">Choose Event *</label>
              <select
                id="select-event"
                className="form-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} (Fee: ₹{Number(event.fee).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Indicator: "Seats left: <n>" */}
            <div className="chosen-event-info">
              <span className="seats-indicator">
                Seats left: <strong>{seatsLeft}</strong>
              </span>
              <span className="chosen-fee-indicator">
                Standard Fee: <strong>₹{selectedEvent ? Number(selectedEvent.fee).toFixed(2) : "0.00"}</strong>
              </span>
            </div>

            <button type="submit" className="btn btn--primary btn--full" id="submit-registration-btn">
              Register for Event
            </button>
          </form>
        </div>

        {/* Active Registrations Card */}
        <div className="card registrations-list-card">
          <div className="card-header registrations-header">
            <div>
              <h2>Current Registrations</h2>
              <p className="card-subtitle">Manage all active registrations</p>
            </div>
            {/* Live Indicator: "Total payable: ₹<amount>" */}
            <div className="total-payable-badge" id="total-payable">
              Total payable: <strong>₹{totalPayable.toFixed(2)}</strong>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="empty-state">
              <p>No registrations recorded yet.</p>
              <span className="empty-hint">Fill out the form to register for an event.</span>
            </div>
          ) : (
            <div className="registrations-list">
              {registrations.map((reg) => (
                <div key={reg.id} className="registration-item">
                  <div className="reg-info">
                    <h4 className="reg-name">{reg.studentName}</h4>
                    <span className="reg-title">{reg.eventTitle}</span>
                    <span className="reg-email">{reg.studentEmail}</span>
                  </div>
                  <div className="reg-actions">
                    <span className="reg-fee">₹{reg.feePayable.toFixed(2)}</span>
                    <button
                      type="button"
                      className="btn btn--danger-outline btn--sm"
                      onClick={() => onCancelRegistration(reg.id)}
                      title="Cancel this registration"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
