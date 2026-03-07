export interface AzureAdClaims {
    oid: string;  // ID único e imutável do usuário no Azure AD
    upn?: string;  // User Principal Name (email institucional)
    preferred_username?: string;  // Fallback do email
    name?: string;  // Nome para exibição
    tid: string;  // Tenant ID
    aud: string;  // Audience (deve ser nosso clientId)
    iss: string;  // Issuer (deve ser nosso tenant v2.0)
    exp: number;
    iat: number;
}

// ── JWKS URI do Azure AD ──────────────────────────────────────────────────────
export function getJwksUri(tenantId: string): string {
    return `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
}

// ── Validação das claims de negócio ───────────────────────────────────────────
export function validarClaims(
    payload: AzureAdClaims,
    tenantId: string,
    clientId: string,
    dominioInstitucional: string,
): string | null {
    // 1. Tenant
    if (payload.tid !== tenantId) {
        return `Tenant não autorizado: ${payload.tid}`;
    }

    // 2. Audience
    const audiencesValidas = [clientId, `api://${clientId}`];
    if (!audiencesValidas.includes(payload.aud)) {
        return `Audience inválido: ${payload.aud}`;
    }

    // 3. Issuer
    const issuerEsperado = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    if (payload.iss !== issuerEsperado) {
        return `Issuer inválido: ${payload.iss}`;
    }

    // 4. Expiração
    const agora = Math.floor(Date.now() / 1000);
    if (payload.exp < agora) {
        return 'Token expirado';
    }

    // 5. Domínio institucional
    const email = (payload.upn || payload.preferred_username || '').toLowerCase();
    const dominiosValidos = [`@${dominioInstitucional}`, '@unieuro.com.br'];
    if (!dominiosValidos.some(d => email.endsWith(d))) {
        return `Domínio não autorizado: ${email}`;
    }

    return null;
}
