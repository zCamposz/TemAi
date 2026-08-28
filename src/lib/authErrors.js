/** Traduz mensagens comuns do Supabase Auth para português. */
export function getAuthErrorMessage(error) {
  if (!error?.message) return "Ocorreu um erro inesperado. Tente novamente.";

  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (msg.includes("user already registered")) {
    return "Este e-mail já está cadastrado.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (msg.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (msg.includes("unable to validate email")) {
    return "Informe um e-mail válido.";
  }
  if (msg.includes("signup is disabled")) {
    return "Novos cadastros estão temporariamente desativados.";
  }

  return error.message;
}

/** Gera iniciais a partir do nome (ex.: "Maria Silva" → "MS"). */
export function getInitials(nome) {
  return (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}
