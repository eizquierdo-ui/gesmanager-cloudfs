import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  generateCotizacionHtml,
  generateCotizacionHtmlExtranjera,
  generateCotizacionHtmlConDescuento, // 1. Importar la nueva función
} from '../../utils/pdfGenerator';

const ImprimirCotizacionModal = ({ open, onClose, cotizacionData }) => {
  const [formatos, setFormatos] = useState({
    local: true,
    extranjera: false,
    localConDescuento: false,
  });

  const [opciones, setOpciones] = useState({
    incluirTotalExtranjero: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleFormatoChange = (event) => {
    setFormatos({
      ...formatos,
      [event.target.name]: event.target.checked,
    });
  };

  const handleOpcionChange = (event) => {
    setOpciones({
      ...opciones,
      [event.target.name]: event.target.checked,
    });
  };

  const generateSinglePdf = async (generatorFunction, fileNameSuffix = '', pdfOptions = {}) => {
    console.log(`Iniciando generación para sufijo: '${fileNameSuffix}'`, pdfOptions);
    
    const htmlString = generatorFunction(cotizacionData, pdfOptions);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '21cm';
    document.body.appendChild(container);
    container.innerHTML = htmlString;

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container.querySelector('.page'), {
        scale: 2,
        useCORS: true,
        logging: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const nombreArchivo = `Cotizacion_${cotizacionData.cotizacion.numero_cotizacion || 'SIN_NUMERO'}${fileNameSuffix}.pdf`;
    pdf.save(nombreArchivo);
    
    console.log(`Descarga iniciada para: ${nombreArchivo}`);
    document.body.removeChild(container);
  }

  const handleGeneratePdf = async () => {
    if (!cotizacionData || !cotizacionData.cotizacion) {
        alert("No se ha cargado una cotización completa para generar el PDF.");
        return;
    }
    if (!formatos.local && !formatos.extranjera && !formatos.localConDescuento) {
        alert("Debe seleccionar al menos un formato para generar el PDF.");
        return;
    }

    setIsGenerating(true);

    const pdfOptions = {
      incluirTotalExtranjero: opciones.incluirTotalExtranjero,
    };

    try {
        if (formatos.local) {
            await generateSinglePdf(generateCotizacionHtml, '', pdfOptions);
        }
        if (formatos.extranjera) {
            await generateSinglePdf(generateCotizacionHtmlExtranjera, '-extranjera', {}); // Opciones no aplican aquí
        }
        // 2. Conectar la nueva función
        if (formatos.localConDescuento) {
           await generateSinglePdf(generateCotizacionHtmlConDescuento, '-con-descuento', pdfOptions);
        }

    } catch (error) {
        console.error("Error detallado al generar el PDF:", error);
        alert(`Hubo un problema al generar el PDF. Mensaje: ${error.message}.\n\nRevise la consola del navegador (F12) para más detalles técnicos.`);
    } finally {
        setIsGenerating(false);
        onClose();
        console.log("Proceso de generación de PDF finalizado.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Imprimir Cotización
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'medium' }}>
            Formatos de Impresión
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={formatos.local} onChange={handleFormatoChange} name="local" />}
              label="Formato Moneda Local"
            />
            <FormControlLabel
              control={<Checkbox checked={formatos.localConDescuento} onChange={handleFormatoChange} name="localConDescuento" />}
              label="Formato Moneda Local con Descuento"
            />
            <FormControlLabel
              control={<Checkbox checked={formatos.extranjera} onChange={handleFormatoChange} name="extranjera" />}
              label="Formato Moneda Extranjera"
            />
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Opciones Adicionales
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={opciones.incluirTotalExtranjero} 
                  onChange={handleOpcionChange} 
                  name="incluirTotalExtranjero" 
                  disabled={!formatos.local && !formatos.localConDescuento}
                />
              }
              label="Incluir línea de total en Moneda Extranjera"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="secondary" disabled={isGenerating}>
          Cancelar
        </Button>
        <Button onClick={handleGeneratePdf} variant="contained" color="primary" disabled={isGenerating} sx={{ minWidth: '140px' }}>
          {isGenerating ? <CircularProgress size={24} color="inherit" /> : 'Generar PDF(s)'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImprimirCotizacionModal;
