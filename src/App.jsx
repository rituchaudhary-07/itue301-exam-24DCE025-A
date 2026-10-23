import React, { useState } from 'react';
import { initialEvents } from './data/initialEvents';
import { EventList } from './components/EventList';
import { RegistrationPage } from './components/RegistrationPage';
import { OrganisersDirectory } from './components/OrganisersDirectory';
import './index.css';

export function App() {
  const [currentTab, setCurrentTab] = useState('events');
  const [events, setEvents] = useState(initialEvents);
  const [registrations, setRegistrations] = useState([]);

  // Calculate dynamic seats remaining for any event
  // Rule: seats on the event minus this page's registrations for it
  const getRemainingSeats = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return 0;
    const booked = registrations.filter((r) => r.eventId === eventId).length;
    return Math.max(0, event.seats - booked);
  };

  const handleAddRegistration = (newReg) => {
    setRegistrations((prev) => [...prev, newReg]);
  };

  const handleCancelRegistration = (regId) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== regId));
  };

  return (
    <div className="app-container">
      {/* Top Header & Navigation */}
      <header className="navbar">
        <div className="navbar__brand">
          <div className="navbar__logo">🎓</div>
          <div>
            <h1 className="navbar__title">Campus Event Hub</h1>
            <span className="navbar__tagline">CHARUSAT University Activities & Registration</span>
          </div>
        </div>

        {/* Navigation opens without full-page reload */}
        <nav className="navbar__nav" aria-label="Main Navigation">
          <button
            type="button"
            id="nav-events"
            className={`nav-link ${currentTab === 'events' ? 'nav-link--active' : ''}`}
            onClick={() => setCurrentTab('events')}
          >
            Events
          </button>
          <button
            type="button"
            id="nav-register"
            className={`nav-link ${currentTab === 'register' ? 'nav-link--active' : ''}`}
            onClick={() => setCurrentTab('register')}
          >
            Register
          </button>
          <button
            type="button"
            id="nav-organisers"
            className={`nav-link ${currentTab === 'organisers' ? 'nav-link--active' : ''}`}
            onClick={() => setCurrentTab('organisers')}
          >
            Organisers
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'events' && (
          <EventList
            events={events}
            getRemainingSeats={getRemainingSeats}
          />
        )}

        {currentTab === 'register' && (
          <RegistrationPage
            events={events}
            registrations={registrations}
            onAddRegistration={handleAddRegistration}
            onCancelRegistration={handleCancelRegistration}
            getRemainingSeats={getRemainingSeats}
          />
        )}

        {currentTab === 'organisers' && (
          <OrganisersDirectory />
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Campus Event Hub • AWDF CIE-2 Project</p>
      </footer>
    </div>
  );
}

export default App;
