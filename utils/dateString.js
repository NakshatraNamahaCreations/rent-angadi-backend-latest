

const parseDate = (dateStr) => {
	const [day, month, year] = dateStr.split('-');
	// console.log(`day, month, year: `, day, month, year);
	// console.log(`new Date: `, new Date(`${year}-${month}-${day}`));
	return new Date(`${year}-${month}-${day}`);  // Create a new Date object in 'YYYY-MM-DD' format
}


export { parseDate };