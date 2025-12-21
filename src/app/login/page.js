'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'guerrillamail.com', 
  'yopmail.com', '10minutemail.com', 'sharklasers.com', 'getnada.com',
  'dispostable.com', 'grr.la', 'temp-mail.org', 'temp-mail.ru'
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState('');
  // 蜜罐字段，用于防止简单的机器人注册 / Honeypot field to prevent simple bot registration
  const [honeyPot, setHoneyPot] = useState('');
  // 记录页面加载时间，用于防止快速提交 / Record page load time to prevent rapid submission
  const [mountTime, setMountTime] = useState(0);
  
  // 密码验证状态
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    number: false,
    letter: false
  });
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);

  const router = useRouter();
  const { t } = useLanguage();

  // 记录页面加载时间 / Record page load time
  useEffect(() => {
    setMountTime(Date.now());
  }, []);

  // 监听密码变化，实时验证 / Monitor password changes for validation
  useEffect(() => {
    if (isSignUp) {
      if (password) {
        setPasswordCriteria({
          length: password.length >= 8,
          number: /\d/.test(password),
          letter: /[a-zA-Z]/.test(password)
        });
        setShowPasswordValidation(true);
      } else {
        // 密码为空时，重置验证状态
        setPasswordCriteria({ length: false, number: false, letter: false });
        setShowPasswordValidation(false);
      }
    } else {
      setShowPasswordValidation(false);
    }
  }, [password, isSignUp]);

  /**
   * 校验密码强度
   * Validate password strength
   * @param {string} password
   * @returns {string|null} Error message or null
   */
  const validatePassword = (password) => {
    if (password.length < 8) return t('password_too_short');
    if (!/\d/.test(password)) return t('password_no_number');
    if (!/[a-zA-Z]/.test(password)) return t('password_no_letter');
    return null;
  };

  /**
   * 伪装成功函数
   * Fake success function to fool bots
   */
  const fakeSuccess = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage(isSignUp ? t('register_success') : (isForgotPassword ? t('reset_email_sent') : ''));
    }, 1000 + Math.random() * 1000); // Random delay
  };

  /**
   * 处理认证逻辑（登录、注册、重置密码）
   * Handle authentication logic (Login, Register, Reset Password)
   */
  const handleAuth = async (e) => {
    e.preventDefault();

    // 蜜罐检查：如果蜜罐字段有值，说明是机器人 / Honeypot check
    if (honeyPot) {
      console.log('Bot detected via honeypot');
      // 伪装成功，防止机器人尝试其他方式 / Fake success
      fakeSuccess();
      return;
    }

    // 时间检查：如果提交速度过快（小于2秒），可能是脚本 / Time check
    // 正常用户填写表单通常需要超过2秒
    if (Date.now() - mountTime < 2000) {
      console.log('Bot detected via rapid submission');
      fakeSuccess();
      return;
    }

    // 临时邮箱检查 / Disposable email check
    const emailDomain = email.split('@')[1];
    if (emailDomain && DISPOSABLE_DOMAINS.includes(emailDomain.toLowerCase())) {
       setMessage(t('invalid_email_domain') || 'Please use a valid email address from a reputable provider.');
       setLoading(false);
       return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (isForgotPassword) {
        // 发送重置密码邮件 / Send reset password email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        });
        if (error) throw error;
        setMessage(t('reset_email_sent'));
      } else if (isSignUp) {
        // 注册前校验密码 / Validate password before signup
        const passwordError = validatePassword(password);
        if (passwordError) {
          setMessage(passwordError);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage(t('register_success'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Login Error:', error);
      
      // 处理 Supabase 特定的错误 / Handle specific Supabase errors
      if (error.name === 'AuthApiError' || error.name === 'AuthUnknownError') {
         if (error.message === 'Invalid login credentials') {
           setMessage(t('invalid_credentials'));
         } else {
           setMessage(error.message);
         }
      } else if (error.message && (error.message.includes('Invalid API key') || error.message.includes('service_role'))) {
        setMessage(t('system_config_error'));
      } else if (error.message && error.message.includes('fetch')) {
        setMessage(t('network_error'));
      } else {
        setMessage(error.message || t('unexpected_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = passwordCriteria.length && passwordCriteria.number && passwordCriteria.letter;

  return (
    <div className="flex flex-col min-h-screen bg-background font-display text-foreground">
      <Navigation />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              {isForgotPassword 
                ? t('reset_password_title') 
                : (isSignUp ? t('register_title') : t('login_title'))}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            {/* Honeypot field - hidden from real users */}
            <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="website_hp">Website</label>
              <input
                id="website_hp"
                type="text"
                name="website_hp"
                value={honeyPot}
                onChange={(e) => setHoneyPot(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-subtle text-foreground ${isForgotPassword ? 'rounded-md' : 'rounded-t-md'} focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background`}
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-subtle hover:text-foreground z-20"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
              {!isForgotPassword && (
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-subtle text-foreground rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                    placeholder={t('password_placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setPassword('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-subtle hover:text-foreground z-20"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Password Validation Indicators (Only for SignUp) */}
            {isSignUp && showPasswordValidation && (
              <div className="mt-2 space-y-1 bg-background/50 p-2 rounded-md text-xs">
                 <div className={`flex items-center ${passwordCriteria.length ? 'text-green-600' : 'text-red-500'}`}>
                   {passwordCriteria.length ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                   {t('password_too_short').replace('。', '')}
                 </div>
                 <div className={`flex items-center ${passwordCriteria.number ? 'text-green-600' : 'text-red-500'}`}>
                   {passwordCriteria.number ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                   {t('password_no_number').replace('。', '')}
                 </div>
                 <div className={`flex items-center ${passwordCriteria.letter ? 'text-green-600' : 'text-red-500'}`}>
                   {passwordCriteria.letter ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                   {t('password_no_letter').replace('。', '')}
                 </div>
              </div>
            )}

            {!isForgotPassword && !isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setMessage('');
                  }}
                >
                  {t('forgot_password')}
                </button>
              </div>
            )}

            {message && (
              <div className={`text-sm text-center ${message.includes('成功') || message.includes('sent') ? 'text-success' : 'text-danger'}`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || (isSignUp && !isPasswordValid)}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? t('processing') 
                  : (isForgotPassword 
                      ? t('reset_password_btn') 
                      : (isSignUp ? t('register_btn') : t('login_btn')))}
              </button>
            </div>
          </form>

          <div className="text-center space-y-2">
            {isForgotPassword ? (
              <button
                className="text-sm text-primary hover:text-primary/80"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage('');
                }}
              >
                {t('back_to_login')}
              </button>
            ) : (
              <button
                className="text-sm text-primary hover:text-primary/80"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage('');
                  setPassword(''); // Clear password when switching modes
                  setEmail('');
                  setPasswordCriteria({ length: false, number: false, letter: false });
                  setShowPasswordValidation(false);
                }}
              >
                {isSignUp ? t('have_account') : t('no_account')}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
