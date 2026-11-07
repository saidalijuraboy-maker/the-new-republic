'use client';

import { Globe2, Landmark, Vote, Users, ArrowRight, UserPlus, IdCard, Home as HomeIcon } from 'lucide-react';
import LiveStats from './components/LiveStats';
import LangSwitch from './components/LangSwitch';
import { useLang, TIKTOK_URL, INSTAGRAM_URL } from './lib/i18n';
import { TYPE_EMOJI } from './lib/rpc';

const ROLE_LIST = [
  ['👑', 'mayor'],
  ['🛍️', 'merchant'],
  ['🏦', 'banker'],
  ['🌾', 'farmer'],
  ['🔨', 'builder'],
  ['🛡️', 'police']
];

export default function Home() {
  const { t } = useLang();

  return (
    <main className='min-h-screen bg-[#07111f] text-white'>
      <header className='sticky top-0 z-50 backdrop-blur bg-[#07111f]/85 flex items-center justify-between gap-3 px-4 md:px-16 py-4 border-b border-white/10'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 rounded-full border border-yellow-500 flex items-center justify-center'>
            <Globe2 className='text-yellow-400' size={22} />
          </div>
          <div>
            <h1 className='font-bold tracking-[3px] text-sm'>THE NEW REPUBLIC</h1>
            <p className='text-[9px] tracking-[4px] text-yellow-500'>UNITY • PROGRESS • FUTURE</p>
          </div>
        </div>
        <nav className='hidden md:flex gap-8 text-sm text-gray-300'>
          <a href='#how'>{t('nav.how')}</a>
          <a href='/city'>{t('nav.city')}</a>
          <a href='#roles'>{t('nav.roles')}</a>
          <a href='/city'>{t('nav.vote')}</a>
          <a href='/rules'>{t('nav.rules')}</a>
        </nav>
        <div className='flex items-center gap-3'>
          <LangSwitch />
          <a href='/register' className='hidden sm:block bg-yellow-500 text-[#07111f] font-bold px-5 py-3 text-xs tracking-widest rounded'>
            {t('btn.join')}
          </a>
        </div>
      </header>

      <section className='relative min-h-[620px] flex items-center px-6 md:px-16 overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,#1d4468_0%,#07111f_60%)]' />
        <div
          className='absolute inset-0 opacity-[.07]'
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '46px 46px'
          }}
        />
        <div className='relative z-10 max-w-3xl py-24'>
          <p className='text-yellow-400 tracking-[6px] text-xs mb-8'>{t('hero.eyebrow')}</p>
          <h2 className='text-5xl md:text-7xl font-bold leading-tight'>
            {t('hero.l1')}
            <br />
            <span className='text-yellow-400'>{t('hero.l2')}</span>
          </h2>
          <p className='text-gray-300 text-lg mt-8 max-w-xl leading-8'>{t('hero.sub')}</p>
          <div className='flex flex-wrap gap-4 mt-10'>
            <a href='/register' className='bg-yellow-500 text-[#07111f] px-8 py-4 font-bold text-sm flex items-center gap-3 rounded'>
              {t('hero.cta1')} <ArrowRight size={18} />
            </a>
            <a href='/city' className='border border-white/30 px-8 py-4 text-sm rounded'>
              {t('hero.cta2')}
            </a>
          </div>
        </div>
      </section>

      <LiveStats />

      <section id='how' className='px-6 md:px-16 py-24'>
        <p className='text-yellow-400 text-xs tracking-[5px]'>{t('how.eyebrow')}</p>
        <h2 className='text-3xl md:text-5xl font-bold mt-5'>{t('how.title')}</h2>
        <div className='grid md:grid-cols-3 gap-5 mt-12'>
          {[
            [UserPlus, '01', 'how.1t', 'how.1d'],
            [IdCard, '02', 'how.2t', 'how.2d'],
            [HomeIcon, '03', 'how.3t', 'how.3d']
          ].map(([Icon, n, tk, dk]) => (
            <div key={n} className='rounded-2xl border border-white/10 bg-[#0c1d31] p-7'>
              <div className='flex items-center justify-between'>
                <Icon className='text-yellow-400' size={30} />
                <span className='text-4xl font-bold text-white/10'>{n}</span>
              </div>
              <h3 className='text-xl font-bold mt-6'>{t(tk)}</h3>
              <p className='text-gray-400 mt-3 leading-7 text-sm'>{t(dk)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='px-6 md:px-16 py-20 bg-[#0b192a]'>
        <Landmark className='text-yellow-400' size={34} />
        <h2 className='text-3xl md:text-5xl font-bold mt-6'>{t('map.title')}</h2>
        <p className='text-gray-400 mt-4 max-w-xl leading-7'>{t('map.desc')}</p>
        <div className='flex flex-wrap gap-3 mt-8'>
          {Object.keys(TYPE_EMOJI).map((k) => (
            <span key={k} className='px-4 py-2 rounded-full border border-white/15 bg-white/5 text-sm'>
              {TYPE_EMOJI[k]} {t('type.' + k)}
            </span>
          ))}
        </div>
        <a href='/city' className='inline-block mt-9 bg-yellow-500 text-[#07111f] font-bold px-9 py-4 rounded'>
          {t('map.cta')}
        </a>
      </section>

      <section id='roles' className='px-6 md:px-16 py-24'>
        <p className='text-yellow-400 text-xs tracking-[5px]'>{t('roles.eyebrow')}</p>
        <h2 className='text-3xl md:text-5xl font-bold mt-5'>{t('roles.title')}</h2>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-12'>
          {ROLE_LIST.map(([e, k]) => (
            <div key={k} className='rounded-2xl border border-white/10 bg-[#0c1d31] p-5'>
              <div className='text-3xl'>{e}</div>
              <h3 className='font-bold mt-4'>{t('role.' + k)}</h3>
              <p className='text-gray-400 text-xs mt-2 leading-5'>{t('role.' + k + '.d')}</p>
            </div>
          ))}
        </div>
      </section>

      <section id='join' className='px-6 md:px-16 py-24 bg-[#101f32] text-center'>
        <Users className='mx-auto text-yellow-400' size={45} />
        <h2 className='text-3xl md:text-5xl font-bold mt-7'>{t('join.title')}</h2>
        <p className='text-gray-400 mt-5'>{t('join.sub')}</p>
        <div className='flex flex-wrap justify-center gap-4 mt-9'>
          <a href='/register' className='bg-yellow-500 text-[#07111f] font-bold px-10 py-4 rounded'>
            {t('join.cta')}
          </a>
          <a href={TIKTOK_URL} target='_blank' rel='noreferrer' className='border border-white/30 px-8 py-4 rounded'>
            🎵 {t('join.tt')}
          </a>
          <a href={INSTAGRAM_URL} target='_blank' rel='noreferrer' className='border border-white/30 px-8 py-4 rounded'>
            📸 {t('join.ig')}
          </a>
        </div>
      </section>

      <footer className='px-6 md:px-16 py-9 border-t border-white/10 flex flex-wrap justify-between gap-5 text-xs text-gray-500'>
        <span>© 2026 THE NEW REPUBLIC</span>
        <span>UNITY • PROGRESS • FUTURE</span>
        <a href='/rules' className='hover:text-yellow-400'>{t('nav.rules')}</a>
        <span>{t('footer.3')}</span>
      </footer>
    </main>
  );
}
