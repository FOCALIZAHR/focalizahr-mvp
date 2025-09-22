// test-nivel1.ts
import { DepartmentAdapter } from './src/lib/services/DepartmentAdapter';

console.log('====== PRUEBAS NIVEL 1 (NO DEBEN TENER CATEGORÍA) ======');
console.log('1. Gerencia General:', DepartmentAdapter.getGerenciaCategory('Gerencia General'));
console.log('2. CEO:', DepartmentAdapter.getGerenciaCategory('CEO'));
console.log('3. Presidente:', DepartmentAdapter.getGerenciaCategory('Presidente'));
console.log('4. Director General:', DepartmentAdapter.getGerenciaCategory('Director General'));

console.log('\n====== PRUEBAS NORMALES (DEBEN TENER CATEGORÍA) ======');
console.log('5. Ventas:', DepartmentAdapter.getGerenciaCategory('Ventas'));
console.log('6. Marketing:', DepartmentAdapter.getGerenciaCategory('Marketing'));
console.log('7. Recursos Humanos:', DepartmentAdapter.getGerenciaCategory('Recursos Humanos'));
console.log('8. Tecnología:', DepartmentAdapter.getGerenciaCategory('Tecnología'));

console.log('\n====== CASOS ESPECIALES ======');
console.log('9. Gerencia Comercial:', DepartmentAdapter.getGerenciaCategory('Gerencia Comercial'));
console.log('10. Gerencia de Ventas:', DepartmentAdapter.getGerenciaCategory('Gerencia de Ventas'));