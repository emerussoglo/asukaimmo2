import React, { useState } from 'react';
import { FAQ_DATA } from '../../data/mockData';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_DATA[0].id);

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="section-padding" style={{ backgroundColor: '#ffffff' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--color-secondary-blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            <i className="fa-solid fa-circle-question" />
            <span>Foire aux questions</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Questions fréquentes
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.88rem' }}>
            Tout ce qu'il faut savoir sur la recherche, la publication et la sécurité des annonces.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQ_DATA.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isOpen ? 'var(--color-primary-subtle)' : '#ffffff',
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-text)',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.question}
                  </span>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isOpen ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: isOpen ? '#ffffff' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.75rem' }} />
                  </div>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 18px 16px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
