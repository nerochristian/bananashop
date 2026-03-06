import React from 'react';
import { MoreHorizontal, ShoppingCart } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick }) => {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [BRAND_CONFIG.assets.logoUrl]);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const openExternal = (url: string) => {
    if (!url || url === '#') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const goHome = () => {
    onLogoClick();
    setMobileOpen(false);
  };

  const goProducts = () => {
    if (window.location.pathname !== '/') {
      onLogoClick();
      window.setTimeout(() => {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  const goGuides = () => {
    if (window.location.pathname !== '/') {
      onLogoClick();
      window.setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  const openDiscord = () => {
    openExternal(BRAND_CONFIG.links.discord === '#' ? BRAND_CONFIG.links.support : BRAND_CONFIG.links.discord);
  };

  return (
    <div className={`header-wrapper ${isScrolled ? 'scrolled' : ''}`} id="headerWrapper">
      <nav className="nebula-navbar">
        <div className="container">
          <div className="zone-brand">
            <button
              type="button"
              className="nav-brand nav-brand-btn"
              onClick={goHome}
              aria-label="Home"
            >
            {BRAND_CONFIG.assets.logoUrl && !logoFailed ? (
              <img
                src={BRAND_CONFIG.assets.logoUrl}
                alt={`${BRAND_CONFIG.identity.storeName} logo`}
                className="h-8 w-8 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="brand-fallback">RK</span>
            )}
              <span className="brand-text">{BRAND_CONFIG.identity.storeName}</span>
            </button>
          </div>

          <div className="zone-links">
            <ul className="nav-links">
              <li><button type="button" className="nav-link-btn" onClick={goHome}>Home</button></li>
              <li><button type="button" className="nav-link-btn" onClick={goProducts}>Products</button></li>
              <li><button type="button" className="nav-link-btn" onClick={goGuides}>Guides</button></li>
              <li><button type="button" className="nav-link-btn" onClick={() => navigateTo('/terms')}>Terms</button></li>
              <li><button type="button" className="nav-link-btn" onClick={() => navigateTo('/privacy')}>Privacy</button></li>
            </ul>
          </div>

          <div className="zone-actions">
            <button
              type="button"
              onClick={onCartClick}
              aria-label="Open cart"
              className="btn-cart"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <span className="badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="mobile-menu-toggle"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </button>

            <button type="button" onClick={openDiscord} className="btn-discord btn-nav-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="discord-icon">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"></path>
              </svg>
              Discord
            </button>

            <button type="button" onClick={onAdminClick} className="btn-nav-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-icon">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10,17 15,12 10,7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login
            </button>
          </div>
        </div>

        <div className={`mobile-menu ${mobileOpen ? 'active' : ''}`}>
          <div className="mobile-menu-content">
            <ul className="mobile-nav-links">
              <li><button type="button" onClick={goHome}>Home</button></li>
              <li><button type="button" onClick={goProducts}>Products</button></li>
              <li><button type="button" onClick={goGuides}>Guides</button></li>
              <li><button type="button" onClick={() => navigateTo('/terms')}>Terms</button></li>
              <li><button type="button" onClick={() => navigateTo('/privacy')}>Privacy</button></li>
            </ul>

            <div className="mobile-nav-buttons">
              <button
                type="button"
                onClick={() => {
                  openDiscord();
                  setMobileOpen(false);
                }}
                className="btn-discord btn-nav-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="discord-icon">
                  <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"></path>
                </svg>
                Discord
              </button>

              <button
                type="button"
                onClick={() => {
                  onAdminClick();
                  setMobileOpen(false);
                }}
                className="btn-nav-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-icon">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10,17 15,12 10,7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
