import XLSX from "xlsx-js-style";

/** 将对象数组导出为 Excel 文件（前端生成，无需后端接口） */
export function exportToExcel(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
) {
  if (!rows.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
