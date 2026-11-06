'use client';

import { useState } from 'react';
import { rpc, TYPE_EMOJI } from '../lib/rpc';
import { useLang, TIKTOK_URL } from '../lib/i18n';
import LangSwitch from '../components/LangSwitch';

export default function RegisterPage() {
  const { t, date } = useLang();
  const [username, setUsername] = useState('');
  const [citizen, setCitizen] = useState(null);
  const [house, setHouse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const [agreed, setAgreed] = useState(false);

  function openTikTok() {
    window.open(TIKTOK_URL, '_blank', 'noopener');
    setOpened(true);
    setOpenedAt(Date.now());
    setError('');
  }

  async function register(e) {
    e.preventDefault();
    setError('');

    if (!opened || !agreed) {
      setError(t('follow.need'));
      return;
    }
    if (Date.now() - openedAt < 4000) {
      setError(t('follow.wait'));
      return;
    }

    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9._]{2,24}$/.test(clean)) {
      setError(t('err.format'));
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError(t('err.conn'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${url}/rest/v1/rpc/register_citizen`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_tiktok_username: clean })
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.message || '';
        if (message.includes('USERNAME_ALREADY_REGISTERED')) throw new Error(t('err.taken'));
        if (message.includes('INVALID_TIKTOK_USERNAME')) throw new Error(t('err.invalid'));
        throw new Error(t('err.generic'));
      }

      setCitizen(data[0]);
      try {
        const h = await rpc('get_house', { p_citizen_id: data[0].citizen_id });
        if (h && h[0]) setHouse(h[0]);
      } catch (_) {}
    } catch (err) {
      setError(err.message || t('err.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='register-page'>
      <div className='lang'>
        <LangSwitch />
      </div>
      <div className='register-card'>
        <div className='emblem'>♛</div>
        <div className='eyebrow'>THE NEW REPUBLIC</div>
        <h1>{t('reg.title')}</h1>
        <p className='subtitle'>{t('reg.sub')}</p>

        {!citizen ? (
          <form onSubmit={register}>
            <div className='gate'>
              <div className='gate-title'>🎵 {t('follow.title')}</div>
              <p className='gate-desc'>{t('follow.desc')}</p>
              <button type='button' className='tt' onClick={openTikTok}>
                {t('follow.btn')} →
              </button>
              {opened && <p className='gate-note'>{t('follow.opened')}</p>}
              <label className={opened ? 'check' : 'check off'}>
                <input
                  type='checkbox'
                  checked={agreed}
                  disabled={!opened}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>{t('follow.check')}</span>
              </label>
            </div>

            <label className='lbl'>{t('reg.label')}</label>
            <div className='username-input'>
              <span>@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='your_username'
                maxLength={25}
                required
              />
            </div>
            <p className='hint'>{t('reg.hint')}</p>

            {error && <div className='error'>{error}</div>}

            <button className='go' disabled={loading}>
              {loading ? t('reg.loading') : t('reg.btn')}
            </button>
          </form>
        ) : (
          <div className='passport'>
            <div className='passport-top'>{t('pass.top')}</div>
            <div className='flag'>🌐</div>
            <h2>THE NEW REPUBLIC</h2>
            <div className='passport-line'>
              <span>{t('pass.user')}</span>
              <strong>{citizen.tiktok_username}</strong>
            </div>
            <div className='passport-line'>
              <span>{t('pass.id')}</span>
              <strong>{citizen.citizen_id}</strong>
            </div>
            <div className='passport-line'>
              <span>{t('pass.date')}</span>
              <strong>{date(citizen.joined_at)}</strong>
            </div>
            {house && (
              <>
                <div className='passport-line'>
                  <span>{t('pass.house')}</span>
                  <strong>
                    {TYPE_EMOJI[house.house_type] || '🏠'} {t('type.' + house.house_type)}
                  </strong>
                </div>
                <div className='passport-line'>
                  <span>{t('pass.role')}</span>
                  <strong>{t('role.' + house.role)}</strong>
                </div>
              </>
            )}
            <div className='passport-bottom'>UNITY • PROGRESS • FUTURE</div>
            <p className='success'>{t('pass.welcome')}</p>
            <a className='house-link' href={`/city#${citizen.tiktok_username.replace('@', '')}`}>
              {t('pass.view')}
            </a>
          </div>
        )}

        <a className='back' href='/'>{t('back')}</a>
        <p className='disclaimer'>{t('disclaimer')}</p>
      </div>

      <style jsx>{`
        .register-page {
          position: relative;
          min-height: 100vh;
          background: radial-gradient(circle at top, #183452, #07111f 65%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 16px 30px;
          font-family: Arial, sans-serif;
        }
        .lang { position: absolute; top: 14px; right: 14px; }
        .register-card {
          width: 100%;
          max-width: 480px;
          padding: 36px 25px;
          background: rgba(12, 29, 49, .94);
          border: 1px solid #b9954b;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 20px 70px #0008;
        }
        .emblem { color: #d6ad50; font-size: 48px; }
        .eyebrow { color: #d6ad50; letter-spacing: 4px; font-size: 12px; }
        h1 { font-size: 27px; margin: 18px 0 10px; }
        .subtitle { color: #aab8c8; font-size: 13px; margin-bottom: 26px; }
        form { text-align: left; }
        .gate {
          border: 1px solid #d6ad50;
          border-radius: 12px;
          padding: 16px;
          background: #0a1828;
          margin-bottom: 22px;
        }
        .gate-title { color: #f0d38a; font-weight: bold; font-size: 15px; }
        .gate-desc { color: #aab8c8; font-size: 12px; line-height: 1.6; margin: 8px 0 0; }
        .gate-note { color: #e5c77d; font-size: 12px; margin: 10px 0 0; }
        .tt {
          width: 100%; padding: 14px; margin-top: 14px;
          background: #111; border: 1px solid #fff; border-radius: 8px;
          color: #fff; font-weight: bold; letter-spacing: 1px; cursor: pointer; font-size: 12px;
        }
        .check { display: flex; align-items: center; gap: 10px; margin-top: 14px; font-size: 12px; color: #fff; cursor: pointer; }
        .check.off { opacity: .45; cursor: not-allowed; }
        .check input { width: 18px; height: 18px; padding: 0; margin: 0; accent-color: #d6ad50; }
        .lbl { color: #d6ad50; font-size: 11px; letter-spacing: 2px; }
        .username-input {
          display: flex; align-items: center; gap: 8px;
          background: #07111f; border: 1px solid #53677d;
          border-radius: 9px; padding: 0 14px; margin-top: 10px;
        }
        .username-input span { color: #d6ad50; font-size: 19px; }
        .username-input input {
          width: 100%; background: transparent; border: 0;
          outline: none; color: white; padding: 16px 0; font-size: 16px;
        }
        .hint { color: #899bad; font-size: 12px; }
        .go {
          width: 100%; padding: 16px; margin-top: 20px;
          background: linear-gradient(110deg, #b58b3c, #f0d38a);
          border: 0; border-radius: 8px; color: #07111f;
          font-weight: bold; letter-spacing: 1px; cursor: pointer;
        }
        .go:disabled { opacity: .6; }
        .error { color: #ff8585; font-size: 13px; margin-top: 12px; line-height: 1.5; }
        .passport {
          border: 1px solid #d6ad50; border-radius: 12px;
          padding: 22px 15px; background: #101f31;
        }
        .passport-top, .passport-bottom { color: #d6ad50; letter-spacing: 2px; font-size: 10px; }
        .flag { font-size: 48px; margin-top: 20px; }
        .passport h2 { color: #d6ad50; font-size: 20px; }
        .passport-line { text-align: left; padding: 12px 0; border-bottom: 1px solid #34465a; }
        .passport-line span { display: block; color: #91a2b5; font-size: 10px; }
        .passport-line strong { display: block; margin-top: 5px; }
        .passport-bottom { margin-top: 20px; }
        .success { color: #e5c77d; font-weight: bold; margin-bottom: 0; }
        .house-link {
          display: block; margin-top: 18px; padding: 14px;
          background: linear-gradient(110deg, #b58b3c, #f0d38a);
          color: #07111f; font-weight: bold; font-size: 12px;
          letter-spacing: 1px; border-radius: 8px; text-decoration: none;
        }
        .back { display: inline-block; color: #d6ad50; margin-top: 25px; font-size: 12px; }
        .disclaimer { color: #74869a; font-size: 10px; line-height: 1.6; margin-top: 25px; }
      `}</style>
    </main>
  );
}
