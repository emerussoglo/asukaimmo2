import React from 'react';

interface Testimonial {
  id: string;
  name: string;
  companyOrCity: string;
  text: string;
  image: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah',
    companyOrCity: 'Cotonou',
    text: "Super rapide et transparent ! J'ai signé le bail de mon appartement à Cotonou en 48 heures. Service irréprochable.",
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=600&h=600&q=85',
  },
  {
    id: '2',
    name: 'Martha',
    companyOrCity: 'Diaspora Paris',
    text: "Impressionné par la vérification des titres fonciers. Recommandé les yeux fermés pour tous les achats de la diaspora !",
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=600&h=600&q=85',
  },
  {
    id: '3',
    name: 'Victor',
    companyOrCity: 'Horizone, Calavi',
    text: "Une expérience fluide du début à la fin. Contact direct avec le propriétaire sur WhatsApp sans aucune commission cachée.",
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=faces&w=600&h=600&q=85',
  },
  {
    id: '4',
    name: 'Patrick',
    companyOrCity: 'Kickflip, Fidjrossè',
    text: "J'ai trouvé nos nouveaux bureaux à Ganhi en moins d'une semaine. Les photos étaient 100% fidèles à la réalité !",
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=600&h=600&q=85',
  },
  {
    id: '5',
    name: 'Clarisse',
    companyOrCity: 'Porto-Novo',
    text: "Villa réservée avec piscine à Calavi sans intermédiaire véreux. Plateforme moderne, rapide et ultra fiable.",
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&crop=faces&w=600&h=600&q=85',
  },
];

export const TestimonialsSection: React.FC = () => {
  // Duplicate array for seamless infinite marquee loop
  const marqueeItems = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section
      style={{
        backgroundColor: '#ffffff',
        paddingTop: 'clamp(48px, 6vw, 72px)',
        paddingBottom: 'clamp(48px, 6vw, 72px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header exactly matching the reference design */}
      <div
        className="container"
        style={{
          textAlign: 'center',
          marginBottom: 'clamp(28px, 4vw, 44px)',
          maxWidth: '780px',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            color: '#09090b',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '10px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          See what all the talk is about!
        </h2>

        <p
          style={{
            fontSize: 'clamp(0.88rem, 1.3vw, 0.98rem)',
            color: '#71717a',
            fontWeight: 400,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Transformative client experience from all around the globe
        </p>
      </div>

      {/* Marquee Track Container with Smooth Right-to-Left Infinite Scroll */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '10px 0 24px',
        }}
      >
        <div className="testimonials-track">
          {marqueeItems.map((item, index) => (
            <article
              key={`${item.id}-${index}`}
              style={{
                width: '320px',
                minWidth: '320px',
                flexShrink: 0,
                backgroundColor: '#ffffff',
                borderRadius: '22px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
              }}
            >
              {/* Photo Area with soft gradient fade into white at the bottom */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '220px',
                  backgroundColor: '#f4f4f5',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 20%',
                    display: 'block',
                  }}
                />

                {/* Soft gradient fade into white card bottom, matching reference image */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to bottom, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.75) 80%, #ffffff 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Bottom White Area with Quote and Signature */}
              <div
                style={{
                  padding: '14px 20px 20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Double Quote Icon */}
                <div
                  style={{
                    fontSize: '1.4rem',
                    lineHeight: 1,
                    fontFamily: 'Georgia, serif',
                    fontWeight: 900,
                    color: '#09090b',
                    marginBottom: '8px',
                  }}
                >
                  “
                </div>

                {/* Short, Punchy Testimonial Text (not too much text as requested) */}
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#18181b',
                    lineHeight: 1.45,
                    fontWeight: 500,
                    margin: '0 0 16px 0',
                    flex: 1,
                  }}
                >
                  {item.text}
                </p>

                {/* Author Signature - Right Aligned like reference */}
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '0.78rem',
                    color: '#71717a',
                    fontWeight: 500,
                  }}
                >
                  — {item.name}, {item.companyOrCity}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes testimonialsMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .testimonials-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: testimonialsMarquee 34s linear infinite;
        }

        .testimonials-track:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonials-track {
            animation: none !important;
            overflow-x: auto !important;
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
};
