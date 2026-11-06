import {
  Globe2, Landmark, Vote, Users, ArrowRight, UserPlus, IdCard, Home as HomeIcon
} from "lucide-react";
import LiveStats from "./components/LiveStats";

const BUILDINGS = [
  ["🏠", "Дом"], ["🏡", "Вилла"], ["🏪", "Магазин"], ["☕", "Кафе"],
  ["🏦", "Банк"], ["🏢", "Небоскрёб"], ["🌾", "Ферма"], ["🌳", "Парк"]
];

const ROLES = [
  ["👑", "Мэр", "Управляет городом и голосует за законы"],
  ["🛍️", "Торговец", "Открывает магазины и кафе"],
  ["🏦", "Банкир", "Хранит богатство республики"],
  ["🌾", "Фермер", "Кормит весь город"],
  ["🔨", "Строитель", "Строит новые районы"],
  ["🛡️", "Полицейский", "Следит за порядком"]
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="sticky top-0 z-50 backdrop-blur bg-[#07111f]/85 flex items-center justify-between px-6 md:px-16 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-yellow-500 flex items-center justify-center">
            <Globe2 className="text-yellow-400" size={22} />
          </div>
          <div>
            <h1 className="font-bold tracking-[3px] text-sm">THE NEW REPUBLIC</h1>
            <p className="text-[9px] tracking-[4px] text-yellow-500">UNITY • PROGRESS • FUTURE</p>
          </div>
        </div>
        <nav className="hidden md:flex gap-8 text-sm text-gray-300">
          <a href="#how">Как это работает</a>
          <a href="/city">Город</a>
          <a href="#roles">Роли</a>
          <a href="#vote">Голосование</a>
        </nav>
        <a href="/register" className="bg-yellow-500 text-[#07111f] font-bold px-5 py-3 text-xs tracking-widest rounded">
          СТАТЬ ГРАЖДАНИНОМ
        </a>
      </header>

      <section className="relative min-h-[620px] flex items-center px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,#1d4468_0%,#07111f_60%)]" />
        <div className="absolute inset-0 opacity-[.07]" style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "46px 46px"
        }} />
        <div className="relative z-10 max-w-3xl py-24">
          <p className="text-yellow-400 tracking-[6px] text-xs mb-8">ЦИФРОВАЯ ЦИВИЛИЗАЦИЯ</p>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            1 ПОДПИСЧИК
            <br />
            <span className="text-yellow-400">= 1 ДОМ.</span>
          </h2>
          <p className="text-gray-300 text-lg mt-8 max-w-xl leading-8">
            Мы строим цифровую республику с нуля. Каждый гражданин получает паспорт,
            собственный дом и роль в городе, где можно всё.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <a href="/register" className="bg-yellow-500 text-[#07111f] px-8 py-4 font-bold text-sm flex items-center gap-3 rounded">
              ПОЛУЧИТЬ ПАСПОРТ И ДОМ <ArrowRight size={18} />
            </a>
            <a href="/city" className="border border-white/30 px-8 py-4 text-sm rounded">
              СМОТРЕТЬ ГОРОД
            </a>
          </div>
        </div>
      </section>

      <LiveStats />

      <section id="how" className="px-6 md:px-16 py-24">
        <p className="text-yellow-400 text-xs tracking-[5px]">КАК ЭТО РАБОТАЕТ</p>
        <h2 className="text-3xl md:text-5xl font-bold mt-5">ТРИ ШАГА ДО СВОЕГО ДОМА</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            [UserPlus, "01", "Регистрация", "Введи свой TikTok-ник на странице регистрации."],
            [IdCard, "02", "Паспорт", "Получи цифровой паспорт с номером гражданина и датой вступления."],
            [HomeIcon, "03", "Дом", "Твой дом появляется в городе автоматически на свободном участке."]
          ].map(([Icon, n, t, d]) => (
            <div key={n} className="rounded-2xl border border-white/10 bg-[#0c1d31] p-7">
              <div className="flex items-center justify-between">
                <Icon className="text-yellow-400" size={30} />
                <span className="text-4xl font-bold text-white/10">{n}</span>
              </div>
              <h3 className="text-xl font-bold mt-6">{t}</h3>
              <p className="text-gray-400 mt-3 leading-7 text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-16 py-20 bg-[#0b192a]">
        <Landmark className="text-yellow-400" size={34} />
        <h2 className="text-3xl md:text-5xl font-bold mt-6">ЖИВАЯ КАРТА ГОРОДА</h2>
        <p className="text-gray-400 mt-4 max-w-xl leading-7">
          Улицы, кварталы и тысячи домов. Найди свой дом по нику и посмотри, кто твои соседи.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          {BUILDINGS.map(([e, t]) => (
            <span key={t} className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-sm">
              {e} {t}
            </span>
          ))}
        </div>
        <a href="/city" className="inline-block mt-9 bg-yellow-500 text-[#07111f] font-bold px-9 py-4 rounded">
          ОТКРЫТЬ КАРТУ →
        </a>
      </section>

      <section id="roles" className="px-6 md:px-16 py-24">
        <p className="text-yellow-400 text-xs tracking-[5px]">РОЛИ</p>
        <h2 className="text-3xl md:text-5xl font-bold mt-5">КЕМ ТЫ БУДЕШЬ В ГОРОДЕ?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
          {ROLES.map(([e, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-[#0c1d31] p-5">
              <div className="text-3xl">{e}</div>
              <h3 className="font-bold mt-4">{t}</h3>
              <p className="text-gray-400 text-xs mt-2 leading-5">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="vote" className="px-6 md:px-16 py-24 text-center bg-[#0b192a]">
        <Vote className="mx-auto text-yellow-400" size={42} />
        <h2 className="text-3xl md:text-5xl font-bold mt-6">ТВОЙ ГОЛОС ВАЖЕН</h2>
        <p className="text-gray-400 mt-5 max-w-lg mx-auto leading-7">
          Название столицы, мэр и законы республики будут выбраны голосованием граждан.
        </p>
      </section>

      <section id="join" className="px-6 md:px-16 py-24 bg-[#101f32] text-center">
        <Users className="mx-auto text-yellow-400" size={45} />
        <h2 className="text-3xl md:text-5xl font-bold mt-7">СТАНЬ ЧАСТЬЮ ИСТОРИИ</h2>
        <p className="text-gray-400 mt-5">Миллион граждан. Одна цифровая республика.</p>
        <div className="flex flex-wrap justify-center gap-4 mt-9">
          <a href="/register" className="bg-yellow-500 text-[#07111f] font-bold px-10 py-4 rounded">
            ПОЛУЧИТЬ ПАСПОРТ
          </a>
          <a href="https://www.tiktok.com/@thenewrepublic.world" target="_blank" rel="noreferrer"
            className="border border-white/30 px-10 py-4 rounded">
            НАШ TIKTOK
          </a>
        </div>
      </section>

      <footer className="px-6 md:px-16 py-9 border-t border-white/10 flex flex-wrap justify-between gap-5 text-xs text-gray-500">
        <span>© 2026 THE NEW REPUBLIC</span>
        <span>UNITY • PROGRESS • FUTURE</span>
        <span>ЦИФРОВОЙ СООБЩЕСТВЕННЫЙ ПРОЕКТ</span>
      </footer>
    </main>
  );
}
