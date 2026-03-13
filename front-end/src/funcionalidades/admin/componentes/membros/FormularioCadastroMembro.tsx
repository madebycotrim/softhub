import { memo, useState, FormEvent } from 'react';
import { Mail, Shield, ChevronDown, Loader2 } from 'lucide-react';

interface FormularioCadastroProps {
    aoCadastrar: (email: string, role: string) => Promise<any>;
    aoSucesso: () => void;
    roles: string[];
}

export const FormularioCadastroMembro = memo(({ aoCadastrar, aoSucesso, roles }: FormularioCadastroProps) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(roles[0] || 'MEMBRO');
    const [salvando, setSalvando] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        const res = await aoCadastrar(email, role);
        setSalvando(false);
        if (res.sucesso) aoSucesso();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">E-mail Institucional</label>
                    <div className="relative group/em">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/em:text-primary transition-colors" size={16} />
                        <input
                            required
                            type="email"
                            placeholder="usuario@unieuro.edu.br"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl pl-11 pr-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Cargo Inicial</label>
                    <div className="relative group/sh">
                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/sh:text-primary transition-colors" size={16} />
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl pl-11 pr-10 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all appearance-none cursor-pointer"
                        >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <button
                disabled={salvando}
                className="w-full h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : <span>Finalizar Convite</span>}
            </button>
        </form>
    );
});
