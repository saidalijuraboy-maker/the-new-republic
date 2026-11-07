'use client';

import { useEffect, useMemo, useState } from 'react';
import { rpc } from '../lib/rpc';
import { useLang } from '../lib/i18n';

const OPTIONS = [
  { id: 'mosque', emoji: '🕌', en: 'Mosque', ru: 'Мечеть' },
  { id: 'cinema', emoji: '🎬', en: 'Cinema', ru: 'Кинотеатр' },
  { id: 'amusement_park', emoji: '🎢', en: 'Amusement Park', ru: 'Парк аттракционов' },
  { id: 'riverside_resort', emoji: '🌴', en: 'Riverside Resort', ru: 'Курорт возле речки' }
];

export default function CitizenPoll() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const [platform, setPlatform] = useState('tiktok');
  const [username, setUsername] = useState('');
  const [selected, setSelected] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [voted, setVoted] = useState(false);

  const total = useMemo(() => results.reduce((sum, item) => sum + Number(item.vote_count || 0), 0), [results]);

  async function loadResults() {
    try {
      const data = await rpc('get_poll_results');
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(ru ? 'Не удалось загрузить результаты. Попробуй позже.' : 'Could not load results. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) {
      setVoted(false);
      return;
    }
    try {
      setVoted(localStorage.getItem('tnr_poll_voted:' + platform + ':' + clean) === '1');
    } catch (e) {
      setVoted(false);
    }
  }, [username, platform]);

  async function submitVote() {
    const clean = username.trim().replace(/^@/, '');
    if (!clean || !selected) {
      setMessage(ru ? 'Введи свой ник и выбери один вариант.' : 'Enter your username and choose one option.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await rpc('cast_poll_vote', {
        p_username: clean,
        p_platform: platform,
        p_option_id: selected
      });
      try {
        localStorage.setItem('tnr_poll_voted:' + platform + ':' + clean.toLowerCase(), '1');
      } catch (e) {}
      setVoted(true);
      setMessage(ru ? 'Твой голос принят! Спасибо за участие.' : 'Your vote has been recorded. Thank you!');
      await loadResults();
    } catch (error) {
      const code = String(error?.message || '');
      if (code.includes('CITIZEN_NOT_FOUND')) {
        setMessage(ru ? 'Гражданин с таким ником не найден. Проверь платформу и ник, указанные при регистрации.' : 'No citizen found with this username. Check the platform and username used during registration.');
      } else if (code.includes('ALREADY_VOTED')) {
        setVoted(true);
        setMessage(ru ? 'С этого аккаунта уже голосовали. Повторный голос не принимается.' : 'This citizen record has already voted. A second vote is not accepted.');
      } else {
        setMessage(ru ? 'Не удалось отправить голос. Проверь данные и попробуй ещё раз.' : 'Vote could not be submitted. Check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='max-w-3xl mx-auto mt-12 text-left'>
      <div className='grid sm:grid-cols-2 gap-4'>
        {OPTIONS.map((option) => {
          const count = Number(results.find((item) => item.option_id === option.id)?.vote_count || 0);
          const percent = total ? Math.round((count / total) * 100) : 0;
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type='button'
              onClick={() => !voted && setSelected(option.id)}
              disabled={voted}
              className={'text-left rounded-2xl border p-5 transition ' + (active ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-[#0c1d31] hover:border-white/30') + (voted ? ' cursor-default' : '')}
            >
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>{option.emoji}</span>
                <span className='font-bold text-white'>{ru ? option.ru : option.en}</span>
                {active && <span className='ml-auto text-yellow-400'>✓</span>}
              </div>
              <div className='mt-5 flex justify-between text-xs text-gray-400'>
                <span>{loading ? (ru ? 'Загрузка…' : 'Loading…') : (ru ? 'Голоса' : 'Votes') + ': ' + count}</span>
                <span>{percent}%</span>
              </div>
              <div className='h-2 rounded-full bg-white/10 mt-2 overflow-hidden'>
                <div className='h-full rounded-full bg-yellow-400 transition-all' style={{ width: percent + '%' }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className='mt-7 rounded-2xl border border-white/10 bg-[#07111f] p-5 md:p-6'>
        <h3 className='font-bold text-lg'>{ru ? 'Голосуют только зарегистрированные граждане' : 'Voting is for registered citizens only'}</h3>
        <p className='text-gray-400 text-sm mt-2 leading-6'>{ru ? 'Укажи ту же платформу и никнейм, которые использовал при регистрации. Email и пароль не нужны.' : 'Enter the same platform and username you used when registering. No email or password is needed.'}</p>
        <div className='grid sm:grid-cols-2 gap-3 mt-5'>
          <label className='block'>
            <span className='block text-xs tracking-wider text-gray-400 mb-2'>{ru ? 'ПЛАТФОРМА' : 'PLATFORM'}</span>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={voted} className='w-full rounded-lg border border-white/15 bg-[#0c1d31] text-white px-4 py-3 outline-none focus:border-yellow-400'>
              <option value='tiktok'>TikTok</option>
              <option value='instagram'>Instagram</option>
            </select>
          </label>
          <label className='block'>
            <span className='block text-xs tracking-wider text-gray-400 mb-2'>{ru ? 'ТВОЙ НИКНЕЙМ' : 'YOUR USERNAME'}</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={voted} placeholder='@username' autoComplete='username' className='w-full rounded-lg border border-white/15 bg-[#0c1d31] text-white px-4 py-3 outline-none focus:border-yellow-400 placeholder:text-gray-500' />
          </label>
        </div>
        <button onClick={submitVote} disabled={submitting || voted || loading || !selected || !username.trim()} className='w-full sm:w-auto mt-5 rounded-lg bg-yellow-400 px-8 py-3 font-bold text-[#07111f] disabled:opacity-40 disabled:cursor-not-allowed'>
          {submitting ? (ru ? 'ОТПРАВКА…' : 'SUBMITTING…') : voted ? (ru ? 'ВЫ УЖЕ ПРОГОЛОСОВАЛИ' : 'YOU HAVE VOTED') : (ru ? 'ПРОГОЛОСОВАТЬ →' : 'CAST YOUR VOTE →')}
        </button>
        {message && <p role='status' className='mt-4 text-sm text-yellow-300'>{message}</p>}
        <p className='mt-4 text-xs leading-5 text-gray-500'>{ru ? 'Важно: сайт проверяет совпадение никнейма с записью гражданина, но не подтверждает владение аккаунтом в TikTok или Instagram. Поэтому нельзя полностью исключить подмену ника.' : 'Note: the site matches the username to a citizen record but does not verify ownership of the TikTok or Instagram account. Username impersonation cannot be fully prevented.'}</p>
      </div>
      <p className='text-center text-xs text-gray-500 mt-5'>{ru ? 'Всего голосов:' : 'Total votes:'} {total}</p>
    </div>
  );
}
