export function authErrorMessage(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("email not confirmed") || t.includes("email_not_confirmed")) {
    return "Confirme seu e-mail para entrar. Olhe a caixa de entrada (e o spam).";
  }
  if (t.includes("invalid login") || t.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (t.includes("user already registered")) {
    return "Este e-mail já tem conta. Entre ou recupere a senha.";
  }
  return raw;
}
