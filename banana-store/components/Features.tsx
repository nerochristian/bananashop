import React from 'react';
import { Zap, Shield, Headphones, Globe } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-black" />,
      title: "Instant Delivery",
      description: "Receive your account credentials immediately after purchase. No manual wait times."
    },
    {
      icon: <Shield className="w-6 h-6 text-black" />,
      title: "Secure Warranty",
      description: "All products include a full replacement warranty. We've got you covered."
    },
    {
      icon: <Headphones className="w-6 h-6 text-black" />,
      title: "24/7 Support",
      description: "Our staff are available around the clock via Discord to resolve any issues."
    },
    {
      icon: <Globe className="w-6 h-6 text-black" />,
      title: "Global Access",
      description: "Works worldwide without needing a VPN. High quality localized accounts."
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">{BRAND_CONFIG.emojis.trust} {BRAND_CONFIG.copy.trustHeading}</h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm font-medium uppercase tracking-widest">
            Delivering premium digital access to over 20,000 customers worldwide.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-10 rounded-[40px] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all card-glow">
              <div className="w-14 h-14 rounded-2xl bg-[#facc15] flex items-center justify-center mb-8 shadow-xl shadow-yellow-400/10">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-white/30 text-xs font-medium leading-relaxed uppercase tracking-wider">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
