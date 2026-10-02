import { redirect } from 'next/navigation';

/** La demo abre directo en el menú. El panel sigue en /dashboard. */
export default function Home() {
  redirect('/menu');
}
