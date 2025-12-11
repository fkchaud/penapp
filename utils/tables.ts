export const getTableShowable = (tableNo: number) => {
  if (tableNo >= 1 && tableNo <= 100) return `M${tableNo}`;
  if (tableNo >= 101 && tableNo <= 106) return `P${tableNo}`;
  if (tableNo >= 107 && tableNo <= 110) return `S${tableNo - 106}`;
  if (tableNo == 111) return "Mozo";
  if (tableNo == 112) return "Art.";
  if (tableNo == 113) return "Semi.";
  return tableNo.toString();
};

export const isVoucherTable = (tableNo: number): boolean =>
  [111, 112, 113].includes(tableNo);
