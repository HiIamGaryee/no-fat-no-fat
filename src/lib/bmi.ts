export const calculateBMI = (heightCm: number | null, weightKg: number | null) => {
  if (!heightCm || !weightKg || heightCm < 100 || heightCm > 250 || weightKg < 25 || weightKg > 400) return null;
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
};

export const getBMICategory = (bmi: number | null) => {
  if (bmi === null) return "";
  if (bmi < 18.5) return "referenceLow";
  if (bmi < 25) return "referenceTypical";
  if (bmi < 30) return "referenceElevated";
  return "referenceHigh";
};
