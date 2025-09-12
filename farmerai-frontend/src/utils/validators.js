export const emailValid = (email) => /\S+@\S+\.\S+/.test(email);
export const passwordValid = (password) => password && password.length >= 6;
