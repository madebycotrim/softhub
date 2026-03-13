import { memo } from 'react';
import { Globe, Code } from 'lucide-react';
import logoUnieuro from '@/assets/logo-unieuro-branca.png';

export const LadoEsquerdoInstitucional = memo(() => {
    return (
        <div className="lg:w-[42%] bg-[#001a33] p-8 pt-12 pb-14 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden group shrink-0">
            {/* Background Sólido para Minimalismo */}
            <div className="absolute inset-0 z-0 bg-[#001a33]" />

            <div className="relative z-10 space-y-12 lg:space-y-16 animar-entrada atraso-1">
                <div className="flex items-center gap-5">
                    <img src={logoUnieuro} alt="Logo Unieuro" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
                    <div className="space-y-1.5">
                        <h1 className="text-xl lg:text-[24px] font-[900] leading-none tracking-tight">FÁBRICA DE SOFTWARE</h1>
                        <div className="inline-flex items-center px-2 py-0.5 bg-red-600/20 rounded-2xl border border-red-500/20">
                            <span className="text-[10px] lg:text-[11px] tracking-[0.3em] text-red-500 font-black uppercase">SoftHub</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:space-y-10">
                    <h2 className="text-[42px] lg:text-[72px] font-[900] leading-[0.95] lg:leading-[0.9] tracking-tighter mix-blend-difference">
                        Sua Ideia, <br />
                        <span className="text-white/30 group-hover:text-white/50 transition-colors duration-1000">Nosso Código.</span>
                    </h2>
                    <p className="text-white/60 text-sm lg:text-[18px] leading-relaxed max-w-xs lg:max-w-md font-medium">
                        Transformamos o conhecimento acadêmico em soluções tecnológicas de alto impacto.
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-16 lg:w-24 bg-red-600 rounded-full" />
                        <div className="h-1.5 w-6 bg-white/20 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="mt-8 lg:mt-0 relative z-10 hidden sm:block">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-2xl border border-white/10">
                            <Globe size={14} className="opacity-40" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">Campus Águas Claras</span>
                    </div>
                    <div className="p-2 bg-white/5 rounded-2xl border border-white/10">
                        <Code size={16} className="text-red-100/20" />
                    </div>
                </div>
            </div>
        </div>
    );
});
