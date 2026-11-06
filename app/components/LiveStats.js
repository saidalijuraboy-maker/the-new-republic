'use client';

import { useEffect, useState } from 'react';
import { rpc } from '../lib/rpc';
import { useLang } from '../lib/i18n';

const GOAL = 1000000;

export default function LiveStats() {
  const { t, lang } = useLang();
  const [pop, setPop] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      rpc('city_population')
        .then((n) => alive && setPop(Number(n)))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const loc = lang === 'ru' ? 'ru-RU' : 'en-US';
  const num = pop === null ? '…' : pop.toLocaleString(loc);
  const pct = pop ? Math.max((pop / GOAL) * 100, 0.6) : 0.6;

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-16 py-12 border-y border-white/10 bg-[#0a1626]'>
      <Stat n={num} t={t('stat.citizens')} />
      <Stat n={num} t={t('stat.homes')} />
      <Stat n='8' t={t('stat.types')} />
      <Stat n='1M' t={t('stat.goal')} />
      <div className='col-span-2 md:col-span-4 mt-2'>
        <div className='h-2 rounded-full bg-white/10 overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-yellow-600 to-yellow-300' style={{ width: pct + '%' }} />
        </div>
        <p className='text-[11px] tracking-widest text-gray-500 mt-2 text-center'>{t('stat.progress')}</p>
      </div>
    </div>
  );
}

function Stat({ n, t }) {
  return (
    <div className='text-center py-3'>
      <p className='text-3xl md:text-4xl text-yellow-400 font-bold'>{n}</p>
      <p className='text-[11px] tracking-widest text-gray-400 mt-2'>{t}</p>
    </div>
  );
}
