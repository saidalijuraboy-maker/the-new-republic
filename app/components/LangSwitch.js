'use client';

import { useLang } from '../lib/i18n';

export default function LangSwitch() {
  const { lang, setLang } = useLang();
  const on = 'px-2.5 py-1 text-[11px] font-bold tracking-widest bg-yellow-500 text-[#07111f]';
  const off = 'px-2.5 py-1 text-[11px] font-bold tracking-widest text-gray-300';
  return (
    <div className='inline-flex border border-white/25 rounded-md overflow-hidden'>
      <button type='button' onClick={() => setLang('en')} className={lang === 'en' ? on : off}>EN</button>
      <button type='button' onClick={() => setLang('ru')} className={lang === 'ru' ? on : off}>RU</button>
    </div>
  );
}
