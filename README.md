# Mis finanzas

Aplicación personal en español para registrar ingresos, egresos, cuentas, compras en cuotas y gastos compartidos. Primera versión, sin dependencias externas, con Node.js 24 o posterior.

## Probar en tu computadora

Instalá Node.js 24 o posterior y Git. Abrí una terminal y ejecutá:

```sh
git clone https://github.com/Andromata/mis-finanzas.git
cd mis-finanzas
npm ci
npm run dev
```

Con la terminal abierta, visitá http://localhost:3000 en el navegador de esa misma computadora. Para detener la aplicación presioná Ctrl+C. Si ya tenés el repositorio descargado, entrá a su carpeta y ejecutá `git pull`, `npm ci` y `npm run dev`.

## Desarrollo en el entorno en la nube

El checkout de este entorno está en `/workspace/mis-finanzas`. Ejecutá los mismos comandos npm desde esa carpeta.

`npm start` inicia sin vigilancia de archivos. `npm test` ejecuta pruebas de cálculos y una prueba real de la API con datos temporales. No hace falta instalar paquetes ni configurar credenciales. El servidor escucha por defecto solo en la interfaz local, puerto 3000; `PORT`, `HOST` y `DATA_DIR` permiten configurar el proceso.

Los datos se conservan en `.data/finances.json`, excluido de Git. Respaldá este archivo para conservar tus registros. La aplicación arranca vacía; el botón de ejemplos es opcional y solo funciona sin movimientos previos. Los ejemplos están claramente identificados.

## Qué incluye

- Cuentas bancarias, cuenta corriente, tarjetas, billeteras y efectivo; creación de cuentas.
- Ingresos y egresos manuales por fecha y categoría; importes en centavos para evitar errores de coma flotante.
- Cuotas mensuales desde el mes de la compra, conservando el importe total incluso cuando no se divide exactamente.
- Parte compartida por porcentaje y persona, con estado de cobro reversible.
- Resumen por mes y proyección del siguiente mes según compromisos ya cargados.
- Importación CSV con previsualización; vinculación explícita de coincidencias por cuenta, importe, tipo y fecha (hasta tres días). Vincular conserva cuotas y reparto del gasto existente.

CSV esperado (UTF-8, separado por comas; comillas dobles para descripciones con comas):

```csv
fecha,descripcion,importe,categoria
2026-11-05,Supermercado,25000.50,Supermercado
2026-11-06,Internet,35000,Servicios
```

Se admiten hasta 500 filas y 1 MB por archivo. Los importes son positivos, sin miles, con punto decimal. Cada fila nueva es un egreso en un pago. Para una compra en cuotas ya registrada manualmente, el importe a conciliar debe ser el total de esa compra; un resumen con cuotas individuales requiere conversión y revisión antes de importar.

## Alcance de esta versión

Una sola persona/espacio, pesos argentinos, sin autenticación ni conexión bancaria. Usar en un entorno privado; no exponer el servidor directamente a Internet. No incluye lectura de PDF, extracción automática de recibos, cierre/vencimiento de tarjetas, transferencias, saldos iniciales, gastos recurrentes, edición/eliminación ni pagos parciales de deudas. El neto de una cuenta refleja movimientos registrados, no el saldo bancario real. Marcar una deuda cobrada no crea un ingreso. La proyección no anticipa gastos no cargados ni repite ingresos. No es aún una aplicación de producción multiusuario.
