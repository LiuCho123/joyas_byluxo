package com.liucho.backend.Service;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Transaccion;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.TransaccionRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    @Autowired
    private JoyaRepository joyaRepository;

    @Autowired
    private TransaccionRepository transaccionRepository;

    public ByteArrayInputStream exportarExcelCompleto() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // --- ESTILOS ---
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLACK.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ==========================================
            // HOJA 1: INVENTARIO DE JOYAS
            // ==========================================
            String[] colJoyas = {
                    "Nombre", "Largo", "Peso", "Precio", "Oferta", "Stock", "Categoría",
                    "Estado Instagram", "Ult. Fecha IG", "Formato IG",
                    "Estado Tiktok", "Ult. Fecha TikTok", "Formato TikTok",
                    "Estado Marketplace", "Ult. Fecha Subida", "Conversación Marketplace",
                    "Catalogo Whatsapp", "Estado Whatsapp"
            };

            Sheet sheetJoyas = workbook.createSheet("Joyas");
            Row rowCabeceraJoyas = sheetJoyas.createRow(0);
            for (int col = 0; col < colJoyas.length; col++) {
                Cell cell = rowCabeceraJoyas.createCell(col);
                cell.setCellValue(colJoyas[col]);
                cell.setCellStyle(headerCellStyle);
            }

            List<Joya> joyas = joyaRepository.findAll();
            int rowIdxJ = 1;
            for (Joya joya : joyas) {
                Row row = sheetJoyas.createRow(rowIdxJ++);
                row.createCell(0).setCellValue(joya.getNombre() != null ? joya.getNombre() : "");
                row.createCell(1).setCellValue(joya.getLargo() != null ? joya.getLargo() + "cm" : "");
                row.createCell(2).setCellValue(joya.getPeso() != null ? joya.getPeso() + "g" : "");
                row.createCell(3).setCellValue(joya.getPrecio() != null ? joya.getPrecio() : 0);
                row.createCell(4).setCellValue(joya.getPrecioOferta() != null ? joya.getPrecioOferta() : 0);
                row.createCell(5).setCellValue(joya.getStock() != null ? joya.getStock().toString() : "");
                row.createCell(6).setCellValue(joya.getCategoria() != null ? joya.getCategoria() : "");

                EstadoRedes redes = joya.getEstadoRedes();
                if (redes != null) {
                    row.createCell(7).setCellValue(redes.getIgEstado() != null ? redes.getIgEstado() : "");
                    row.createCell(8).setCellValue(redes.getIgUltimaFecha() != null ? redes.getIgUltimaFecha() : "");
                    row.createCell(9).setCellValue(redes.getIgFormato() != null ? redes.getIgFormato() : "");
                    row.createCell(10).setCellValue(redes.getTkEstado() != null ? redes.getTkEstado() : "");
                    row.createCell(11).setCellValue(redes.getTkUltimaFecha() != null ? redes.getTkUltimaFecha() : "");
                    row.createCell(12).setCellValue(redes.getTkFormato() != null ? redes.getTkFormato() : "");
                    row.createCell(13).setCellValue(redes.getMkpEstado() != null ? redes.getMkpEstado() : "");
                    row.createCell(14).setCellValue(redes.getMkpUltimaFecha() != null ? redes.getMkpUltimaFecha() : "");
                    row.createCell(15).setCellValue(redes.getMkpConversacion() != null ? redes.getMkpConversacion() : "");
                    row.createCell(16).setCellValue(redes.getWspCatalogo() != null ? redes.getWspCatalogo() : "");
                    row.createCell(17).setCellValue(redes.getWspUltimaFecha() != null ? redes.getWspUltimaFecha() : "");
                }
            }
            for (int i = 0; i < colJoyas.length; i++) sheetJoyas.autoSizeColumn(i);

            // ==========================================
            // HOJAS 2+: FLUJOS MENSUALES
            // ==========================================
            String[] colFlujo = {"Fecha", "Tipo", "Categoria", "Detalle", "Entra", "Sale", "Saldo real", "Contabilidad (Comisión 10%)"};

            List<Transaccion> todasTransacciones = transaccionRepository.findAll();

            // Agrupar transacciones por Mes y Año (ej. "2026-07")
            Map<String, List<Transaccion>> transPorMes = todasTransacciones.stream()
                    .filter(t -> t.getFecha() != null)
                    .collect(Collectors.groupingBy(t -> {
                        String mes = t.getFecha().getMonth().name();
                        return "Flujo " + mes.substring(0, 1) + mes.substring(1).toLowerCase(); // Ej: "Flujo July"
                    }));

            for (Map.Entry<String, List<Transaccion>> entry : transPorMes.entrySet()) {
                Sheet sheetFlujo = workbook.createSheet(entry.getKey());
                Row rowCabeceraFlujo = sheetFlujo.createRow(0);
                for (int col = 0; col < colFlujo.length; col++) {
                    Cell cell = rowCabeceraFlujo.createCell(col);
                    cell.setCellValue(colFlujo[col]);
                    cell.setCellStyle(headerCellStyle);
                }

                int rowIdxF = 1;
                int saldoAcumulado = 0;

                // Ordenar por fecha cronológica antes de imprimir
                List<Transaccion> transOrdenadas = entry.getValue();
                transOrdenadas.sort((t1, t2) -> t1.getFecha().compareTo(t2.getFecha()));

                for (Transaccion t : transOrdenadas) {
                    Row row = sheetFlujo.createRow(rowIdxF++);
                    row.createCell(0).setCellValue(t.getFecha().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
                    row.createCell(1).setCellValue(t.getTipo() != null ? t.getTipo() : "");
                    row.createCell(2).setCellValue(t.getCategoria() != null ? t.getCategoria() : "");
                    row.createCell(3).setCellValue(t.getDetalle() != null ? t.getDetalle() : "");

                    int entra = t.getEntra() != null ? t.getEntra() : 0;
                    int sale = t.getSale() != null ? t.getSale() : 0;
                    saldoAcumulado = saldoAcumulado + entra - sale;

                    row.createCell(4).setCellValue(entra);
                    row.createCell(5).setCellValue(sale);
                    row.createCell(6).setCellValue(saldoAcumulado);

                    // Columna de comisión 10% (solo si aplica y no es null)
                    if (t.getComision() != null && t.getComision() > 0) {
                        row.createCell(7).setCellValue(t.getComision());
                    } else {
                        row.createCell(7).setCellValue("");
                    }
                }
                for (int i = 0; i < colFlujo.length; i++) sheetFlujo.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}