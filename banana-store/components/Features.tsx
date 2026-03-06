import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, ChevronDown, MessageCircle, ShieldCheck } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';
import { ShopApiService } from '../services/shopApiService';

const TYPEWRITER_WORDS = ['Community', 'Discord', 'Support Server'];

const FAQ_ITEMS = [
  {
    question: 'How long do the accounts last?',
    answer:
      'Most products include long-term access, and many tiers are lifetime. The exact duration is always shown on the product page before checkout.',
  },
  {
    question: 'How can I get support?',
    answer:
      'Use our Discord support server for order help, delivery checks, and quick fixes. Staff and community helpers are active throughout the day.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We support major card payments, PayPal, and crypto checkout where available. You can see enabled methods live at checkout.',
  },
];

const PREMIUM_ADVANTAGES = [
  '24/7 customer support',
  'Instant delivery on purchase',
  'Verified and premium products',
  'Free updates and fixes',
  'Secure payment gateway',
  'Discord + ticket support',
  'Lifetime access options',
];

const BASIC_RISKS = [
  'Limited support hours',
  'Delivery is sometimes delayed',
  'Unverified or mixed products',
  'Few updates after purchase',
  'Weak refund and replacement policy',
  'Slow issue resolution',
  'Basic security coverage',
];

const parseDiscordInviteCode = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.toLowerCase();
    if (host === 'discord.gg') {
      return parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
    }
    if (host === 'discord.com' || host === 'www.discord.com' || host === 'discordapp.com' || host === 'www.discordapp.com') {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const inviteIndex = segments.findIndex((segment) => segment.toLowerCase() === 'invite');
      if (inviteIndex >= 0 && segments[inviteIndex + 1]) {
        return segments[inviteIndex + 1];
      }
      return segments[0] || '';
    }
  } catch {
    return '';
  }
  return '';
};

