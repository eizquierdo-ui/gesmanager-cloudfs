
import { doc, runTransaction, getDoc } from 'firebase/firestore';

/**
 * Obtiene el último número de cotización registrado y el próximo a usar para visualización.
 * Es una operación de solo lectura, rápida y no transaccional.
 * @param {object} db - La instancia de la base de datos de Firestore.
 * @param {string} empresaId - El ID de la empresa actual.
 * @returns {Promise<{ultima: string, proxima: string}>} Un objeto con el último y el próximo correlativo para mostrar.
 */
export const getDisplayCorrelativos = async (db, empresaId) => {
  if (!empresaId) {
    return { ultima: 'N/A', proxima: 'N/A' };
  }
  const correlativoRef = doc(db, 'correlativos', empresaId);
  try {
    const correlativoSnap = await getDoc(correlativoRef);
    if (!correlativoSnap.exists() || !correlativoSnap.data().correlativo_cotizaciones) {
      const anioActual = new Date().getFullYear();
      return {
        ultima: `${anioActual}-00000`,
        proxima: `${anioActual}-00001`,
      };
    }

    const { anio, ultimo_numero } = correlativoSnap.data().correlativo_cotizaciones;
    const ultimaFormateada = `${anio}-${String(ultimo_numero).padStart(5, '0')}`;
    const proximaFormateada = `${anio}-${String(ultimo_numero + 1).padStart(5, '0')}`;

    return {
      ultima: ultimaFormateada,
      proxima: proximaFormateada,
    };
  } catch (error) {
    console.error("Error al obtener correlativo para display:", error);
    return { ultima: 'Error', proxima: 'Error' };
  }
};

/**
 * Genera el próximo número de cotización de forma segura y atómica usando una transacción.
 * Se DEBE llamar solo al momento de GRABAR.
 * @param {object} db - La instancia de la base de datos de Firestore.
 * @param {string} empresaId - El ID de la empresa actual.
 * @param {Date} fechaEmision - La fecha de emisión de la cotización para determinar el año.
 * @returns {Promise<string>} El nuevo y único número de cotización formateado (ej: "2026-00001").
 */
export const getProximoNumeroCotizacion = async (db, empresaId, fechaEmision) => {
  if (!empresaId || !fechaEmision) {
    throw new Error("El ID de empresa y la fecha de emisión son requeridos.");
  }

  const correlativoRef = doc(db, 'correlativos', empresaId);
  const anioCotizacion = fechaEmision.getFullYear();

  try {
    const nuevoNumeroFormateado = await runTransaction(db, async (transaction) => {
      const correlativoDoc = await transaction.get(correlativoRef);

      let nuevoNumero = 1;
      let anioCorrelativo = anioCotizacion;

      if (!correlativoDoc.exists() || !correlativoDoc.data().correlativo_cotizaciones) {
        // El documento o el sub-objeto no existe, lo creamos.
        transaction.set(correlativoRef, {
          correlativo_cotizaciones: {
            anio: anioCorrelativo,
            ultimo_numero: nuevoNumero
          }
        }, { merge: true });

      } else {
        // El documento existe, aplicamos la lógica de reinicio anual.
        const data = correlativoDoc.data().correlativo_cotizaciones;
        if (anioCotizacion > data.anio) {
          // Año nuevo, reiniciamos el contador.
          anioCorrelativo = anioCotizacion;
          nuevoNumero = 1;
        } else {
          // Mismo año, solo incrementamos.
          anioCorrelativo = data.anio;
          nuevoNumero = data.ultimo_numero + 1;
        }
        transaction.update(correlativoRef, {
          'correlativo_cotizaciones.anio': anioCorrelativo,
          'correlativo_cotizaciones.ultimo_numero': nuevoNumero
        });
      }

      return `${anioCorrelativo}-${String(nuevoNumero).padStart(5, '0')}`;
    });

    return nuevoNumeroFormateado;

  } catch (error) {
    console.error("Error crítico en transacción de correlativo: ", error);
    throw new Error("No se pudo generar el número de cotización. La operación fue cancelada.");
  }
};
