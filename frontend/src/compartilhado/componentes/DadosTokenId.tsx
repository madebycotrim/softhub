import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { criarTabelaClaims } from "../../utilitarios/utilitario-claims";

interface DadosTokenIdProps {
    idTokenClaims: any;
}

/**
 * Exibe as claims (declarações) do Token de ID do MSAL em uma tabela elegante.
 * Utiliza o utilitário robusto inspirado no tutorial final da Microsoft.
 */
export function DadosTokenId({ idTokenClaims }: DadosTokenIdProps) {
    if (!idTokenClaims) return null;

    const claimsProcessadas = criarTabelaClaims(idTokenClaims);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Detalhes da Identidade Microsoft</h4>
                <p className="text-xs text-slate-400">Dados técnicos validados pela plataforma de identidade da Microsoft.</p>
            </div>

            <div className="bg-slate-950/50 border border-white/5 rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-300 font-bold">Claim</TableHead>
                            <TableHead className="text-slate-300 font-bold">Valor</TableHead>
                            <TableHead className="text-slate-300 font-bold hidden sm:table-cell">O que significa?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(Object.values(claimsProcessadas) as [string, string, string][]).map(([nome, valor, descricao], index) => {
                            return (
                                <TableRow key={index} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-mono text-xs text-blue-400">{nome}</TableCell>
                                    <TableCell className="text-xs text-slate-300 break-all">{valor}</TableCell>
                                    <TableCell className="text-[10px] text-slate-500 hidden sm:table-cell leading-tight">{descricao}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <p className="text-[10px] text-slate-500 italic">
                Nota: Alguns valores (como iat e exp) são convertidos de timestamps UNIX para datas legíveis.
            </p>
        </div>
    );
}
