
import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Zap, CreditCard, Wallet, Bitcoin, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { CartItem, Product } from '../types';
import { Order, User } from '../services/storageService';
import { BotBridgeService } from '../services/botBridgeService';
import { ShopApiService } from '../services/shopApiService';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser: User | null;
  onSuccess: (updatedProducts?: Product[]) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ isOpen, onClose, items, currentUser, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [processingPhase, setProcessingPhase] = useState('Verifying Transaction...');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'paypal'>('card');
  const [error, setError] = useState('');
  const [updatedProducts, setUpdatedProducts] = useState<Product[] | undefined>(undefined);
  const [methodAvailability, setMethodAvailability] = useState<{
    card: { enabled: boolean; automated: boolean };
    paypal: { enabled: boolean; automated: boolean };
    crypto: { enabled: boolean; automated: boolean };
  }>({
    card: { enabled: false, automated: true },
    paypal: { enabled: false, automated: false },
    crypto: { enabled: false, automated: false },
  });
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!isOpen) return;
    ShopApiService.getPaymentMethods()
      .then((methods) => setMethodAvailability(methods))
      .catch((methodsError) => {
        console.warn('Failed to load payment method availability:', methodsError);
        setMethodAvailability({
          card: { enabled: false, automated: true },
          paypal: { enabled: false, automated: false },
          crypto: { enabled: false, automated: false },
        });
      });
  }, [isOpen]);

  const handleCheckout = () => {
    if (!currentUser) return;
    if (paymentMethod === 'card' && !methodAvailability.card.enabled) {
      setError('Card payments are not configured yet. Set STRIPE_SECRET_KEY on your API.');
      setStep('payment');
      return;
    }
    if (paymentMethod === 'paypal' && !methodAvailability.paypal.enabled) {
      setError('PayPal is not configured yet. Set PAYPAL_CHECKOUT_URL on your API.');
      setStep('payment');
      return;
    }
    if (paymentMethod === 'crypto' && !methodAvailability.crypto.enabled) {
      setError('Crypto checkout is not configured yet. Set OXAPAY_MERCHANT_API_KEY on your API.');
      setStep('payment');
      return;
    }

    setError('');
    setStep('processing');
    
    // Multi-phase security simulation
    setTimeout(() => setProcessingPhase('Encrypting Order Metadata...'), 800);
    setTimeout(() => setProcessingPhase('Securing Premium Licenses...'), 1600);
    
    setTimeout(async () => {
      const order: Order = {
        id: `ord-${Date.now()}`,
        userId: currentUser.id,
        items: [...items],
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        credentials: {}
      };

      try {
        const successUrl = `${window.location.origin}${window.location.pathname}`;
        const cancelUrl = `${window.location.origin}${window.location.pathname}`;
        const payment = await ShopApiService.createPayment(order, currentUser, paymentMethod, successUrl, cancelUrl);
        if (!payment.ok) {
          throw new Error('Failed to create payment session.');
        }
        if (paymentMethod === 'card') {
          if (!payment.checkoutUrl) {
            throw new Error('Failed to create card payment session.');
          }
          window.location.href = payment.checkoutUrl;
          return;
        }

        if (paymentMethod === 'crypto' && !payment.manual) {
          if (!payment.checkoutUrl) {
            throw new Error('Failed to create OxaPay payment session.');
          }
          window.location.href = payment.checkoutUrl;
          return;
        }

        if (payment.checkoutUrl) {
          window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer');
        }

        const result = await ShopApiService.buy(order, currentUser, paymentMethod, true);
        if (!result.ok) {
          throw new Error('Purchase failed.');
        }

        const finalOrder: Order = result.order || {
          ...order,
          status: 'completed',
        };

        if (result.products && result.products.length > 0) {
          setUpdatedProducts(result.products);
        } else {
          setUpdatedProducts(undefined);
        }

        BotBridgeService.sendOrder(finalOrder, currentUser, paymentMethod).catch((bridgeError) => {
          console.error('Failed to notify bot about completed order:', bridgeError);
        });
        setStep('success');
      } catch (purchaseError) {
        console.error('Checkout failed:', purchaseError);
        const errorText = purchaseError instanceof Error ? purchaseError.message : 'Checkout failed.';
        setError(errorText);
        setStep('payment');
      }
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/5 bg-[#0a0a0a] shadow-[0_0_150px_rgba(0,0,0,0.8)] sm:rounded-[48px]">
        {step !== 'processing' && step !== 'success' && (
          <button onClick={onClose} className="absolute right-4 top-4 z-20 rounded-2xl bg-white/5 p-2.5 text-white/40 transition-all hover:text-white sm:right-8 sm:top-8 sm:p-3">
            <X className="w-6 h-6" />
          </button>
        )}

        {step === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b border-white/5 p-5 md:border-b-0 md:border-r md:p-12">
              <h2 className="mb-6 text-2xl font-black uppercase tracking-tighter italic text-white sm:text-3xl md:mb-8">Order <span className="text-[#facc15]">Manifest</span></h2>
              <div className="scrollbar-hide max-h-[40vh] space-y-4 overflow-y-auto pr-1 sm:space-y-6 sm:pr-4 md:max-h-[400px]">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 rounded-3xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight text-white">{item.name}</p>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{item.duration} Access × {item.quantity}</p>
                      <p className="text-[#facc15] font-black text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/5 pt-5 sm:mt-10 sm:pt-8">
                 <div className="flex justify-between items-center mb-6">
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Consolidated Total</span>
                   <span className="text-2xl font-black italic text-[#facc15] sm:text-3xl">${total.toFixed(2)}</span>
                 </div>
                 <button onClick={() => setStep('payment')} className="w-full rounded-2xl bg-[#facc15] py-4 text-xs font-black uppercase tracking-widest text-black shadow-xl shadow-yellow-400/10 transition-all active:scale-[0.98] sm:py-5">
                   Initialize Transaction
                 </button>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center bg-black/30 p-6 text-center sm:p-10 md:p-12">
               <div className="absolute inset-0 bg-radial-gradient from-yellow-400/5 to-transparent"></div>
               <ShieldCheck className="w-16 h-16 text-[#facc15] mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10" />
               <h3 className="text-xl font-black text-white mb-4 relative z-10 uppercase italic">Secure Gateway</h3>
               <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest leading-loose relative z-10">
                 All purchases are protected by our <br />
                 <span className="text-white">24-hour global replacement warranty</span>.<br />
                 Encrypted delivery protocol active.
               </p>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-5 text-center sm:p-10 md:p-20">
            <h2 className="mb-8 text-3xl font-black uppercase tracking-tighter italic text-white sm:mb-12 sm:text-4xl">Select <span className="text-[#facc15]">Protocol</span></h2>
            <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-4 sm:mb-16 sm:grid-cols-3 sm:gap-8">
              <button
                onClick={() => setPaymentMethod('card')}
                disabled={!methodAvailability.card.enabled}
                className={`group flex flex-col items-center gap-4 rounded-[26px] border p-6 transition-all sm:gap-6 sm:rounded-[40px] sm:p-10 ${paymentMethod === 'card' ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15] shadow-2xl' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'} ${!methodAvailability.card.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <CreditCard className={`w-10 h-10 transition-transform ${paymentMethod === 'card' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                disabled={!methodAvailability.paypal.enabled}
                className={`group flex flex-col items-center gap-4 rounded-[26px] border p-6 transition-all sm:gap-6 sm:rounded-[40px] sm:p-10 ${paymentMethod === 'paypal' ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15] shadow-2xl' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'} ${!methodAvailability.paypal.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Wallet className={`w-10 h-10 transition-transform ${paymentMethod === 'paypal' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">PayPal</span>
              </button>
              <button
                onClick={() => setPaymentMethod('crypto')}
                disabled={!methodAvailability.crypto.enabled}
                className={`group flex flex-col items-center gap-4 rounded-[26px] border p-6 transition-all sm:gap-6 sm:rounded-[40px] sm:p-10 ${paymentMethod === 'crypto' ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15] shadow-2xl' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'} ${!methodAvailability.crypto.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Bitcoin className={`w-10 h-10 transition-transform ${paymentMethod === 'crypto' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">Crypto</span>
              </button>
            </div>
            <button onClick={handleCheckout} className="rounded-3xl bg-[#facc15] px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-2xl shadow-yellow-400/20 transition-all hover:bg-yellow-300 active:scale-95 sm:px-16 sm:py-6 sm:tracking-[0.3em]">
              Execute ${total.toFixed(2)} via {paymentMethod}
            </button>
            <p className="mt-4 text-white/40 text-[10px] font-black uppercase tracking-wider">
              Card uses Stripe. Crypto uses OxaPay verification before delivery.
            </p>
            {error && (
              <p className="mt-6 text-red-400 text-xs font-black uppercase tracking-widest">
                {error}
              </p>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center p-10 text-center sm:p-16 md:p-32">
            <div className="relative mb-12">
               <div className="w-24 h-24 border-4 border-white/5 border-t-[#facc15] rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#facc15] animate-pulse" />
               </div>
            </div>
            <h2 className="mb-4 text-3xl font-black uppercase tracking-tighter italic text-white sm:text-4xl">{processingPhase}</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">Secure Handshake Protocol Active</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center animate-in zoom-in-95 duration-700 sm:p-16 md:p-24">
             <div className="w-28 h-28 bg-[#22c55e] rounded-[40px] mx-auto flex items-center justify-center mb-12 rotate-12 shadow-[0_0_60px_rgba(34,197,94,0.4)] border-4 border-black/20">
               <CheckCircle2 className="w-14 h-14 text-black" strokeWidth={4} />
             </div>
             <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter italic text-white sm:text-5xl md:text-6xl">Clearance <span className="text-[#22c55e]">Granted</span></h2>
             <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-16">Credentials generated and assigned to vault</p>
             <button onClick={() => { onSuccess(updatedProducts); onClose(); }} className="mx-auto flex items-center gap-4 rounded-3xl bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.22em] text-black transition-all hover:bg-gray-200 active:scale-95 sm:px-14 sm:py-6 sm:tracking-[0.3em]">
               Access Decrypted Vault <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
