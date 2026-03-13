import { memo, useState, FormEvent } from 'react';
import { Mail, Shield, ChevronDown, Loader2 } from 'lucide-react';

interface FormularioCadastroProps {
    modoInicial?: 'individual' | 'lote';
    aoCadastrar: (email: string, role: string) => Promise<any>;
    aoCadastrarLote?: (emails: string[], role: string) => Promise<any>;
    aoSucesso: () => void;
    roles: string[];
}

export const FormularioCadastroMembro = memo(({ modoInicial = 'individual', aoCadastrar, aoCadastrarLote, aoSucesso, roles }: FormularioCadastroProps) => {
    const [modo, setModo] = useState<'individual' | 'lote'>(modoInicial);
    const [email, setEmail] = useState('');
    const [listaEmails, setListaEmails] = useState('');
    const [role, setRole] = useState(roles[0] || 'MEMBRO');
    const [salvando, setSalvando] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        
        let res;
        if (modo === 'individual') {
            res = await aoCadastrar(email, role);
        } else {
            const emails = listaEmails
                .split(/[\n,;]/)
                .map(e => e.trim())
                .filter(e => e.length > 5 && e.includes('@'));
            
            if (aoCadastrarLote) {
                res = await aoCadastrarLote(emails, role);
            } else {
                // Fallback caso não tenha a função (não deve ocorrer se tipado certo)
                res = { sucesso: false, erro: 'Função de lote não disponível' };
            }
        }

        setSalvando(false);
        if (res.sucesso) aoSucesso();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/40">
                <button
                    type="button"
                    onClick={() => setModo('individual')}
                    className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'individual' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50'}`}
                >
                    Individual
                </button>
                <button
                    type="button"
                    onClick={() => setModo('lote')}
                    className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'lote' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50'}`}
                >
                    Em Lote
                </button>
            </div>

            <div className="space-y-4">
                {modo === 'individual' ? (
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
                ) : (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Lista de E-mails</label>
                        <textarea
                            required
                            placeholder="Cole os e-mails separados por linha, vírgula ou ponto e vírgula..."
                            value={listaEmails}
                            onChange={e => setListaEmails(e.target.value)}
                            className="w-full h-32 bg-muted/40 border border-border/40 rounded-xl p-4 text-[11px] font-medium outline-none focus:bg-background focus:border-primary/30 transition-all resize-none custom-scrollbar"
                        />
                        <p className="text-[9px] text-muted-foreground/40 ml-1 font-medium">Ex: joao@unieuro.com.br; maria@unieuro.com.br</p>
                    </div>
                )}

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
                className="w-full h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
            >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : <span>{modo === 'individual' ? 'Finalizar Convite' : 'Autorizar Lote'}</span>}
            </button>
        </form>
    );
});
