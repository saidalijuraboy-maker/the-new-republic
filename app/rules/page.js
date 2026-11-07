'use client';

import { ShieldCheck, UserPlus, Lightbulb, Heart, Vote, HardHat, ArrowLeft, Globe2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import LangSwitch from '../components/LangSwitch';

const COPY = {
  en: {
    eyebrow: 'THE NEW REPUBLIC • COMMUNITY GUIDELINES',
    title: 'YOUR VOICE BUILDS OUR NATION',
    intro: 'A digital republic shaped by its citizens. Read how to join, share ideas and help decide what we build next.',
    steps: [
      ['BECOME A CITIZEN', 'Follow our official account and register on the website. Every approved citizen receives a unique digital passport and one virtual home.'],
      ['SHARE YOUR IDEA', 'Comment on our Reels or posts with the building, place or facility you would like to see in the republic.'],
      ['GET COMMUNITY SUPPORT', 'Support ideas from other citizens. Suggestions receiving more likes may receive priority consideration.'],
      ['VOTE FOR THE FUTURE', 'Take part in official polls on our website. Voting helps the community choose development priorities.'],
      ['BUILD WITH US', 'We review suggestions, check registration and consider available space and feasibility before adding a project to the city.']
    ],
    important: 'IMPORTANT RULES',
    rules: [
      'One person should use one citizen account and receive one virtual home.',
      'Duplicate registrations, fake accounts and manipulated votes are not eligible.',
      'Likes and votes help set priorities but do not guarantee construction.',
      'Not every suggestion will be built. Final decisions are made by the project administration.',
      'Respect other citizens. Spam, harassment, impersonation and inappropriate content are not allowed.',
      'Virtual homes and passports are digital project features, not real property or legal citizenship.'
    ],
    process: 'HOW IDEAS ARE SELECTED',
    processText: 'We consider community support, the project’s goals, available city space and practical feasibility. The most popular idea may be reviewed first, but the administration confirms what can actually be built.',
    closing: 'SUGGEST. SUPPORT. VOTE. BUILD OUR FUTURE.',
    back: 'BACK TO THE REPUBLIC'
  },
  ru: {
    eyebrow: 'THE NEW REPUBLIC • ПРАВИЛА СООБЩЕСТВА',
    title: 'ТВОЙ ГОЛОС СТРОИТ НАШУ РЕСПУБЛИКУ',
    intro: 'Цифровая республика, которую создают её граждане. Узнай, как вступить, предлагать идеи и решать, что мы построим дальше.',
    steps: [
      ['СТАНЬ ГРАЖДАНИНОМ', 'Подпишись на наш официальный аккаунт и зарегистрируйся на сайте. Каждый одобренный гражданин получает уникальный цифровой паспорт и один виртуальный дом.'],
      ['ПРЕДЛОЖИ ИДЕЮ', 'Напиши в комментариях к Reels или публикациям, какое здание, место или объект ты хочешь видеть в республике.'],
      ['ПОЛУЧИ ПОДДЕРЖКУ', 'Поддерживай идеи других граждан. Предложения с большим количеством лайков могут получить приоритет при рассмотрении.'],
      ['ГОЛОСУЙ ЗА БУДУЩЕЕ', 'Участвуй в официальных голосованиях на нашем сайте. Голоса помогают жителям выбирать приоритеты развития.'],
      ['СТРОЙ ВМЕСТЕ С НАМИ', 'Мы проверяем предложения, регистрацию автора, наличие свободного места и возможность реализации проекта.']
    ],
    important: 'ВАЖНЫЕ ПРАВИЛА',
    rules: [
      'Один человек использует одну учётную запись гражданина и получает один виртуальный дом.',
      'Повторные регистрации, фальшивые аккаунты и накрутка голосов не допускаются.',
      'Лайки и голоса помогают определить приоритеты, но не гарантируют строительство.',
      'Мы не обязаны реализовывать каждое предложение. Окончательное решение принимает администрация проекта.',
      'Уважай других граждан. Спам, травля, выдача себя за другого человека и неприемлемый контент запрещены.',
      'Виртуальные дома и паспорта — элементы цифрового проекта, а не реальная недвижимость или юридическое гражданство.'
    ],
    process: 'КАК ВЫБИРАЮТСЯ ИДЕИ',
    processText: 'Мы учитываем поддержку сообщества, цели проекта, свободное место в городе и практическую возможность реализации. Самая популярная идея может быть рассмотрена первой, но администрация подтверждает, что действительно можно построить.',
    closing: 'ПРЕДЛАГАЙ. ПОДДЕРЖИВАЙ. ГОЛОСУЙ. СТРОЙ НАШЕ БУДУЩЕЕ.',
    back: 'НАЗАД В РЕСПУБЛИКУ'
  }
};

const ICONS = [UserPlus, Lightbulb, Heart, Vote, HardHat];

export default function RulesPage() {
  const { lang } = useLang();
  const c = COPY[lang] || COPY.en;
  return (
    <main className='min-h-screen bg-[#07111f] text-white'>
      <header className='sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-[#07111f]/90 px-4 py-4 backdrop-blur md:px-16'>
        <a href='/' className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full border border-yellow-500'><Globe2 className='text-yellow-400' size={22} /></div>
          <div><div className='text-sm font-bold tracking-[3px]'>THE NEW REPUBLIC</div><div className='text-[9px] tracking-[4px] text-yellow-500'>UNITY • PROGRESS • FUTURE</div></div>
        </a>
        <LangSwitch />
      </header>
      <section className='relative overflow-hidden px-6 py-20 md:px-16 md:py-28'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,#1d4468_0%,#07111f_62%)]' />
        <div className='relative mx-auto max-w-5xl'>
          <p className='text-xs tracking-[5px] text-yellow-400'>{c.eyebrow}</p>
          <h1 className='mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl'>{c.title}</h1>
          <p className='mt-6 max-w-2xl text-base leading-8 text-gray-300 md:text-lg'>{c.intro}</p>
          <div className='mt-14 grid gap-4 md:grid-cols-2'>
            {c.steps.map(([title, desc], i) => {
              const Icon = ICONS[i];
              return <article key={title} className='rounded-2xl border border-white/10 bg-[#0c1d31]/90 p-6 md:p-7'>
                <div className='flex items-center justify-between'><Icon className='text-yellow-400' size={30} /><span className='text-3xl font-bold text-white/15'>0{i + 1}</span></div>
                <h2 className='mt-6 text-lg font-bold tracking-wide'>{title}</h2>
                <p className='mt-3 text-sm leading-7 text-gray-300'>{desc}</p>
              </article>;
            })}
          </div>
        </div>
      </section>
      <section className='px-6 pb-16 md:px-16'>
        <div className='mx-auto max-w-5xl rounded-2xl border border-yellow-500/40 bg-[#0c1d31] p-6 md:p-10'>
          <div className='flex items-center gap-3'><ShieldCheck className='text-yellow-400' size={28} /><h2 className='text-xl font-bold text-yellow-400'>{c.important}</h2></div>
          <ul className='mt-6 space-y-4'>{c.rules.map((rule, i) => <li key={i} className='flex gap-3 text-sm leading-7 text-gray-200'><span className='mt-1 text-yellow-400'>•</span><span>{rule}</span></li>)}</ul>
        </div>
        <div className='mx-auto mt-6 max-w-5xl rounded-2xl border border-white/10 bg-[#0c1d31]/70 p-6 md:p-8'>
          <h2 className='text-lg font-bold'>{c.process}</h2><p className='mt-3 text-sm leading-7 text-gray-300'>{c.processText}</p>
        </div>
      </section>
      <section className='px-6 pb-20 text-center md:px-16'>
        <p className='mx-auto max-w-4xl text-xl font-bold tracking-[2px] text-yellow-400 md:text-2xl'>{c.closing}</p>
        <a href='/' className='mt-8 inline-flex items-center gap-2 rounded border border-white/20 px-6 py-3 text-xs font-bold tracking-widest hover:border-yellow-400 hover:text-yellow-400'><ArrowLeft size={16} /> {c.back}</a>
      </section>
      <footer className='border-t border-white/10 px-6 py-8 text-center text-xs text-gray-500'>© 2026 THE NEW REPUBLIC • DIGITAL COMMUNITY PROJECT</footer>
    </main>
  );
}
