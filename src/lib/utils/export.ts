interface ExportData {
    [key: string]: any;
}

export function exportToCSV(data: ExportData[], filename: string) {
    if (!data.length) {
        console.warn('No data to export');
        return;
    }

    try {
        // Get headers from the first object
        const headers = Object.keys(data[0]);
        
        // Convert data to CSV format
        const csvRows = [
            // Headers row
            headers.join(','),
            // Data rows
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Handle special characters and formatting
                    if (value === null || value === undefined) {
                        return '';
                    }
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    if (value instanceof Date) {
                        return value.toISOString();
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`Successfully exported ${data.length} rows to ${filename}.csv`);
    } catch (error) {
        console.error('Failed to export CSV:', error);
        throw new Error('Failed to export data to CSV');
    }
}
