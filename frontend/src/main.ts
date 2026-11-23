import './style.css';
import { login } from './api';

const form = document.querySelector<HTMLFormElement>('#login')!;
const msg = document.querySelector<HTMLParagraphElement>('#msg')!;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  try {
    const { token, usuario } = await login(String(data.get('email')), String(data.get('senha')));
    localStorage.setItem('token', token);
    msg.className = 'text-center text-sm text-green-600';
    msg.textContent = `Bem-vindo, ${usuario.nome}!`;
  } catch (err) {
    msg.className = 'text-center text-sm text-red-600';
    msg.textContent = (err as Error).message;
  }
});
