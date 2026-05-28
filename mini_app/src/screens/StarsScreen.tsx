import { UserProfile } from "../types";

export function StarsScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="screen">
      <section className="panel subscription-card">
        <h1>Chatty Unlimited</h1>
        <p>✅ Unlimited messages and audio</p>
        <p>✅ You can unsubscribe at any time</p>
        <p>✅ Subscribers are more likely to improve their level</p>
        <div className="plans">
          <button>Monthly subscription · $9.99/month</button>
          <button>Yearly subscription · $49.99/year</button>
        </div>
        <small>Status: {profile.subscription_status}</small>
      </section>
    </div>
  );
}

