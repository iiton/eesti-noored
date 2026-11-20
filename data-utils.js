// Shared by the data pipeline, browser and regression checks. Never coerce missing data to zero.
export const finite = value => typeof value === 'number' && Number.isFinite(value);
export const difference = (a, b) => finite(a) && finite(b) ? a - b : null;
export const ratio = (a, b) => finite(a) && finite(b) && b !== 0 ? 100 * a / b : null;
export const gap = (men, women) => ratio(difference(men, women), men);
export const sum = values => values.length && values.every(finite) ? values.reduce((a, b) => a + b, 0) : null;

// Split lines at method boundaries WITHOUT inventing dates or discarding observations.
export function splitAtBreaks(years, values, breaks) {
 const active = [...new Set(breaks)].filter(b => years.some(y => +y < b) && years.some(y => +y >= b)).sort((a,b) => a-b);
 return Array.from({length:active.length+1}, (_, segment) => values.map((v,i) => {
  const part = active.filter(b => +years[i] >= b).length;
  return part === segment ? v : null;
 })).filter(values => values.some(finite));
}

export const flagLabel = flag => [flag?.includes('b') ? 'b: metoodikakatkestus' : '', flag?.includes('u') ? 'u: madal usaldusväärsus' : ''].filter(Boolean).join('; ');
