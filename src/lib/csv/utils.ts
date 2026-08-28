import Papa from 'papaparse'
export function parseCSV(text:string){ return Papa.parse(text, { header:true, skipEmptyLines:true }) }
export function toCSV(rows:Record<string,any>[]){ return Papa.unparse(rows) }
