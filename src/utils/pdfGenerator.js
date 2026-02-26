const formatCurrency = (value, decimals = 2) => {
    const number = parseFloat(value) || 0;
    return number.toLocaleString('es-GT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const nl2br = (str) => {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/\n/g, '<br />');
};

// ######### PLANTILLA 1: MONEDA LOCAL (SIMPLE) #########
export const generateCotizacionHtml = (data, options = {}) => {
    const { cotizacion, cliente, items, totales, financiero, monedas, formaPago, terminosCondiciones } = data;
    const { incluirTotalExtranjero } = options;

    const monedaBase = monedas.find(m => m.id === financiero.moneda_base_id) || { simbolo: 'Q.', moneda: 'Quetzales' };
    const fechaFormateada = new Date(cotizacion.fecha_emision.seconds * 1000).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const itemsHtml = items.map(item => {
        const isItp = String(item.itp_servicio).toLowerCase() === 'true';
        return `
        <tr>
            <td class="itp-col">${isItp ? '✔' : '&nbsp;'}</td>
            <td class="cantidad-col">${item.cantidad}</td>
            <td class="descripcion-col">
                <strong>${item.nombre_servicio || ''}</strong><br>
                <span class="detalle-servicio">${nl2br(item.detalle_queincluyeservicio || '')}</span>
            </td>
            <td class="preciofinal-col">${formatCurrency(item.precio_venta_final_linea, 4)}</td> 
            <td class="total-col">${formatCurrency(item.total_linea, 2)}</td>
        </tr>
    `}).join('');

    const terminosConversionHtml = `<br>Tipo de cambio es de $ 1.00 por Q. ${formatCurrency(financiero.tasa_venta, 4)}`;

    return `
        <!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cotización ${cotizacion.numero_cotizacion}</title><style>${commonStyles}
        /* Estilos específicos para esta plantilla */
        .detail-table .itp-col { width: 5%; }
        .detail-table .cantidad-col { width: 8%; }
        .detail-table .descripcion-col { width: 57%; }
        .detail-table .preciofinal-col { width: 15%; }
        .detail-table .total-col { width: 15%; }
        </style></head><body><div class="page">
            ${getHeader(cotizacion, fechaFormateada)}
            ${getInfoTable(cliente, monedaBase)}
            <p class="intro-text">A continuación encontrará la propuesta de servicios:</p>
            <table class="detail-table">
                <thead><tr>
                    <th class="itp-col">ITP</th>
                    <th class="cantidad-col">CANTIDAD</th>
                    <th class="descripcion-col">DESCRIPCIÓN</th>
                    <th class="preciofinal-col">PRECIO VENTA</th>
                    <th class="total-col">TOTAL ${monedaBase.simbolo}</th>
                </tr></thead>
                <tbody>${itemsHtml}<tr class="table-footer"><td colspan="4">TOTAL:</td><td class="total-col">${formatCurrency(totales.total_cotizacion_final, 2)}</td></tr></tbody>
            </table>
            ${getTotalsSection(totales, monedaBase, financiero, monedas, { incluirTotalExtranjero })}
            ${getFooter(terminosCondiciones, terminosConversionHtml, formaPago)}
        </div></body></html>`;
};

// ######### PLANTILLA 2: MONEDA LOCAL (CON DESCUENTO) #########
export const generateCotizacionHtmlConDescuento = (data, options = {}) => {
    const { cotizacion, cliente, items, totales, financiero, monedas, formaPago, terminosCondiciones } = data;
    const { incluirTotalExtranjero } = options;

    const monedaBase = monedas.find(m => m.id === financiero.moneda_base_id) || { simbolo: 'Q.', moneda: 'Quetzales' };
    const fechaFormateada = new Date(cotizacion.fecha_emision.seconds * 1000).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let sum_precio_venta_base = 0;
    const itemsHtml = items.map(item => {
        sum_precio_venta_base += (item.precio_venta_base_linea || 0) * (item.cantidad || 0);
        const isItp = String(item.itp_servicio).toLowerCase() === 'true';
        return `
        <tr>
            <td class="itp-col">${isItp ? '✔' : '&nbsp;'}</td>
            <td class="cantidad-col">${item.cantidad}</td>
            <td class="descripcion-col">
                <strong>${item.nombre_servicio || ''}</strong><br>
                <span class="detalle-servicio">${nl2br(item.detalle_queincluyeservicio || '')}</span>
            </td>
            <td class="preciobase-col">${formatCurrency(item.precio_venta_base_linea, 4)}</td>
            <td class="descuento-col">${formatCurrency(item.tasa_descuento_aplicada, 4)}</td>
            <td class="total-col">${formatCurrency(item.total_linea, 2)}</td>
        </tr>
        `
    }).join('');

    const terminosConversionHtml = `<br>Tipo de cambio es de $ 1.00 por Q. ${formatCurrency(financiero.tasa_venta, 4)}`;

    return `
        <!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cotización ${cotizacion.numero_cotizacion}</title><style>${commonStyles}
        /* Estilos específicos para esta plantilla */
        .detail-table .itp-col { width: 4%; }
        .detail-table .cantidad-col { width: 7%; }
        .detail-table .descripcion-col { width: 42%; }
        .detail-table .preciobase-col { width: 14%; }
        .detail-table .descuento-col { width: 10%; }
        .detail-table .total-col { width: 13%; }
        </style></head><body><div class="page">
            ${getHeader(cotizacion, fechaFormateada)}
            ${getInfoTable(cliente, monedaBase)}
            <p class="intro-text">A continuación encontrará la propuesta de servicios:</p>
            <table class="detail-table">
                <thead><tr>
                    <th class="itp-col">ITP</th>
                    <th class="cantidad-col">CANTIDAD</th>
                    <th class="descripcion-col">DESCRIPCIÓN</th>
                    <th class="preciobase-col">PRECIO VENTA</th>
                    <th class="descuento-col">% DESC.</th>
                    <th class="total-col">TOTAL ${monedaBase.simbolo}</th>
                </tr></thead>
                <tbody>${itemsHtml}
                    <tr class="table-footer">
                        <td colspan="3">TOTAL:</td>
                        <td class="preciobase-col">${formatCurrency(sum_precio_venta_base, 2)}</td>
                        <td class="descuento-col"></td>
                        <td class="total-col">${formatCurrency(totales.total_cotizacion_final, 2)}</td>
                    </tr>
                </tbody>
            </table>
            ${getTotalsSection(totales, monedaBase, financiero, monedas, { incluirTotalExtranjero, conDescuento: true, sum_precio_venta_base })}
            ${getFooter(terminosCondiciones, terminosConversionHtml, formaPago)}
        </div></body></html>`;
}

// ######### PLANTILLA 3: MONEDA EXTRANJERA #########
export const generateCotizacionHtmlExtranjera = (data) => {
    const { cotizacion, cliente, items, totales, financiero, monedas, formaPago, terminosCondiciones } = data;

    const monedaBase = monedas.find(m => m.id === financiero.moneda_base_id) || { simbolo: 'Q.', moneda: 'Quetzales' };
    const monedaDestino = monedas.find(m => m.id === financiero.moneda_destino_id) || { simbolo: '$', moneda: 'Dólares' };
    const fechaFormateada = new Date(cotizacion.fecha_emision.seconds * 1000).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const tasaCompra = financiero.tasa_compra || 1;

    const total_cotizacion_destino = (totales.total_cotizacion_final || 0) / tasaCompra;
    const total_iva_destino = (totales.monto_iva_total || 0) / tasaCompra;
    const subtotal_sin_impuestos_destino = total_cotizacion_destino - total_iva_destino;
    const total_tp_destino = (totales.monto_tp_total || 0) / tasaCompra;
    const total_subtotal_final_destino = subtotal_sin_impuestos_destino - total_tp_destino;

    let totalColumnaDestino = 0;
    const itemsHtml = items.map(item => {
        const isItp = String(item.itp_servicio).toLowerCase() === 'true';
        const precio_venta_final_destino = (item.precio_venta_final_linea || 0) / tasaCompra;
        const total_linea_destino = (item.total_linea || 0) / tasaCompra;
        totalColumnaDestino += parseFloat(total_linea_destino.toFixed(2));

        return `
        <tr>
            <td class="itp-col">${isItp ? '✔' : '&nbsp;'}</td>
            <td class="cantidad-col">${item.cantidad}</td>
            <td class="descripcion-col">
                <strong>${item.nombre_servicio || ''}</strong><br>
                <span class="detalle-servicio">${nl2br(item.detalle_queincluyeservicio || '')}</span>
            </td>
            <td class="preciofinal-col">${formatCurrency(precio_venta_final_destino, 4)}</td> 
            <td class="total-col">${formatCurrency(total_linea_destino, 2)}</td>
        </tr>
    `}).join('');

    const terminosConversionHtml = `<br>Tipo de cambio es de $ 1.00 por Q. ${formatCurrency(financiero.tasa_venta, 4)}`;

    const totalsForeignRows = `
        <tr>
            <td class="label total-final">TOTAL COTIZACIÓN:</td>
            <td class="value total-final">${monedaDestino.simbolo} ${formatCurrency(total_cotizacion_destino, 2)}</td>
        </tr>
        <tr>
            <td class="label deduccion">(-) Total IVA:</td>
            <td class="value deduccion">${monedaDestino.simbolo} ${formatCurrency(total_iva_destino, 2)}</td>
        </tr>
        <tr>
            <td class="label subtotal-tp-line">SubTotal Sin TP: ${monedaDestino.simbolo} ${formatCurrency(subtotal_sin_impuestos_destino, 2)} <span class="deduccion">(-) Timbre Prensa:</span></td>
            <td class="value deduccion subtotal-tp-line">${monedaDestino.simbolo} ${formatCurrency(total_tp_destino, 2)}</td> 
        </tr>
        <tr>
            <td class="label">Sub Total:</td>
            <td class="value">${monedaDestino.simbolo} ${formatCurrency(total_subtotal_final_destino, 2)}</td>
        </tr>
    `;

    return `
        <!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cotización ${cotizacion.numero_cotizacion}</title><style>${commonStyles}
        /* Estilos específicos para esta plantilla */
        .detail-table .itp-col { width: 5%; }
        .detail-table .cantidad-col { width: 8%; }
        .detail-table .descripcion-col { width: 57%; }
        .detail-table .preciofinal-col { width: 15%; }
        .detail-table .total-col { width: 15%; }
        .base-ref-line { font-size: 9px; margin-top: -10px; margin-bottom: 5px; text-align: right; color: #555;}
        .subtotal-tp-line { border-bottom: 1px solid #e6e6e6; }
        </style></head><body><div class="page">
            ${getHeader(cotizacion, fechaFormateada)}
            <table class="info-table" style="border: 1px solid #000;">
                <tr>
                    <td class="label">CLIENTE:</td><td class="value">${cliente.nombre_cliente || ''}</td>
                    <td class="label">NIT:</td><td class="value">${(cliente.nit_cliente == "0" || !cliente.nit_cliente) ? 'C/F' : cliente.nit_cliente}</td>
                </tr><tr>
                    <td class="label">ATENCIÓN A:</td><td class="value">${cliente.contacto_principal?.nombre || 'N/A'}</td>
                    <td class="label">DIRECCIÓN:</td><td class="value">${cliente.direccion_cliente || 'N/A'}</td>
                </tr><tr>
                    <td class="label">MONEDA DESTINO:</td><td class="value">(${monedaDestino.simbolo}) ${monedaDestino.moneda}</td>
                    <td class="label"></td><td class="value"></td>
                </tr>
            </table>
            <p class="base-ref-line">Moneda Base: ${monedaBase.simbolo} ${monedaBase.moneda} | Tasa de Compra: ${formatCurrency(financiero.tasa_compra, 4)}</p>
            <p class="intro-text">A continuación encontrará la propuesta de servicios:</p>
            <table class="detail-table"><thead><tr>
                    <th class="itp-col">ITP</th>
                    <th class="cantidad-col">CANTIDAD</th>
                    <th class="descripcion-col">DESCRIPCIÓN</th>
                    <th class="preciofinal-col">PRECIO VENTA (${monedaDestino.simbolo})</th>
                    <th class="total-col">TOTAL (${monedaDestino.simbolo})</th>
            </tr></thead>
                <tbody>${itemsHtml}<tr class="table-footer"><td colspan="4">TOTAL:</td><td class="total-col">${formatCurrency(totalColumnaDestino, 2)}</td></tr></tbody>
            </table>
            <div class="totals-container"><table class="totals-box">${totalsForeignRows}</table></div>
            ${getFooter(terminosCondiciones, terminosConversionHtml, formaPago)}
        </div></body></html>`;
};


// ######### COMPONENTES HTML REUTILIZABLES #########

const commonStyles = `
    body { font-family: sans-serif; margin: 0; padding: 0; font-size: 10px; background-color: white; }
    .page { width: 21cm; min-height: 29.7cm; padding: 1.5cm; margin: 1cm auto; border: 1px #D3D3D3 solid; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
    .header { margin-bottom: 5px; }
    .logo { width: 110px; height: auto; }
    .info-table, .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .info-table td { padding: 5px 0; vertical-align: top; }
    .info-table .label { font-weight: bold; width: 15%; padding-left: 5px; }
    .info-table .value { width: 35%; }
    .detail-table th, .detail-table td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top; }
    .detail-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
    .detail-table .detalle-servicio { font-size: 9px; padding-left: 0px; }
    .detail-table .preciobase-col, .detail-table .descuento-col, .detail-table .preciofinal-col, .detail-table .total-col { text-align: right; }
    .detail-table .itp-col, .detail-table .cantidad-col { text-align: center; }
    .table-footer { background-color: #f2f2f2; font-weight: bold; }
    .table-footer td { text-align: right; }
    .totals-container { width: 400px; margin-left: auto; margin-right: 0; margin-top: 20px; }
    .totals-box { width: 100%; border-collapse: collapse; }
    .totals-box td { padding: 5px; font-weight: bold; }
    .totals-box .label { text-align: left; background-color: #e6e6e6; width: 65%; }
    .totals-box .value { text-align: right; width: 35%; }
    .total-final { background-color: #cccccc !important; font-size: 12px; }
    .deduccion { color: red; }
    .intro-text { margin-top: 10px; font-weight: bold; margin-bottom: 10px; padding-left: 0px; }
    .notes-payment-container { margin-top: 30px; font-size: 9px; }
    .notes-payment-container > div { border: 1px solid #ccc; padding: 5px; min-height: 40px; }
    .final-divider-table { width: 100%; border-collapse: collapse; margin-top: 30px; margin-bottom: 50px; font-size: 10px; font-weight: bold; }
    .final-divider-table td { padding: 0; vertical-align: middle; }
    .final-divider-table .line { border-top: 1px solid #000; width: 45%; }
    .final-divider-table .text { white-space: nowrap; padding: 0 10px; width: auto; }
    .conversion-line { border-top: 1px dashed #bbbbbbff; padding-top: 10px; margin-top: 10px; font-size: 10px; text-align: right; }
    .conversion-line span { font-weight: bold; }
    .conversion-total { font-size: 12px; margin-left: 10px; }
`;

const getHeader = (cotizacion, fechaFormateada) => `
    <div class="header"><table style="width: 100%;"><tr>
        <td style="width: 50%; vertical-align: top; padding: 0;"><img src="/LogoVoice.png" class="logo"></td>
        <td style="width: 50%; text-align: right; vertical-align: top; padding: 0;">
            <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
                <img src="/RedesVoice.png" style="height: 55px; margin-bottom: 5px;">
                <div style="text-align: right; width: 100%;">
                    <h1 style="margin: 0; font-size: 16px;">COTIZACIÓN</h1>
                    <p style="margin: 0; font-size: 14px;">No. ${cotizacion.numero_cotizacion}</p>
                    <p style="margin: 0; font-size: 10px;">Fecha: ${fechaFormateada}</p>
                </div>
            </div>
        </td>
    </tr></table></div>`;

const getInfoTable = (cliente, monedaBase) => `
    <table class="info-table" style="border: 1px solid #000;"><tr>
            <td class="label">CLIENTE:</td><td class="value">${cliente.nombre_cliente || ''}</td>
            <td class="label">NIT:</td><td class="value">${(cliente.nit_cliente == "0" || !cliente.nit_cliente) ? 'C/F' : cliente.nit_cliente}</td>
        </tr><tr>
            <td class="label">ATENCIÓN A:</td><td class="value">${cliente.contacto_principal?.nombre || 'N/A'}</td>
            <td class="label">DIRECCIÓN:</td><td class="value">${cliente.direccion_cliente || 'N/A'}</td>
        </tr><tr>
            <td class="label">MONEDA BASE:</td><td class="value">(${monedaBase.simbolo}) ${monedaBase.moneda}</td>
            <td class="label"></td><td class="value"></td>
    </tr></table>`;

const getTotalsSection = (totales, monedaBase, financiero, monedas, options = {}) => {
    const { incluirTotalExtranjero, conDescuento, sum_precio_venta_base } = options;

    let rows = '';
    if (conDescuento) {
        rows = `
            <tr>
                <td class="label">Total base sin descuento:</td>
                <td class="value">${monedaBase.simbolo} ${formatCurrency(sum_precio_venta_base, 2)}</td>
            </tr>
            <tr>
                <td class="label deduccion">(-) Total Descuento:</td>
                <td class="value deduccion">${monedaBase.simbolo} ${formatCurrency(totales.total_descuento_aplicado, 2)}</td>
            </tr>
        `;
    }

    rows += `
        <tr>
            <td class="label total-final">TOTAL COTIZACIÓN:</td>
            <td class="value total-final">${monedaBase.simbolo} ${formatCurrency(totales.total_cotizacion_final, 2)}</td>
        </tr><tr>
            <td class="label deduccion">(-) Total IVA:</td>
            <td class="value deduccion">${monedaBase.simbolo} ${formatCurrency(totales.monto_iva_total, 2)}</td>
        </tr><tr>
            <td class="label" style="border-bottom: 1px solid #e6e6e6;">SubTotal TP: ${monedaBase.simbolo} ${formatCurrency(totales.sub_total_base_tp, 2)} <span class="deduccion">(-) Timbre Prensa:</span></td>
            <td class="value deduccion" style="border-bottom: 1px solid #e6e6e6;">${monedaBase.simbolo} ${formatCurrency(totales.monto_tp_total, 2)}</td>
        </tr><tr>
            <td class="label">Sub Total:</td>
            <td class="value">${monedaBase.simbolo} ${formatCurrency(totales.sub_total_sin_iva, 2)}</td>
        </tr>
    `;

    if (incluirTotalExtranjero) {
        const monedaDestino = monedas.find(m => m.id === financiero.moneda_destino_id) || { simbolo: '$', moneda: 'Dólares' };
        const totalEnDestino = (totales.total_cotizacion_final || 0) / (financiero.tasa_compra || 1);
        rows += `
            <tr>
                <td colspan="2" class="conversion-line">
                    <span>TOTAL EN:</span>
                    <span class="conversion-total">${monedaDestino.simbolo} ${formatCurrency(totalEnDestino, 2)}</span>
                </td>
            </tr>
        `;
    }

    return `<div class="totals-container"><table class="totals-box">${rows}</table></div>`;
}

const getFooter = (terminosCondiciones, terminosConversionHtml, formaPago) => `
    <div class="notes-payment-container">
        <p style="font-weight: bold;">Términos y Condiciones / Notas:</p>
        <div>${nl2br(terminosCondiciones || 'El precio incluye IVA.')}${terminosConversionHtml}</div>
        <p style="font-weight: bold; margin-top: 10px;">Información de Pago:</p>
        <div>${nl2br(formaPago || 'Cheques a nombre de VOICE, S.A.')}</div>
    </div>
    <table class="final-divider-table"><tr><td class="line"></td><td class="text">Última Línea</td><td class="line"></td></tr></table>`;
