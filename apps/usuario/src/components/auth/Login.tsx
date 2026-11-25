import React, { useState } from 'react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = () => {
  const [logoError, setLogoError] = useState(false);

  const logoUrl =
    typeof window !== 'undefined'
      ? window.puertoConfig?.logoUrl || window.PuertoConfig?.logoUrl
      : undefined;

  const handleGoogleLogin = () => {
    // Nextend Social Login establece la sesión de WordPress tras el OAuth.
    // Al regresar, WordPress habrá fijado la cookie; recargamos para que
    // el shortcode re-inyecte PuertoConfig con isLoggedIn=true.
    window.location.href = 'https://balsasanaliticas.com/wp-login.php?loginSocial=google&redirect=https%3A%2F%2Fbalsasanaliticas.com%2Fpuerto-analitico%2Fagendar%2F';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-lg border border-slate-800 overflow-hidden mb-4">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="Puerto Analítico"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              'PA'
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Puerto Analítico</h1>
          <p className="text-sm text-slate-500 mt-1">Portal de Terapeutas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-500 text-center mb-5">
            Accede con tu cuenta de Google para continuar
          </p>

          {/* Botón Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3 px-4 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {/* SVG oficial del logo de Google */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Iniciar sesión con Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Puerto Analítico
        </p>
      </div>
    </div>
  );
};

export default Login;
