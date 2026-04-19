/**
 * SkeletonLoader — shimmer-animated placeholder cards.
 * Renders skeleton shapes that match the final layout for a polished loading state.
 */
export function SkeletonPulse({ width = '100%', height = '20px', radius = '8px', className = '' }) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card glass-card ${className}`}>
      <SkeletonPulse width="40%" height="14px" />
      <SkeletonPulse width="70%" height="32px" radius="12px" />
      <SkeletonPulse width="55%" height="14px" />
      <SkeletonPulse width="85%" height="14px" />
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="skeleton-hero">
      <div className="skeleton-hero-left glass-card">
        <SkeletonPulse width="30%" height="14px" />
        <SkeletonPulse width="60%" height="42px" radius="14px" />
        <SkeletonPulse width="80%" height="16px" />
        <SkeletonPulse width="100%" height="48px" radius="14px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <SkeletonPulse width="80px" height="32px" radius="99px" />
          <SkeletonPulse width="80px" height="32px" radius="99px" />
          <SkeletonPulse width="80px" height="32px" radius="99px" />
        </div>
      </div>
      <div className="skeleton-hero-right">
        <div className="glass-card skeleton-weather-card">
          <SkeletonPulse width="40%" height="14px" />
          <SkeletonPulse width="50%" height="64px" radius="14px" />
          <SkeletonPulse width="70%" height="18px" />
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <SkeletonPulse width="33%" height="40px" radius="12px" />
            <SkeletonPulse width="33%" height="40px" radius="12px" />
            <SkeletonPulse width="33%" height="40px" radius="12px" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <div className="skeleton-loader">
      <SkeletonHero />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '32px' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
