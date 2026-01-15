import { inject } from '@angular/core';

export const authGuard = () => {
  console.log('🛡️ Guard ejecutado - Permitiendo acceso');
  return true;
};