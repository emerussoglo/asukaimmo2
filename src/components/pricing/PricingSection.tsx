import React, { useState } from 'react';
import { PLANS_CONFIG } from '../../data/mockData';
import { PlanType } from '../../types';

interface PricingSectionProps {
  currentPlan?: PlanType;
  onSelectPlan: (plan: PlanType) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  currentPlan = 'FREE',
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  return (
    <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container">
        {/* Header - Compact */}
        <div style={{ textAlign: 'center', maxWidth: '640px', marginInline: 'auto', marginBottom: '28px' }}>
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
            <i className="fa-solid fa-coins" />
            <span>Formules & Tarifs</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.3rem, 2.2vw, 1.65rem)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Tarification simple et transparente
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.4 }}>
            Publiez gratuitement votre premier bien ou optez pour le Plan Pro afin de démultiplier vos contacts.
          </p>

          {/* Billing Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              marginTop: '16px',
            }}
          >
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: billingCycle === 'MONTHLY' ? 'var(--color-primary)' : 'transparent',
                color: billingCycle === 'MONTHLY' ? '#ffffff' : 'var(--color-text-secondary)',
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: billingCycle === 'YEARLY' ? 'var(--color-primary)' : 'transparent',
                color: billingCycle === 'YEARLY' ? '#ffffff' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>Annuel</span>
              <span
                style={{
                  backgroundColor: 'var(--color-secondary-blue-subtle)',
                  color: 'var(--color-secondary-blue)',
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                }}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          {PLANS_CONFIG.map((plan) => {
            const isPro = plan.id === 'PRO';
            const isCurrent = currentPlan === plan.id;
            const displayPrice =
              billingCycle === 'YEARLY' && plan.price > 0
                ? Math.round(plan.price * 10)
                : plan.price;

            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  position: 'relative',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                  border: isPro ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: isPro ? '0 6px 20px rgba(5, 46, 29, 0.08)' : 'var(--shadow-xs)',
                }}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {plan.badge || 'Recommandé'}
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ marginBottom: '14px' }}>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {displayPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {plan.price === 0 ? '' : billingCycle === 'YEARLY' ? '/ an' : '/ mois'}
                    </span>
                  </div>
                </div>

                {/* Limits Tag */}
                <div
                  style={{
                    backgroundColor: isPro ? 'var(--color-primary-subtle)' : 'var(--color-bg)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                  }}
                >
                  <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} />
                  <span>Jusqu’à <strong>{plan.maxListings} annonce{plan.maxListings > 1 ? 's' : ''}</strong></span>
                </div>

                {/* Features List */}
                <div style={{ marginBottom: '20px', flex: 1 }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {plan.features.map((feat, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.82rem' }}>
                        <i
                          className="fa-solid fa-circle-check"
                          style={{
                            color: 'var(--color-accent)',
                            fontSize: '0.8rem',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: 'var(--color-text)', lineHeight: 1.35 }}>{feat}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((lim, i) => (
                      <li key={`lim-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.82rem', opacity: 0.6 }}>
                        <i
                          className="fa-solid fa-circle-xmark"
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.8rem',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: 'var(--color-text-muted)', lineHeight: 1.35 }}>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isCurrent}
                  className={`btn ${isPro ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    opacity: isCurrent ? 0.7 : 1,
                  }}
                >
                  {isCurrent ? 'Votre formule active' : plan.ctaText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
