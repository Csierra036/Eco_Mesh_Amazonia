export default function StatCard({ title, value, icon, color, trend }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        <div className="stat-card__icon">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        {trend && <span className={`stat-card__trend stat-card__trend--${trend.type}`}>{trend.value}</span>}
      </div>
    </div>
  );
}
