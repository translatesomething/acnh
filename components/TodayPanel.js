'use client';

import { useEffect, useMemo, useState } from 'react';
import { getEvents } from '../lib/api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MAX_NAMES = 6;

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isNewHorizons = (v) => Array.isArray(v.appearances) && (v.appearances.includes('NH') || v.appearances.includes('ACNH'));

function formatDay(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(`${isoOrDate}T00:00:00`) : isoOrDate;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Villagers whose birthday is on `date` (month and day), from the New Horizons roster. */
function birthdaysOn(villagers, date) {
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return villagers.filter((v) => isNewHorizons(v) && v.birthday_month === month && Number(v.birthday_day) === day);
}

/** The next day after `today` that has a birthday, and who has it. */
function nextBirthdays(villagers, today) {
  for (let ahead = 1; ahead <= 366; ahead++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ahead);
    const list = birthdaysOn(villagers, date);
    if (list.length) return { date, list };
  }
  return null;
}

/**
 * What is happening on the island today: the date, birthdays and events.
 * Birthdays come from the villager list that is already loaded. Events are read from
 * the local data and the panel simply shows no events if they cannot be loaded.
 */
export default function TodayPanel({ villagers, onSelectVillager }) {
  const [today, setToday] = useState(null);
  const [events, setEvents] = useState(null);

  // The date is read after mount so the static page never disagrees with the visitor's clock.
  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => { if (!cancelled) setEvents(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, []);

  const birthdays = useMemo(() => (today ? birthdaysOn(villagers, today) : []), [villagers, today]);
  const upcomingBirthday = useMemo(
    () => (today && villagers.length && birthdays.length === 0 ? nextBirthdays(villagers, today) : null),
    [villagers, today, birthdays.length]
  );

  const todayIso = today ? isoDate(today) : null;
  // Birthdays are already shown from the villager list, so skip them here.
  const eventsToday = useMemo(
    () => (events && todayIso ? events.filter((e) => e.date === todayIso && e.type !== 'Birthday') : []),
    [events, todayIso]
  );
  const nextEvent = useMemo(
    () => (events && todayIso ? events.find((e) => e.date > todayIso && e.type === 'Event') : null),
    [events, todayIso]
  );

  if (!today) return <div className="today today--pending" aria-hidden="true" />;

  const shown = birthdays.slice(0, MAX_NAMES);

  return (
    <section className="today" aria-label="Today on the island">
      <div className="today-date">
        <span className="today-weekday">{today.toLocaleDateString('en-US', { weekday: 'long' })}</span>
        <span className="today-daynum">{today.getDate()}</span>
        <span className="today-month">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="today-card">
        <h2 className="today-title">
          <span className="material-icons" aria-hidden="true">cake</span>
          Birthdays today
        </h2>
        {villagers.length === 0 ? (
          <p className="today-empty">Checking the roster.</p>
        ) : shown.length > 0 ? (
          <ul className="today-people">
            {shown.map((v) => (
              <li key={v.name}>
                <button type="button" className="today-person" onClick={() => onSelectVillager(v)}>
                  {v.nh_details?.icon_url
                    ? <img src={v.nh_details.icon_url} alt="" className="today-avatar" />
                    : <span className="today-avatar today-avatar--blank" aria-hidden="true" />}
                  <span>{v.name}</span>
                </button>
              </li>
            ))}
            {birthdays.length > MAX_NAMES && <li className="today-more">and {birthdays.length - MAX_NAMES} more</li>}
          </ul>
        ) : (
          <p className="today-empty">
            No birthdays today.
            {upcomingBirthday && (
              <>
                {' '}Next is {upcomingBirthday.list.map((v) => v.name).join(', ')} on {formatDay(upcomingBirthday.date)}.
              </>
            )}
          </p>
        )}
      </div>

      <div className="today-card">
        <h2 className="today-title">
          <span className="material-icons" aria-hidden="true">event</span>
          Events today
        </h2>
        {eventsToday.length > 0 ? (
          <ul className="today-events">
            {eventsToday.map((e) => (
              <li key={`${e.date}-${e.event}`}>
                <span className="today-event-name">{e.event}</span>
                <span className="today-event-type">{e.type}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="today-empty">
            Nothing special today.
            {nextEvent && <> Next is {nextEvent.event} on {formatDay(nextEvent.date)}.</>}
          </p>
        )}
      </div>
    </section>
  );
}
