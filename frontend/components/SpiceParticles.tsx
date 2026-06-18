'use client';

/**
 * components/SpiceParticles.tsx
 * Floating spice SVG animations for the hero section
 */

const spiceShapes = [
  // Coriander seed (circle + dots)
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" opacity="0.8"/>
    <circle cx="5" cy="7" r="2" opacity="0.5"/>
    <circle cx="19" cy="7" r="2" opacity="0.5"/>
    <circle cx="5" cy="17" r="2" opacity="0.5"/>
    <circle cx="19" cy="17" r="2" opacity="0.5"/>
  </svg>`,
  // Star anise
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 13.5,9 20,9 14.5,13.5 16.5,21 12,17 7.5,21 9.5,13.5 4,9 10.5,9" opacity="0.8"/>
    <circle cx="12" cy="12" r="2" opacity="0.9"/>
  </svg>`,
  // Cardamom pod
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <ellipse cx="12" cy="12" rx="5" ry="9" opacity="0.8"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
  </svg>`,
  // Mustard seed cluster
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="8" cy="8" r="3" opacity="0.9"/>
    <circle cx="16" cy="8" r="2.5" opacity="0.7"/>
    <circle cx="8" cy="16" r="2.5" opacity="0.7"/>
    <circle cx="16" cy="16" r="3" opacity="0.9"/>
    <circle cx="12" cy="12" r="2" opacity="0.6"/>
  </svg>`,
  // Clove
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="4" opacity="0.9"/>
    <rect x="11" y="9" width="2" height="12" rx="1" opacity="0.8"/>
  </svg>`,
  // Chilli
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3 Q18 8 16 18 Q14 22 12 22 Q10 22 8 18 Q6 8 12 3Z" opacity="0.8"/>
    <line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>`,
];

const particles = [
  { size: 16, left: '8%',  color: 'rgba(255,255,255,0.7)',  delay: '0s',   shape: 0 },
  { size: 12, left: '18%', color: 'rgba(249,168,37,0.8)',   delay: '1.5s', shape: 1 },
  { size: 20, left: '30%', color: 'rgba(255,255,255,0.5)',  delay: '3s',   shape: 2 },
  { size: 10, left: '45%', color: 'rgba(249,168,37,0.6)',   delay: '0.8s', shape: 3 },
  { size: 14, left: '62%', color: 'rgba(255,255,255,0.6)',  delay: '2.2s', shape: 4 },
  { size: 18, left: '75%', color: 'rgba(249,168,37,0.7)',   delay: '4s',   shape: 5 },
  { size: 10, left: '85%', color: 'rgba(255,255,255,0.5)',  delay: '1.2s', shape: 0 },
  { size: 16, left: '93%', color: 'rgba(249,168,37,0.5)',   delay: '3.5s', shape: 1 },
];

export default function SpiceParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className="spice-particle"
          style={{
            left: p.left,
            bottom: '-40px',
            width: p.size,
            height: p.size,
            color: p.color,
            animationDelay: p.delay,
          }}
          dangerouslySetInnerHTML={{ __html: spiceShapes[p.shape] }}
        />
      ))}
    </div>
  );
}
