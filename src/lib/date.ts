export function formatDateToDDMMYYYY(input: string | Date): string {
	const d = typeof input === "string" ? new Date(input) : input;
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}
