import React from 'react';
import { EventCard } from './EventCard';

export function EventList({ events, getRemainingSeats }) {
  if (!events || events.length === 0) {
    return <div className="empty-state">No events available at this time.</div>;
  }

  return (
    <section className="events-section">
      <div className="section-header">
        <div>
          <h2>Campus Events</h2>
          <p className="section-subtitle">Discover tech workshops, cultural nights, and sports competitions</p>
        </div>
        <span className="count-pill">{events.length} events listed</span>
      </div>

      <div className="events-grid">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            remainingSeats={getRemainingSeats ? getRemainingSeats(event.id) : event.seats}
          />
        ))}
      </div>
    </section>
  );
}
