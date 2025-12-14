export const getTableShowable = (tableNo: number) => {
  if (tableNo >= 1 && tableNo <= 92) return `M${tableNo}`;
  if (tableNo >= 93 && tableNo <= 100) return `P${tableNo}`;
  if (tableNo == 101) return "Mozo";
  if (tableNo == 102) return "Art.";
  if (tableNo == 103) return "Semi.";
  return tableNo.toString();
};

export const isVoucherTable = (tableNo: number): boolean =>
  [101, 102, 103].includes(tableNo);
