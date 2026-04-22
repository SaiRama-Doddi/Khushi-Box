import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const syncUserToFirestore = async (user: any) => {
    try {
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // New user - default to customer unless it's a specific admin email
        const adminEmails = ['prasannaofficial1712@gmail.com', 'hellokhushibox@gmail.com'];
        const isAdminEmail = adminEmails.includes(user.email);
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          role: isAdminEmail ? 'admin' : 'customer',
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error syncing user:', err);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error('Reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserToFirestore(result.user);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login method disabled. You MUST enable "Email/Password" in your Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid credentials. If you haven\'t created an account yet, use the "Sign Up" option below.');
      } else {
        setError(`Error: ${err.message || 'Unknown error'} (${err.code || 'no-code'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-primary/10"
      >
        <div className="text-center mb-8">
          <img 
            src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
            alt="Khushi Logo"
            className="size-20 object-contain mx-auto mb-4"
          />
          <h2 className="text-3xl font-black text-text-dark">Admin Portal</h2>
          <p className="text-text-muted mt-2">Secure access for Khushi management</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-primary/20 bg-background-cream focus:ring-primary focus:border-primary text-sm"
                  placeholder="admin@khushi.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                   type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border-primary/20 bg-background-cream focus:ring-primary focus:border-primary text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {resetSent && (
              <p className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                Password reset email sent! Please check your inbox.
              </p>
            )}

            {error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Authorize Access'}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-4 text-center">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] font-bold text-text-muted hover:text-primary uppercase tracking-widest transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background-tan text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
