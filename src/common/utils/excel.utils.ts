import * as ExcelJS from 'exceljs';

export function parseExcelDate(cell: ExcelJS.CellValue): Date | null {
    if (cell == null) return null;

    if (cell instanceof Date) return cell;

    if (typeof cell === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const jsDate = new Date(excelEpoch.getTime() + cell * 24 * 60 * 60 * 1000);
        return jsDate;
    }

    const str = cell.toString().trim();
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}