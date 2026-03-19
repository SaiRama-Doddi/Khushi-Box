import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { BUSINESS_PHONE } from '../constants';

const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      showToast('Message sent successfully! We will get back to you soon.', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="bg-[#fdfcf8] min-h-screen">
      {/* Banner Image */}
      <div className="h-[40vh] w-full relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2000&auto=format&fit=crop" 
          alt="Contact Us Banner" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display italic text-white"
          >
            Get in Touch
          </motion.h1>
        </div>
      </div>

      {/* Header */}
      <section className="pt-16 pb-16 px-4 text-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] uppercase tracking-[0.5em] text-slate-400 mb-6 block"
        >
          Inquiries
        </motion.span>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Contact Info */}
          <div className="space-y-16">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 mb-8">Contact Details</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Email Us</p>
                    <p className="text-lg font-light text-slate-900">hellokhushibox@gmail.com</p>
                    <p className="text-xs text-slate-400 mt-1 italic">Response within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">WhatsApp & Call</p>
                    <p className="text-lg font-light text-slate-900">+{BUSINESS_PHONE}</p>
                    <p className="text-xs text-slate-400 mt-1 italic">Mon-Sat, 10 AM - 6 PM IST</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Studio Location</p>
                    <p className="text-lg font-light text-slate-900">
                      Flat No-1302, Block 1, Aditya Imperial Heights,<br />
                      Manjeera Pipeline Road, Hafeezpet,<br />
                      500049 Hyderabad, India
                    </p>
                    <a 
                      href="https://maps.app.goo.gl/HxLrceDAuJhnRaBc6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-64 grayscale hover:grayscale-0 transition-all duration-700">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.534604646453!2d78.3512345!3d17.4812345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb939777777777%3A0x7777777777777777!2sAditya%20Imperial%20Heights!5e0!3m2!1sen!2sin!4v1710500000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 mb-8">Follow Our Journey</h3>
              <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <a href="#" className="hover:text-primary transition-colors">Instagram</a>
                <a href="#" className="hover:text-primary transition-colors">Pinterest</a>
                <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Name</label>
                  <input 
                    required
                    type="text"
                    className="w-full border-b border-slate-200 py-3 focus:border-primary outline-none transition-colors text-sm font-light"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                  <input 
                    required
                    type="email"
                    className="w-full border-b border-slate-200 py-3 focus:border-primary outline-none transition-colors text-sm font-light"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject</label>
                <input 
                  required
                  type="text"
                  className="w-full border-b border-slate-200 py-3 focus:border-primary outline-none transition-colors text-sm font-light"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full border-b border-slate-200 py-3 focus:border-primary outline-none transition-colors text-sm font-light resize-none"
                  placeholder="Tell us more..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    Send Message
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
