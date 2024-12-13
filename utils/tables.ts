export const getTableShowable = (tableNo: number) => {
  if (tableNo >= 1 && tableNo <= 100) return `M${tableNo}`;
  if (tableNo >= 101 && tableNo <= 106) return `P${tableNo}`;
  if (tableNo >= 107 && tableNo <= 110) return `S${tableNo - 106}`;
  return tableNo.toString();
};
