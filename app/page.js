
import {
  Globe2, Shield, Landmark, Vote, Users,
  ArrowRight, Menu, ChevronDown
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="flex items-center justify-between px-6 md:px-16 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full border border-yellow-500 flex items-center justify-center">
            <Globe2 className="text-yellow-400" size={25}/>
          </div>
          <div>
            <h1 className="font-bold tracking-[3px] text-sm">
              THE NEW REPUBLIC
            </h1>
            <p className="text-[9px] tracking-[4px] text-yellow-500">
              UNITY • PROGRESS • FUTURE
            </p>
          </div>
        </div>
        <nav className="hidden md:flex gap-8 text-sm text-gray-300">
          <a href="#about">About</a>
          <a href="#citizens">Citizens</a>
          <a href="#capital">Capital</a>
          <a href="#vote">Voting</a>
        </nav>
        <a href="#join" className="border border-yellow-500 px-5 py-3 text-xs tracking-widest">
          JOIN US
        </a>
      </header>

      <section className="relative min-h-[650px] flex items-center px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#07111f]/90 to-transparent z-10"/>
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=2000)",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="relative z-20 max-w-3xl py-24">
          <p className="text-yellow-400 tracking-[6px] text-xs mb-8">
            A NEW DIGITAL CIVILIZATION
          </p>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            ONE NATION.
            <br/>
            <span className="text-yellow-400">ONE FUTURE.</span>
          </h2>
          <p className="text-gray-300 text-lg mt-8 max-w-xl leading-8">
            We are building a digital republic from zero.
            Its citizens will shape its cities, identity and future.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <a href="/register" className="bg-yellow-500 text-[#07111f] px-8 py-4 font-bold text-sm flex items-center gap-3">
              BECOME A CITIZEN <ArrowRight size={18}/>
            </a>
            <a href="#about" className="border border-white/30 px-8 py-4 text-sm">
              DISCOVER THE REPUBLIC
            </a>
          </div>
        </div>
      </section>

      <section id="citizens" className="grid grid-cols-2 md:grid-cols-4 gap-5 px-6 md:px-16 py-16 border-y border-white/10">
        {[
          ["01","DIGITAL REPUBLIC"],
          ["∞","POSSIBILITIES"],
          ["001","DAY OF BUILDING"],
          ["1M","OUR FIRST GOAL"]
        ].map(([n,t])=>(
          <div key={t} className="text-center py-5">
            <p className="text-4xl text-yellow-400 font-bold">{n}</p>
            <p className="text-xs tracking-widest text-gray-400 mt-3">{t}</p>
          </div>
        ))}
      </section>

      <section id="about" className="px-6 md:px-16 py-24">
        <p className="text-yellow-400 text-xs tracking-[5px]">OUR VISION</p>
        <h2 className="text-4xl md:text-5xl font-bold mt-5">
          BUILT BY THE PEOPLE.
          <br/>SHAPED BY YOUR VOTE.
        </h2>
        <p className="text-gray-400 max-w-2xl mt-7 leading-8">
          This is more than a website. It is a community project
          where every participant can contribute ideas and help
          shape a virtual nation.
        </p>
      </section>

      <section id="capital" className="px-6 md:px-16 py-20 bg-[#0b192a]">
        <Landmark className="text-yellow-400" size={35}/>
        <h2 className="text-4xl font-bold mt-6">THE CAPITAL</h2>
        <p className="text-gray-400 mt-4 max-w-xl">
          Our capital has no name yet. Its name will be chosen
          by the citizens through a public vote.
        </p>
        <p className="text-yellow-400 mt-6 tracking-widest text-sm">
          YOUR CITY. YOUR VOTE.
        </p>
      </section>

      <section id="vote" className="px-6 md:px-16 py-24 text-center">
        <Vote className="mx-auto text-yellow-400" size={42}/>
        <h2 className="text-4xl font-bold mt-6">YOUR VOICE MATTERS</h2>
        <p className="text-gray-400 mt-5">
          The first mission is to build our community.
          The citizens will decide what comes next.
        </p>
        <a href="#join" className="inline-block mt-8 border border-yellow-500 px-8 py-4 text-yellow-400">
          EXPLORE THE REPUBLIC
        </a>
      </section>

      <section id="join" className="px-6 md:px-16 py-24 bg-[#101f32] text-center">
        <Users className="mx-auto text-yellow-400" size={45}/>
        <h2 className="text-4xl md:text-5xl font-bold mt-7">
          BECOME PART OF HISTORY
        </h2>
        <p className="text-gray-400 mt-5">
          One million citizens. One digital republic.
        </p>
        <a href="https://www.tiktok.com/@thenewrepublic.world"
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-9 bg-yellow-500 text-[#07111f] font-bold px-10 py-4">
          JOIN OUR COMMUNITY
        </a>
      </section>

      <footer className="px-6 md:px-16 py-9 border-t border-white/10 flex flex-wrap justify-between gap-5 text-xs text-gray-500">
        <span>© 2026 THE NEW REPUBLIC</span>
        <span>UNITY • PROGRESS • FUTURE</span>
        <span> A DIGITAL COMMUNITY PROJECT </span>
      </footer>
    </main>
  );
}