const fetchInviteStats = async (inviteCode: string): Promise<{ memberCount: number; onlineCount: number } | null> => {
  const normalizedCode = String(inviteCode || '').trim();
  if (!normalizedCode) return null;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(normalizedCode)}?with_counts=true&with_expiration=true`,
      { method: 'GET', signal: controller.signal }
    );
    if (!response.ok) return null;
    const payload = await response.json() as {
      approximate_member_count?: number;
      approximate_presence_count?: number;
      guild?: {
        approximate_member_count?: number;
        approximate_presence_count?: number;
      };
    };
    const memberCount = Math.max(
      0,
      Math.round(
        Number(payload.approximate_member_count ?? payload.guild?.approximate_member_count ?? 0) || 0
      )
    );
    const onlineCount = Math.max(
      0,
      Math.round(
        Number(payload.approximate_presence_count ?? payload.guild?.approximate_presence_count ?? 0) || 0
      )
    );
    if (memberCount <= 0 && onlineCount <= 0) return null;
    return { memberCount, onlineCount };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const useScrollReveal = <T extends HTMLElement>(threshold: number = 0.14) => {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
};

export const Features: React.FC = () => {
  const supportHref = String(BRAND_CONFIG.links.support || '#').trim() || '#';
  const discordHref = String(BRAND_CONFIG.links.discord || '').trim();
  const communityHref = discordHref && discordHref !== '#' ? discordHref : supportHref;
  const externalCommunity = /^https?:\/\//i.test(communityHref);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [typedWord, setTypedWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [communityStats, setCommunityStats] = useState<{ memberCount: number; onlineCount: number }>({
    memberCount: 0,
    onlineCount: 0,
  });
  const comparisonReveal = useScrollReveal<HTMLDivElement>(0.1);
  const faqReveal = useScrollReveal<HTMLDivElement>(0.12);
  const communityReveal = useScrollReveal<HTMLDivElement>(0.12);

  const revealClass = (isVisible: boolean): string =>
    `transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
    }`;

  useEffect(() => {
    let disposed = false;
    const inviteCode = parseDiscordInviteCode(communityHref);

    const refreshCommunityStats = async () => {
      let memberCount = 0;
      let onlineCount = 0;
      try {
        const stats = await ShopApiService.getCommunityStats();
        if (disposed) return;
        memberCount = Math.max(0, Math.round(Number(stats.memberCount || 0)));
        onlineCount = Math.max(0, Math.round(Number(stats.onlineCount || 0)));
      } catch {
        // Continue with invite fallback below.
      }

      if (memberCount <= 0 && onlineCount <= 0 && inviteCode) {
        const inviteStats = await fetchInviteStats(inviteCode);
        if (disposed || !inviteStats) return;
        memberCount = inviteStats.memberCount;
        onlineCount = inviteStats.onlineCount;
      }

      if (memberCount > 0 || onlineCount > 0) {
        setCommunityStats({ memberCount, onlineCount });
      }
    };

    void refreshCommunityStats();
    const intervalId = window.setInterval(() => {
      void refreshCommunityStats();
    }, 20000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [communityHref]);

  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[wordIndex] || TYPEWRITER_WORDS[0];
    const reachedFullWord = typedWord === currentWord;
    const reachedEmptyWord = typedWord.length === 0;

    let delay = isDeleting ? 52 : 94;
    if (!isDeleting && reachedFullWord) delay = 1100;
    if (isDeleting && reachedEmptyWord) delay = 300;

    const timer = window.setTimeout(() => {
      if (!isDeleting && !reachedFullWord) {
        setTypedWord(currentWord.slice(0, typedWord.length + 1));
        return;
      }
      if (!isDeleting && reachedFullWord) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && !reachedEmptyWord) {
        setTypedWord(currentWord.slice(0, typedWord.length - 1));
        return;
      }
      setIsDeleting(false);
      setWordIndex((previousIndex) => (previousIndex + 1) % TYPEWRITER_WORDS.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isDeleting, typedWord, wordIndex]);

  const formattedMemberCount = communityStats.memberCount > 0 ? communityStats.memberCount.toLocaleString() : '--';
  const displayedOnlineCount = Math.max(0, communityStats.onlineCount);
  const onlineStatusText = displayedOnlineCount > 0 ? `${displayedOnlineCount.toLocaleString()} members online` : 'Syncing member stats';
  const overflowOnlineMembers = Math.max(0, displayedOnlineCount - 3);
  const overflowOnlineLabel = overflowOnlineMembers > 99 ? '+99+' : `+${overflowOnlineMembers}`;
  const fakeTicketsSolved = (18420 + Math.round(Math.max(0, communityStats.memberCount) * 1.35)).toLocaleString();
  const fakeAvgResponseMinutes = Math.max(0.8, 1.4 - Math.min(0.4, Math.max(0, communityStats.onlineCount) / 3000)).toFixed(1);

  return (
    <section id="features" className="template-features relative overflow-hidden px-4 pb-24 pt-8 sm:px-6 sm:pb-32 sm:pt-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-9rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />
        <div className="absolute -left-24 bottom-16 h-64 w-64 rounded-full bg-yellow-300/10 blur-[95px]" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-[95px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-12">
        <section ref={comparisonReveal.ref} className={revealClass(comparisonReveal.visible)}>
          <div className="template-section-title mx-auto max-w-4xl text-center">
            <h3 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Tired of Compromising on <span className="text-[#facc15]">Quality?</span>
            </h3>
          </div>
          <div className="template-section-subtitle">
            <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-white/60 sm:text-lg">
              Smart buyers choose stable products, instant access, and faster real support.
            </p>
          </div>

          <div className="comparison-block mt-8">
            <div className="comp-wrapper">
              <div className="comp-cards">
                <div className="comp-card comp-your-store">
                  <div className="comp-card-header">
                    <div>
                      <h3 className="comp-store-name">{BRAND_CONFIG.identity.storeName}</h3>
                      <p className="comp-store-subtitle">Premium choice / trusted</p>
                    </div>
                  </div>

                  <div className="comp-power-bar-wrapper">
                    <p className="comp-power-label">
                      Store score
                      <span className="comp-score-chip">10/10</span>
                    </p>
                    <div className="comp-power-track">
                      <div className="comp-power-fill" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="comp-features-grid">
                    {PREMIUM_ADVANTAGES.map((advantage) => (
                      <div key={advantage} className="comp-feature-item">
                        <span className="comp-feature-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m5 12 4.5 4.5L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="comp-feature-text">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="comp-card comp-competitor">
                  <div className="comp-card-header">
                    <div>
                      <h3 className="comp-store-name">Other stores</h3>
                      <p className="comp-store-subtitle">Basic / slow / risky</p>
                    </div>
                  </div>

                  <div className="comp-power-bar-wrapper">
                    <p className="comp-power-label">
                      Store score
                      <span className="comp-score-chip comp-score-chip--dim">6/10</span>
                    </p>
                    <div className="comp-power-track">
                      <div className="comp-power-fill comp-power-fill--competitor" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div className="comp-features-grid">
                    {BASIC_RISKS.map((risk, index) => (
                      <div key={risk} className="comp-feature-item">
                        <span className={`comp-feature-icon ${index % 2 === 0 ? 'comp-feature-icon--bad' : 'comp-feature-icon--warn'}`}>
                          {index % 2 === 0 ? 'x' : '!'}
                        </span>
                        <span className="comp-feature-text">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="comp-vs-divider">VS</div>
            </div>
          </div>
        </section>

        <section ref={faqReveal.ref} className={revealClass(faqReveal.visible)}>
          <div className="template-section-title mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Quick <span className="text-[#facc15]">Answers</span>
            </h2>
          </div>
          <div className="template-section-subtitle">
            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-white/60 sm:text-lg">
              Everything you need to know, right at your fingertips.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-5xl space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <article
                  key={item.question}
                  className={`template-faq-item overflow-hidden rounded-2xl border border-yellow-400/20 bg-[linear-gradient(90deg,rgba(33,23,4,0.86),rgba(12,10,4,0.92))] shadow-[0_8px_30px_rgba(250,204,21,0.08)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    faqReveal.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                  style={{ transitionDelay: `${90 + index * 80}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((currentIndex) => (currentIndex === index ? -1 : index))}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left sm:gap-6 sm:px-6 sm:py-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-300/50 bg-yellow-300/15 text-sm font-black text-yellow-200">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-white sm:text-xl">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-yellow-200 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-4 pb-5 text-xs font-medium leading-relaxed text-white/70 sm:px-6 sm:text-sm">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          ref={communityReveal.ref}
          className={`${revealClass(communityReveal.visible)} template-panel template-panel--community relative overflow-hidden rounded-[32px] border border-yellow-400/20 bg-[linear-gradient(140deg,rgba(27,19,5,0.95),rgba(10,8,4,0.95))] p-6 shadow-[0_16px_60px_rgba(250,204,21,0.12)] sm:p-8 lg:p-10`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 py-1.5 text-xs font-black text-yellow-100">
                <span className="h-2 w-2 rounded-full bg-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.9)]" />
                Live, friendly and fast
              </div>

              <h3 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Join our{' '}
                <span className="text-yellow-300">
                  {typedWord}
                  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-1 bg-yellow-200 align-bottom animate-pulse" />
                </span>
              </h3>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/70 sm:text-lg">
                Support, order updates, product ideas, and sneak peeks. Everything happens in our Discord support server.
                Staff is online almost all day, and responses are fast.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                  <Check className="h-3.5 w-3.5" />
                  24/7 staff
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified products
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Private channels
                </span>
              </div>

              <a
                href={communityHref}
                target={externalCommunity ? '_blank' : undefined}
                rel={externalCommunity ? 'noreferrer noopener' : undefined}
                className="mt-7 inline-flex min-w-[230px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#eab308,#facc15,#fde047)] px-6 py-3 text-sm font-black text-[#1b1402] shadow-[0_0_36px_rgba(250,204,21,0.35)] transition-all hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                Join Discord
              </a>
              <p className="mt-3 text-xs font-semibold text-yellow-100/60">No spam. Instant access.</p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,11,5,0.94),rgba(8,7,5,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
              <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(130%_120%_at_100%_0%,rgba(250,204,21,0.2),rgba(250,204,21,0.04)_45%,transparent_78%),linear-gradient(180deg,rgba(22,17,9,0.88),rgba(9,8,6,0.9))] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/35 bg-yellow-300/15 px-3 py-1 text-[11px] font-black text-yellow-100">
                    <span className="text-[10px]">&#9889;</span>
                    Instant help
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(140deg,#fde047,#facc15)] text-sm font-black text-[#2f2408] shadow-[0_0_16px_rgba(250,204,21,0.35)]">
                      RK
                    </div>
                    <div>
                      <p className="text-[30px] leading-none font-black tracking-tight text-white sm:text-[34px]">{BRAND_CONFIG.identity.storeName}</p>
                      <p className="mt-2 text-xs font-semibold text-white/55">Premium Digital Products</p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-yellow-300/40 px-4 py-1.5 text-sm font-black text-yellow-100">Join</span>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {onlineStatusText}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="h-10 w-10 rounded-full border border-white/15 bg-[linear-gradient(140deg,#fde68a,#facc15)] shadow-[0_0_20px_rgba(250,204,21,0.28)]" />
                  <span className="h-10 w-10 rounded-full border border-white/15 bg-[linear-gradient(140deg,#60a5fa,#818cf8)]" />
                  <span className="h-10 w-10 rounded-full border border-white/15 bg-[linear-gradient(140deg,#fb923c,#f87171)]" />
                  {overflowOnlineMembers > 0 && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[22px] leading-none font-black text-white/90">{overflowOnlineLabel}</span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-3.5">
                    <p className="text-2xl leading-none font-black tabular-nums tracking-tight text-white sm:text-3xl lg:text-[34px]">{formattedMemberCount}</p>
                    <p className="mt-2 text-xs font-semibold text-white/45">Total members</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-3.5">
                    <p className="text-2xl leading-none font-black tabular-nums tracking-tight text-white sm:text-3xl lg:text-[34px]">{fakeTicketsSolved}</p>
                    <p className="mt-2 text-xs font-semibold text-white/45">Tickets solved</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-3.5">
                    <p className="text-2xl leading-none font-black tabular-nums tracking-tight text-white sm:text-3xl lg:text-[34px]">{fakeAvgResponseMinutes}</p>
                    <p className="mt-2 text-xs font-semibold text-white/45">Avg. response (min)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};
