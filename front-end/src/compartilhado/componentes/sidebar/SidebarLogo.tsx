import { memo } from 'react';
import logoUnieuro from '@/assets/logo-unieuro.png';
import { SeletorProjetoGlobal } from '../SeletorProjetoGlobal';

export const SidebarLogo = memo(() => {
    return (
        <>
            <div className="h-16 flex items-center px-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3.5 w-full">
                    <img src={logoUnieuro} alt="Unieuro" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-[18px] font-black text-sidebar-foreground tracking-tight truncate">
                            Fábrica de Software
                        </span>
                        <span className="text-[12px] text-primary/50 uppercase tracking-[0.25em] font-black mt-0.5">
                            SoftHub
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 shrink-0 relative z-10">
                <SeletorProjetoGlobal />
            </div>
        </>
    );
});
