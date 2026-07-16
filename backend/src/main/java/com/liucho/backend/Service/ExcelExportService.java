package com.liucho.backend.Service;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Repository.JoyaRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {

    @Autowired
    private JoyaRepository joyaRepository;

    public ByteArrayInputStream exportarJoyas() throws IOException {
        String[] columns = {
                "Nombre", "Largo", "Peso", "Precio", "Oferta", "Stock", "Categoría",
                "Estado Instagram", "Ult. Fecha IG", "Formato IG",
                "Estado Tiktok", "Ult. Fecha TikTok", "Formato TikTok",
                "Estado Marketplace", "Ult. Fecha Subida", "Conversación Marketplace",
                "Catalogo Whatsapp", "Estado Whatsapp"
        };

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Hoja1");

            // Estilo de la cabecera (Fondo negro, texto blanco)
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLACK.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Crear la fila de cabecera
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Llenar datos
            List<Joya> joyas = joyaRepository.findAll();
            int rowIdx = 1;
            for (Joya joya : joyas) {
                Row row = sheet.createRow(rowIdx++);

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

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}