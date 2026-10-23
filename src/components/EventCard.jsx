import React from 'react';
import { formatDate, formatDuration, formatFee, formatSeatStatus } from '../utils/formatters';

export function EventCard({ event, remainingSeats }) {
  const seatsToDisplay = remainingSeats !== undefined ? remainingSeats : event.seats;
  const isFull = seatsToDisplay <= 0;

  return (
    <div className={`event-card ${isFull ? 'event-card--full' : ''}`}>
      <div className="event-card__header">
        <span className={`badge badge--${event.category}`}>
          {event.category}
        </span>
        <span className={`seat-badge ${isFull ? 'seat-badge--full' : 'seat-badge--available'}`}>
          {formatSeatStatus(seatsToDisplay)}
        </span>
      </div>

      <h3 className="event-card__title">{event.title}</h3>

      <div className="event-card__details">
        <div className="detail-item">
          <span className="detail-label">Date</span>
          <span className="detail-value">{formatDate(event.date)}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{formatDuration(event.duration)}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Fee</span>
          <span className="detail-value fee-value">{formatFee(event.fee)}</span>
        </div>
      </div>
    </div>
  );
}
