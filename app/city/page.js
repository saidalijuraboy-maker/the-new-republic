'use client';

import { useEffect, useRef, useState } from 'react';
import { rpc, TYPE_EMOJI } from '../lib/rpc';
import { useLang } from '../lib/i18n';
import LangSwitch from '../components/LangSwitch';

export default function CityPage() {
  const { t, lang, date } = useLang();
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const listRef = useRef([]);

  const [population, setPopulation] = useState(null);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timer = null;
    let first = true;

    (async () => {
      try {
        const { createCity } = await import('./engine');
        if (disposed) return;

        const eng = createCity(hostRef.current, {
          onPick: (h) => {
            setSelected(h);
            if (h) history.replaceState(null, '', '#' + h.tiktok_username.replace('@', ''));
          }
        });
        engineRef.current = eng;

        const load = async () => {
          try {
            const [list, pop] = await Promise.all([rpc('get_city', { p_limit: 20000 }), rpc('city_population')]);
            if (disposed) return;
            listRef.current = list;
            eng.setData(list);
            setPopulation(Number(pop));
            setStatus('ok');

            if (first) {
              first = false;
              const tag = decodeURIComponent((window.location.hash || '').replace('#', ''))
                .replace('@', '')
                .toLowerCase();
              if (tag) {
                const found = list.find((x) => x.tiktok_username.replace('@', '') === tag);
                if (found) {
                  eng.select(found);
                  eng.flyTo(found);
                  setSelected(found);
                }
              }
            }
          } catch (e) {
            if (!disposed && first) setStatus('error');
          }
        };

        await load();
        timer = setInterval(load, 30000);
      } catch (e) {
        if (!disposed) setStatus('webgl');
      }
    })();

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      if (engineRef.current) engineRef.current.dispose();
      engineRef.current = null;
    };
  }, []);

  function search(e) {
    e.preventDefault();
    const q = query.trim().replace(/^@/, '').toLowerCase();
    if (!q) return;
    const found = listRef.current.find((x) => x.tiktok_username.replace('@', '') === q);
    if (!found) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setSelected(found);
    engineRef.current?.select(found);
    engineRef.current?.flyTo(found);
  }

  const emoji = selected ? TYPE_EMOJI[selected.house_type] || '🏠' : '';
  const loc = lang === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <div className='fixed inset-0 flex flex-col bg-[#07111f] text-white'>
      <header className='flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10'>
        <a href='/' className='text-yellow-400 text-xs tracking-widest'>{t('city.back')}</a>
        <div className='flex items-center gap-3'>
          <div className='text-xs tracking-widest text-gray-300'>
            🏠 {population === null ? '…' : population.toLocaleString(loc)}
          </div>
          <LangSwitch />
        </div>
      </header>

      <form onSubmit={search} className='flex gap-2 px-4 py-3 border-b border-white/10'>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setNotFound(false);
          }}
          placeholder={t('city.search')}
          className='flex-1 bg-[#0c1d31] border border-white/15 rounded-lg px-3 py-2 text-sm outline-none'
        />
        <button className='bg-yellow-500 text-[#07111f] font-bold text-xs px-4 rounded-lg'>{t('city.find')}</button>
      </form>
      {notFound && <p className='text-red-300 text-xs px-4 pt-2'>{t('city.nf')}</p>}

      <div className='relative flex-1 overflow-hidden'>
        <div ref={hostRef} className='absolute inset-0' />

        {status === 'loading' && (
          <div className='absolute inset-0 flex items-center justify-center text-gray-300 text-sm bg-[#07111f]/70 pointer-events-none'>
            {t('city.loading')}
          </div>
        )}
        {status === 'error' && (
          <div className='absolute inset-0 flex items-center justify-center text-red-300 text-sm px-8 text-center bg-[#07111f]/80'>
            {t('city.err')}
          </div>
        )}
        {status === 'webgl' && (
          <div className='absolute inset-0 flex items-center justify-center text-yellow-200 text-sm px-8 text-center bg-[#07111f]'>
            {t('city.webgl')}
          </div>
        )}

        <div className='absolute right-3 top-3 flex flex-col gap-2'>
          <button onClick={() => engineRef.current?.zoom(1.35)} className='w-10 h-10 rounded-lg bg-[#0c1d31]/90 border border-white/15 text-xl'>+</button>
          <button onClick={() => engineRef.current?.zoom(1 / 1.35)} className='w-10 h-10 rounded-lg bg-[#0c1d31]/90 border border-white/15 text-xl'>−</button>
        </div>

        {!selected && status === 'ok' && (
          <p className='absolute left-0 right-0 bottom-3 text-center text-[11px] text-white/90 pointer-events-none'>
            {t('city.tip')}
          </p>
        )}

        {selected && (
          <div className='absolute left-3 right-3 bottom-3 max-w-md mx-auto rounded-2xl bg-[#0c1d31]/95 border border-yellow-600/60 p-4'>
            <div className='flex items-center gap-3'>
              <div className='text-4xl'>{emoji}</div>
              <div className='min-w-0 flex-1'>
                <p className='font-bold truncate'>{selected.tiktok_username}</p>
                <p className='text-xs text-yellow-400 tracking-widest'>{selected.citizen_id}</p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  engineRef.current?.select(null);
                }}
                className='text-gray-400 text-xl px-2'
              >
                ×
              </button>
            </div>
            <div className='grid grid-cols-3 gap-2 mt-3 text-center text-[11px]'>
              <div className='bg-white/5 rounded-lg py-2'>
                <p className='text-gray-400'>{t('city.role')}</p>
                <p className='font-bold mt-1'>{t('role.' + selected.role)}</p>
              </div>
              <div className='bg-white/5 rounded-lg py-2'>
                <p className='text-gray-400'>{t('city.building')}</p>
                <p className='font-bold mt-1'>{t('type.' + selected.house_type)}</p>
              </div>
              <div className='bg-white/5 rounded-lg py-2'>
                <p className='text-gray-400'>{t('city.since')}</p>
                <p className='font-bold mt-1'>{date(selected.joined_at)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
