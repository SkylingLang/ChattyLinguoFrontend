import { Flame } from "lucide-react";
import { UserProfile } from "../types";

const days = [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

export function ProfileScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="screen">
      <div className="avatar-wrap">
        <div className="avatar">👩🏻</div>
        <h1>{profile.name || "Learner"}</h1>
        <div className="stars">⭐ 0</div>
      </div>

      <button className="primary-button">Invite Friends</button>
      <button className="secondary-button">Share Profile</button>

      <section className="panel streak-panel">
        <div className="streak-count">
          <Flame fill="#ff8317" color="#ff8317" size={52} />
          <strong>{profile.current_streak || 1}</strong>
        </div>
        <p>days streak</p>
        <div className="calendar-head">
          <span>‹</span>
          <span>May 2026</span>
          <span>›</span>
        </div>
        <div className="calendar-grid">
          {days.map((day, index) => (
            <span
              key={`${day}-${index}`}
              className={day === 28 ? "today" : day === 27 ? "outlined" : index % 7 === 5 || index % 7 === 6 ? "weekend" : ""}
            >
              {day}
            </span>
          ))}
        </div>
      </section>

      <section className="panel stat-grid">
        <div>
          <strong>{profile.word_count}</strong>
          <span>Words Said</span>
        </div>
        <div>
          <strong>{profile.maximum_streak}</strong>
          <span>Max streak</span>
        </div>
        <div>
          <strong>0%</strong>
          <span>Correct</span>
        </div>
        <div>
          <strong>{profile.messages_count}</strong>
          <span>Messages Sent</span>
        </div>
      </section>
    </div>
  );
}

